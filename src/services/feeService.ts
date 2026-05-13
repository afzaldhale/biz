import { addDoc, collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';

interface FeeRecord {
  id: string;
  createdAt?: string;
  [key: string]: unknown;
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

export async function addFee(businessId: string, fee: FeeRecord) {
  const docRef = await addDoc(collection(getFirestoreDb(), `businesses/${businessId}/fees`), {
    ...fee,
    createdAt: fee.createdAt ?? new Date().toISOString(),
  });
  return docRef.id;
}

export async function getFees(businessId: string) {
  const snapshot = await getDocs(collection(getFirestoreDb(), `businesses/${businessId}/fees`));
  return snapshot.docs.map((feeDoc) => ({ id: feeDoc.id, ...feeDoc.data() }));
}

export async function getFeeById(businessId: string, feeId: string) {
  const feeDoc = await getDoc(doc(getFirestoreDb(), `businesses/${businessId}/fees`, feeId));
  return feeDoc.exists() ? { id: feeDoc.id, ...feeDoc.data() } : null;
}
