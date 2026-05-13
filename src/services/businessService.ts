import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { BusinessProfile } from '@/types';
import { db, isFirebaseConfigured } from '@/lib/firebase';

function ensureFirebaseConfigured() {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase environment variables are missing. Please configure NEXT_PUBLIC_FIREBASE_* values.');
  }
}

function getFirestoreDb() {
  ensureFirebaseConfigured();
  return db!;
}

export async function getBusinessProfile(businessId: string) {
  const businessDoc = await getDoc(doc(getFirestoreDb(), 'businesses', businessId));
  return businessDoc.exists() ? (businessDoc.data() as BusinessProfile) : null;
}

export async function saveBusinessProfile(profile: BusinessProfile) {
  await setDoc(doc(getFirestoreDb(), 'businesses', profile.businessId), profile, { merge: true });
  return profile;
}

export async function updateBusinessUsage(businessId: string, usage: number) {
  await updateDoc(doc(getFirestoreDb(), 'businesses', businessId), {
    currentUsage: usage,
    updatedAt: new Date().toISOString(),
  });
}
