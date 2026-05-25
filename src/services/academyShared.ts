import {
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  collection,
  doc,
  getFirestore,
  serverTimestamp,
  type FieldValue,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';

export function ensureFirebaseConfigured() {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase environment variables are missing. Please configure NEXT_PUBLIC_FIREBASE_* values.'
    );
  }
}

export function getFirestoreDb() {
  ensureFirebaseConfigured();
  return db ?? getFirestore();
}

export function academyCollection(businessId: string, name: string) {
  return collection(getFirestoreDb(), 'businesses', businessId, name);
}

export function academyDoc(businessId: string, name: string, id: string) {
  return doc(getFirestoreDb(), 'businesses', businessId, name, id);
}

export function isoNow() {
  return new Date().toISOString();
}

export function firestoreTimestamp(): FieldValue {
  return serverTimestamp();
}

export function normalizeDateValue(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      return (value as Timestamp).toDate().toISOString();
    } catch {
      return '';
    }
  }
  return String(value);
}

export function mapSnapshot<T>(
  snapshot: QueryDocumentSnapshot<DocumentData>,
  transform?: (data: Record<string, unknown>, id: string) => T
): T {
  const raw = snapshot.data() as Record<string, unknown>;
  if (transform) {
    return transform(raw, snapshot.id);
  }
  return { id: snapshot.id, ...raw } as T;
}

export function sumNumber(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

export function sortByCreatedAtDesc<T extends { createdAt?: string }>(records: T[]) {
  return [...records].sort((left, right) => {
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightTime - leftTime;
  });
}

export function isFirestoreIndexError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes('requires an index') || message.includes('failed-precondition');
}
