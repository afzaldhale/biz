import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { createUserProfile } from '@/services/businessService';

export type SessionUser = User;

interface SignupPayload {
  email: string;
  password: string;
  ownerName: string;
  phone: string;
}

function ensureFirebaseConfigured() {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase environment variables are missing. Please configure NEXT_PUBLIC_FIREBASE_* values.'
    );
  }
}

function getFirebaseAuth() {
  ensureFirebaseConfigured();
  return auth!;
}

export async function refreshCurrentUserVerificationStatus() {
  const user = getFirebaseAuth().currentUser;

  if (!user) {
    return null;
  }

  await user.reload();
  await user.getIdToken(true);

  return {
    user: getFirebaseAuth().currentUser,
    emailVerified: getFirebaseAuth().currentUser?.emailVerified ?? false,
  };
}

export async function waitForVerifiedUser() {
  const refreshed = await refreshCurrentUserVerificationStatus();

  if (!refreshed?.user) {
    throw new Error('No authenticated user found.');
  }

  if (!refreshed.emailVerified) {
    return false;
  }

  return true;
}

export async function signupWithEmailVerification(payload: SignupPayload): Promise<UserCredential> {
  const firebaseAuth = getFirebaseAuth();
  const userCredential = await createUserWithEmailAndPassword(
    firebaseAuth,
    payload.email,
    payload.password
  );
  const user = userCredential.user;

  await updateProfile(user, {
    displayName: payload.ownerName,
  });

  await createUserProfile({
    uid: user.uid,
    ownerName: payload.ownerName,
    email: payload.email,
    phone: payload.phone,
  });

  await sendEmailVerification(user);

  return userCredential;
}

export async function reloadCurrentUser() {
  const refreshed = await refreshCurrentUserVerificationStatus();
  return refreshed?.user ?? null;
}

export async function loginUser(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  await refreshCurrentUserVerificationStatus();
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
