import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { BusinessType, PlanId } from '@/types';
import { createBusinessForUser } from '@/services/businessService';

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

export async function signupWithEmailVerification(payload: SignupPayload): Promise<UserCredential> {
  const firebaseAuth = getFirebaseAuth();
  const userCredential = await createUserWithEmailAndPassword(firebaseAuth, payload.email, payload.password);
  const user = userCredential.user;

  await createBusinessForUser({
    uid: user.uid,
    ownerName: payload.ownerName,
    businessName: payload.businessName,
    email: payload.email,
    phone: payload.phone,
    businessType: payload.businessType,
    selectedPlan: payload.selectedPlan,
    planLimit: payload.planLimit,
  });

  await sendEmailVerification(user);

  return userCredential;
}

export async function reloadCurrentUser() {
  const user = getFirebaseAuth().currentUser;

  if (!user) {
    return null;
  }

  await user.reload();
  await user.getIdToken(true);

  return getFirebaseAuth().currentUser;
}

export async function loginUser(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  await reloadCurrentUser();
  return credential;
}

export async function resendVerificationEmail() {
  const currentUser = getFirebaseAuth().currentUser;

  if (!currentUser) {
    throw new Error('No user is signed in.');
  }

  await sendEmailVerification(currentUser);
}

export async function logoutUser() {
  return signOut(getFirebaseAuth());
}

export function getCurrentSessionUser(): SessionUser | null {
  return auth?.currentUser ?? null;
}

export const signupWithEmail = signupWithEmailVerification;
export const loginWithEmail = loginUser;
