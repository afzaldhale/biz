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
