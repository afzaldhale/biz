import {
  collection,
  doc,
  getDoc,
  runTransaction,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { BusinessProfile, BusinessType, PlanId, UserProfile } from '@/types';
import { INTERNAL_PRICE_PER_RECORD, MIN_RECORDS } from '@/utils/pricing';
import {
  calculateMonthlyPrice,
  calculateRemainingRecords,
  calculateNextBillingDate,
  normalizeSubscriptionBusinessData,
} from '@/utils/subscription';

interface CreateUserProfilePayload {
  uid: string;
  ownerName: string;
  email: string;
  phone: string;
}

interface SetupBusinessForUserPayload {
  uid: string;
  businessName: string;
  businessType: BusinessType;
  recordsLimit: number;
  estimatedRecords?: number;
}

interface CreateBusinessForUserPayload {
  uid: string;
  ownerName: string;
  businessName: string;
  email: string;
  phone: string;
  businessType: BusinessType;
  selectedPlan: PlanId;
  planLimit: number | null;
}

function ensureFirebaseConfigured() {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase environment variables are missing. Please configure NEXT_PUBLIC_FIREBASE_* values.'
    );
  }
}

function getFirestoreDb() {
  ensureFirebaseConfigured();
  return db!;
}

async function refreshVerifiedSession(uid: string) {
  const currentUser = auth?.currentUser;

  if (!currentUser || currentUser.uid !== uid) {
    throw new Error('Your session is out of date. Please sign in again and retry setup.');
  }

  await currentUser.reload();
  await currentUser.getIdToken(true);

  if (!currentUser.emailVerified) {
    throw new Error('Please verify your email before completing business setup.');
  }
}

export async function createUserProfile(payload: CreateUserProfilePayload) {
  const firestore = getFirestoreDb();
  const now = new Date().toISOString();
  const userRef = doc(firestore, 'users', payload.uid);

  const userProfile: UserProfile = {
    uid: payload.uid,
    ownerName: payload.ownerName,
    email: payload.email,
    phone: payload.phone,
    role: 'owner',
    emailVerified: false,
    onboardingCompleted: false,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(userRef, userProfile);
  return userProfile;
}

export async function setupBusinessForUser(payload: SetupBusinessForUserPayload) {
  await refreshVerifiedSession(payload.uid);

  const firestore = getFirestoreDb();
  const userRef = doc(firestore, 'users', payload.uid);
  const userProfile = await getUserProfile(payload.uid);

  if (!userProfile) {
    throw new Error('User profile not found for onboarding.');
  }

  const now = new Date().toISOString();
  const billableRecords = Math.max(payload.recordsLimit, MIN_RECORDS);
  const estimatedRecords = Math.max(payload.estimatedRecords ?? payload.recordsLimit, MIN_RECORDS);
  const monthlyPrice = billableRecords * INTERNAL_PRICE_PER_RECORD;
  const annualPrice = monthlyPrice * 12;
  const businessRef = userProfile.businessId
    ? doc(firestore, 'businesses', userProfile.businessId)
    : doc(collection(firestore, 'businesses'));

  const businessProfile: BusinessProfile = {
    businessId: businessRef.id,
    ownerId: payload.uid,
    ownerName: userProfile.ownerName,
    businessName: payload.businessName,
    businessType: payload.businessType,
    pricingModel: 'per_record',
    selectedPlan: 'usage_based',
    planLimit: billableRecords,
    recordLimit: billableRecords,
    currentUsage: 0,
    remainingRecords: billableRecords,
    minimumRecords: MIN_RECORDS,
    estimatedRecords,
    billableRecords,
    monthlyPrice,
    billingCycle: 'monthly',
    subscriptionStatus: 'active',
    subscriptionStartDate: now,
    currentPeriodStart: now,
    nextBillingDate: calculateNextBillingDate(now),
    lastPaymentDate: null,
    email: userProfile.email,
    phone: userProfile.phone,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  const batch = writeBatch(firestore);
  batch.set(businessRef, businessProfile);
  batch.update(userRef, {
    businessId: businessRef.id,
    businessName: payload.businessName,
    businessType: payload.businessType,
    estimatedRecords,
    billableRecords,
    recordsLimit: billableRecords,
    pricePerRecord: INTERNAL_PRICE_PER_RECORD,
    monthlyPrice,
    annualPrice,
    minimumRecords: MIN_RECORDS,
    pricingModel: 'per_record',
    billingModel: 'per_record',
    selectedPlan: 'usage_based',
    onboardingCompleted: true,
    emailVerified: true,
    updatedAt: now,
  });
  await batch.commit();

  return {
    userProfile: {
      ...userProfile,
      businessId: businessRef.id,
      businessName: payload.businessName,
      businessType: payload.businessType,
      estimatedRecords,
      billableRecords,
      recordsLimit: billableRecords,
      pricePerRecord: INTERNAL_PRICE_PER_RECORD,
      monthlyPrice,
      annualPrice,
      minimumRecords: MIN_RECORDS,
      pricingModel: 'per_record',
      billingModel: 'per_record',
      selectedPlan: 'usage_based',
      onboardingCompleted: true,
      emailVerified: true,
      updatedAt: now,
    },
    businessProfile,
  };
}

export async function getUserProfile(uid: string) {
  const userDoc = await getDoc(doc(getFirestoreDb(), 'users', uid));
  return userDoc.exists() ? (userDoc.data() as UserProfile) : null;
}

export async function getBusinessById(businessId: string) {
  const businessDoc = await getDoc(doc(getFirestoreDb(), 'businesses', businessId));
  if (!businessDoc.exists()) {
    return null;
  }

  const rawBusiness = businessDoc.data() as BusinessProfile;
  const normalized = normalizeSubscriptionBusinessData(rawBusiness);

  if (!normalized) {
    return null;
  }

  const needsMigration =
    rawBusiness.recordLimit !== normalized.recordLimit ||
    rawBusiness.planLimit !== normalized.planLimit ||
    rawBusiness.remainingRecords !== normalized.remainingRecords ||
    rawBusiness.monthlyPrice !== normalized.monthlyPrice ||
    rawBusiness.nextBillingDate !== normalized.nextBillingDate ||
    rawBusiness.subscriptionStartDate !== normalized.subscriptionStartDate ||
    rawBusiness.currentPeriodStart !== normalized.currentPeriodStart ||
    rawBusiness.billableRecords !== normalized.billableRecords ||
    rawBusiness.pricingModel !== normalized.pricingModel;

  if (needsMigration) {
    await setDoc(
      doc(getFirestoreDb(), 'businesses', businessId),
      {
        pricingModel: normalized.pricingModel,
        selectedPlan: normalized.selectedPlan,
        planLimit: normalized.planLimit,
        recordLimit: normalized.recordLimit,
        currentUsage: normalized.currentUsage,
        remainingRecords: normalized.remainingRecords,
        minimumRecords: normalized.minimumRecords,
        estimatedRecords: normalized.estimatedRecords,
        billableRecords: normalized.billableRecords,
        monthlyPrice: normalized.monthlyPrice,
        billingCycle: normalized.billingCycle,
        subscriptionStatus: normalized.subscriptionStatus,
        subscriptionStartDate: normalized.subscriptionStartDate,
        currentPeriodStart: normalized.currentPeriodStart,
        nextBillingDate: normalized.nextBillingDate,
        lastPaymentDate: normalized.lastPaymentDate ?? null,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  return normalized;
}

export async function getBusinessProfile(businessId: string) {
  return getBusinessById(businessId);
}

export async function saveBusinessProfile(profile: BusinessProfile) {
  const normalized = normalizeSubscriptionBusinessData(profile);
  await setDoc(doc(getFirestoreDb(), 'businesses', profile.businessId), normalized, { merge: true });
  return normalized;
}

export async function saveUserProfile(profile: UserProfile) {
  await setDoc(doc(getFirestoreDb(), 'users', profile.uid), profile, { merge: true });
  return profile;
}

export async function updateBusinessUsage(businessId: string, usage: number) {
  const business = await getBusinessById(businessId);
  const recordLimit = business?.recordLimit ?? business?.planLimit ?? MIN_RECORDS;
  await updateDoc(doc(getFirestoreDb(), 'businesses', businessId), {
    currentUsage: Math.max(0, usage),
    remainingRecords: calculateRemainingRecords(recordLimit, usage),
    updatedAt: new Date().toISOString(),
  });
}

export async function safeIncrementBusinessUsage(businessId: string, delta = 1) {
  await runTransaction(getFirestoreDb(), async (transaction) => {
    const businessRef = doc(getFirestoreDb(), 'businesses', businessId);
    const snapshot = await transaction.get(businessRef);
    if (!snapshot.exists()) {
      throw new Error('Business profile not found for usage update.');
    }

    const businessProfile = normalizeSubscriptionBusinessData(snapshot.data() as BusinessProfile);
    const currentUsage = businessProfile?.currentUsage ?? 0;
    const recordLimit = businessProfile?.recordLimit ?? businessProfile?.planLimit ?? MIN_RECORDS;

    if (currentUsage + delta > recordLimit) {
      throw new Error('You have reached your plan limit. Please upgrade to add more records.');
    }

    const nextUsage = currentUsage + delta;
    transaction.update(businessRef, {
      currentUsage: nextUsage,
      remainingRecords: calculateRemainingRecords(recordLimit, nextUsage),
      updatedAt: new Date().toISOString(),
    });
  });
}

export async function decrementBusinessUsage(businessId: string, delta = 1) {
  await runTransaction(getFirestoreDb(), async (transaction) => {
    const businessRef = doc(getFirestoreDb(), 'businesses', businessId);
    const snapshot = await transaction.get(businessRef);
    if (!snapshot.exists()) {
      throw new Error('Business profile not found for usage update.');
    }

    const businessProfile = normalizeSubscriptionBusinessData(snapshot.data() as BusinessProfile);
    const currentUsage = businessProfile?.currentUsage ?? 0;
    const recordLimit = businessProfile?.recordLimit ?? businessProfile?.planLimit ?? MIN_RECORDS;
    const nextUsage = Math.max(0, currentUsage - delta);

    transaction.update(businessRef, {
      currentUsage: nextUsage,
      remainingRecords: calculateRemainingRecords(recordLimit, nextUsage),
      updatedAt: new Date().toISOString(),
    });
  });
}

export async function markUserEmailVerified(uid: string) {
  const now = new Date().toISOString();
  await updateDoc(doc(getFirestoreDb(), 'users', uid), {
    emailVerified: true,
    updatedAt: now,
  });
}

export async function updateUserEmailVerified(uid: string) {
  await markUserEmailVerified(uid);
}

export async function activateBusinessAfterVerification(uid: string) {
  const userProfile = await getUserProfile(uid);

  if (!userProfile) {
    throw new Error('User profile not found.');
  }

  const now = new Date().toISOString();
  const firestore = getFirestoreDb();

  await updateDoc(doc(firestore, 'users', uid), {
    emailVerified: true,
    updatedAt: now,
  });

  if (userProfile.businessId) {
    try {
      const business = await getBusinessById(userProfile.businessId);
      if (business) {
        await updateDoc(doc(firestore, 'businesses', userProfile.businessId), {
          status: 'active',
          updatedAt: now,
        });
      }
    } catch {
      // Do not block verification completion if the linked business doc is missing or unreadable.
    }
  }

  return {
    userProfile: {
      ...userProfile,
      emailVerified: true,
      updatedAt: now,
    },
  };
}
