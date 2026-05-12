import { readCachedStorage, removeCachedStorage, writeCachedStorage } from './storageCache';

export interface SessionUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
}

export interface StoredAuthSession {
  id: string;
  ownerName: string;
  businessName: string;
  email: string;
  phone: string;
  plan: string;
  businessType: string;
  recordsUsed: number;
  createdAt: string;
}

interface SignupPayload {
  email: string;
  password: string;
  ownerName: string;
  businessName: string;
  phone: string;
  businessType: string;
  selectedPlan: string;
  planLimit: number;
}

interface StoredUserProfile {
  userId: string;
  businessId: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const AUTH_KEY = 'bizmanage_auth';
const USERS_KEY = 'bizmanage_users';
const PASSWORDS_KEY = 'bizmanage_passwords';

function readRecord<T>(key: string): Record<string, T> {
  return readCachedStorage<Record<string, T>>(key, {});
}

function writeRecord<T>(key: string, value: Record<string, T>) {
  writeCachedStorage(key, value);
}

export function setCurrentSession(auth: StoredAuthSession) {
  writeCachedStorage(AUTH_KEY, auth);
}

export function getCurrentSessionAuth() {
  return readCachedStorage<StoredAuthSession | null>(AUTH_KEY, null);
}

export async function signupWithEmail(payload: SignupPayload): Promise<{ user: SessionUser }> {
  const userId = `user-${Date.now()}`;
  const now = new Date().toISOString();

  const users = readRecord<StoredUserProfile>(USERS_KEY);
  users[userId] = {
    userId,
    businessId: userId,
    name: payload.ownerName,
    email: payload.email,
    role: 'owner',
    createdAt: now,
  };
  writeRecord(USERS_KEY, users);

  const passwords = readRecord<string>(PASSWORDS_KEY);
  passwords[payload.email.toLowerCase()] = payload.password;
  writeRecord(PASSWORDS_KEY, passwords);

  setCurrentSession({
    id: userId,
    ownerName: payload.ownerName,
    businessName: payload.businessName,
    email: payload.email,
    phone: payload.phone,
    plan: payload.selectedPlan,
    businessType: payload.businessType,
    recordsUsed: 0,
    createdAt: now,
  });

  return {
    user: {
      uid: userId,
      email: payload.email,
      displayName: payload.ownerName,
    },
  };
}

export async function loginWithEmail(email: string, password: string): Promise<{ user: SessionUser }> {
  const passwords = readRecord<string>(PASSWORDS_KEY);
  const savedPassword = passwords[email.toLowerCase()];

  if (savedPassword && savedPassword !== password) {
    throw new Error('Invalid email or password');
  }

  const auth = getCurrentSessionAuth();
  if (!auth) {
    throw new Error('No local session found');
  }

  return {
    user: {
      uid: auth.id,
      email: auth.email,
      displayName: auth.ownerName,
    },
  };
}

export async function logoutUser() {
  removeCachedStorage(AUTH_KEY);
}

export async function getUserProfile(userId: string) {
  const users = readRecord<StoredUserProfile>(USERS_KEY);
  return users[userId] ?? null;
}

export function getCurrentSessionUser(): SessionUser | null {
  const auth = getCurrentSessionAuth();
  if (!auth) {
    return null;
  }

  return {
    uid: auth.id,
    email: auth.email,
    displayName: auth.ownerName,
  };
}
