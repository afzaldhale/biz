import {
  collection,
  doc,
  getDoc,
  runTransaction,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { BusinessProfile, BusinessType, PlanId, UserProfile } from '@/types';
import { INTERNAL_PRICE_PER_RECORD, MIN_RECORDS } from '@/utils/pricing';

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
  const firestore = getFirestoreDb();
  const now = new Date().toISOString();
  const userRef = doc(firestore, 'users', payload.uid);
  const userProfile = await getUserProfile(payload.uid);

  if (!userProfile) {
    throw new Error('User profile not found for onboarding.');
  }

  const billableRecords = Math.max(payload.recordsLimit, MIN_RECORDS);
  const monthlyPrice = billableRecords * INTERNAL_PRICE_PER_RECORD;
  const annualPrice = monthlyPrice * 12;
  const businessRef = doc(collection(firestore, 'businesses'));

  const businessProfile: BusinessProfile = {
    businessId: businessRef.id,
    ownerId: payload.uid,
    ownerName: userProfile.ownerName,
    businessName: payload.businessName,
    businessType: payload.businessType,
    selectedPlan: 'custom',
    planLimit: billableRecords,
    currentUsage: 0,
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
    recordsLimit: billableRecords,
    pricePerRecord: INTERNAL_PRICE_PER_RECORD,
    monthlyPrice,
    annualPrice,
    billingModel: 'per_record',
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
      recordsLimit: billableRecords,
      pricePerRecord: INTERNAL_PRICE_PER_RECORD,
      monthlyPrice,
      annualPrice,
      billingModel: 'per_record',
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
  return businessDoc.exists() ? (businessDoc.data() as BusinessProfile) : null;
}

export async function getBusinessProfile(businessId: string) {
  return getBusinessById(businessId);
}

export async function saveBusinessProfile(profile: BusinessProfile) {
  await setDoc(doc(getFirestoreDb(), 'businesses', profile.businessId), profile, { merge: true });
  return profile;
}

export async function saveUserProfile(profile: UserProfile) {
  await setDoc(doc(getFirestoreDb(), 'users', profile.uid), profile, { merge: true });
  return profile;
}

export async function updateBusinessUsage(businessId: string, usage: number) {
  await updateDoc(doc(getFirestoreDb(), 'businesses', businessId), {
    currentUsage: usage,
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

    const businessProfile = snapshot.data() as BusinessProfile;
    const currentUsage =
      typeof businessProfile.currentUsage === 'number' ? businessProfile.currentUsage : 0;
    const planLimit =
      typeof businessProfile.planLimit === 'number' ? businessProfile.planLimit : null;

    if (
      businessProfile.selectedPlan !== 'custom' &&
      planLimit !== null &&
      currentUsage + delta > planLimit
    ) {
      throw new Error('You have reached your plan limit. Please upgrade to add more records.');
    }

    transaction.update(businessRef, {
      currentUsage: currentUsage + delta,
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

    const businessProfile = snapshot.data() as BusinessProfile;
    const currentUsage =
      typeof businessProfile.currentUsage === 'number' ? businessProfile.currentUsage : 0;
    const nextUsage = Math.max(0, currentUsage - delta);

    transaction.update(businessRef, {
      currentUsage: nextUsage,
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
  const batch = writeBatch(getFirestoreDb());
  batch.update(doc(getFirestoreDb(), 'users', uid), {
    emailVerified: true,
    updatedAt: now,
  });

  if (userProfile.businessId) {
    const business = await getBusinessById(userProfile.businessId);
    if (business) {
      batch.update(doc(getFirestoreDb(), 'businesses', userProfile.businessId), {
        status: 'active',
        updatedAt: now,
      });
    }
  }

  await batch.commit();

  return {
    userProfile: {
      ...userProfile,
      emailVerified: true,
      updatedAt: now,
    },
  };
}
