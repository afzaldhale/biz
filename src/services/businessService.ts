import {
  collection,
  doc,
  getDoc,
  runTransaction,
  setDoc,
  updateDoc,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { BusinessProfile, BusinessType, PlanId, UserProfile } from '@/types';

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
    throw new Error('Firebase environment variables are missing. Please configure NEXT_PUBLIC_FIREBASE_* values.');
  }
}

function getFirestoreDb() {
  ensureFirebaseConfigured();
  return db!;
}

export async function createBusinessForUser(payload: CreateBusinessForUserPayload) {
  const firestore = getFirestoreDb();
  const now = new Date().toISOString();
  const businessRef = doc(collection(firestore, 'businesses'));
  const userRef = doc(firestore, 'users', payload.uid);

  const userProfile: UserProfile = {
    uid: payload.uid,
    businessId: businessRef.id,
    ownerName: payload.ownerName,
    email: payload.email,
    phone: payload.phone,
    role: 'owner',
    emailVerified: false,
    createdAt: now,
    updatedAt: now,
  };

  const businessProfile: BusinessProfile = {
    businessId: businessRef.id,
    ownerId: payload.uid,
    ownerName: payload.ownerName,
    businessName: payload.businessName,
    businessType: payload.businessType,
    selectedPlan: payload.selectedPlan,
    planLimit: payload.planLimit,
    currentUsage: 0,
    email: payload.email,
    phone: payload.phone,
    status: 'pending_verification',
    createdAt: now,
    updatedAt: now,
  };

  const batch = writeBatch(firestore);
  batch.set(userRef, userProfile);
  batch.set(businessRef, businessProfile);
  await batch.commit();

  return { userProfile, businessProfile };
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
    const currentUsage = typeof businessProfile.currentUsage === 'number' ? businessProfile.currentUsage : 0;
    const planLimit = typeof businessProfile.planLimit === 'number' ? businessProfile.planLimit : null;

    if (businessProfile.selectedPlan !== 'custom' && planLimit !== null && currentUsage + delta > planLimit) {
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
    const currentUsage = typeof businessProfile.currentUsage === 'number' ? businessProfile.currentUsage : 0;
    const nextUsage = Math.max(0, currentUsage - delta);

    transaction.update(businessRef, {
      currentUsage: nextUsage,
      updatedAt: new Date().toISOString(),
    });
  });
}

export async function updateUserEmailVerified(uid: string) {
  await updateDoc(doc(getFirestoreDb(), 'users', uid), {
    emailVerified: true,
    updatedAt: new Date().toISOString(),
  });
}

export async function activateBusinessAfterVerification(uid: string) {
  const userProfile = await getUserProfile(uid);

  if (!userProfile?.businessId) {
    throw new Error('User profile is missing a business mapping.');
  }

  const business = await getBusinessById(userProfile.businessId);

  if (!business) {
    throw new Error('Business profile was not found.');
  }

  const now = new Date().toISOString();

  const batch = writeBatch(getFirestoreDb());
  batch.update(doc(getFirestoreDb(), 'users', uid), {
    emailVerified: true,
    updatedAt: now,
  });
  batch.update(doc(getFirestoreDb(), 'businesses', userProfile.businessId), {
    status: 'active',
    updatedAt: now,
  });
  await batch.commit();

  return {
    userProfile: {
      ...userProfile,
      emailVerified: true,
      updatedAt: now,
    },
    business: {
      ...business,
      status: 'active' as const,
      updatedAt: now,
    },
  };
}
