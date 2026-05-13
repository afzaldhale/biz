import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { BusinessType, PlanId } from '@/types';

export type SessionUser = User;

interface SignupPayload {
  email: string;
  password: string;
  ownerName: string;
  businessName: string;
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

function getFirebaseAuth() {
  ensureFirebaseConfigured();
  return auth!;
}

function getFirebaseDb() {
  ensureFirebaseConfigured();
  return db!;
}

export async function signupWithEmail(payload: SignupPayload): Promise<UserCredential> {
  const firebaseAuth = getFirebaseAuth();
  const firestore = getFirebaseDb();
  const userCredential = await createUserWithEmailAndPassword(firebaseAuth, payload.email, payload.password);
  const user = userCredential.user;
  const now = new Date().toISOString();

  await setDoc(doc(firestore, 'users', user.uid), {
    userId: user.uid,
    businessId: user.uid,
    name: payload.ownerName,
    email: payload.email,
    role: 'owner',
    createdAt: now,
  });

  await setDoc(doc(firestore, 'businesses', user.uid), {
    businessId: user.uid,
    ownerId: user.uid,
    ownerName: payload.ownerName,
    businessName: payload.businessName,
    businessType: payload.businessType,
    selectedPlan: payload.selectedPlan,
    planLimit: payload.planLimit,
    currentUsage: 0,
    email: payload.email,
    phone: payload.phone,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  });

  return userCredential;
}

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(getFirebaseAuth(), email, password);
}

export async function logoutUser() {
  return signOut(getFirebaseAuth());
}

export async function getUserProfile(userId: string) {
  const userDoc = await getDoc(doc(getFirebaseDb(), 'users', userId));
  return userDoc.exists() ? userDoc.data() : null;
}

export function getCurrentSessionUser(): SessionUser | null {
  return auth?.currentUser ?? null;
}
