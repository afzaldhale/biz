import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { canAddRecord } from '@/utils/planLimits';
import { decrementBusinessUsage, safeIncrementBusinessUsage } from '@/services/businessService';

export interface FeeRecord {
  id: string;
  title: string;
  description: string;
  studentName: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  notes?: string;
  createdAt?: string;
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

export async function addFee(businessId: string, fee: Omit<FeeRecord, 'id'>) {
  await canAddRecord(businessId, 'fees');
  const docRef = await addDoc(collection(getFirestoreDb(), `businesses/${businessId}/fees`), {
    ...fee,
    createdAt: fee.createdAt ?? new Date().toISOString(),
  });
  await safeIncrementBusinessUsage(businessId);
  return docRef.id;
}

export async function getFees(businessId: string): Promise<FeeRecord[]> {
  const feesQuery = query(
    collection(getFirestoreDb(), `businesses/${businessId}/fees`),
    orderBy('createdAt', 'desc'),
  );
  const snapshot = await getDocs(feesQuery);
  return snapshot.docs.map((feeDoc) => ({
    id: feeDoc.id,
    ...(feeDoc.data() as Omit<FeeRecord, 'id'>),
  }));
}

export async function getFeeById(businessId: string, feeId: string) {
  const feeDoc = await getDoc(doc(getFirestoreDb(), `businesses/${businessId}/fees`, feeId));
  return feeDoc.exists() ? { id: feeDoc.id, ...(feeDoc.data() as Omit<FeeRecord, 'id'>) } : null;
}

export async function updateFee(businessId: string, feeId: string, fee: Omit<FeeRecord, 'id'>) {
  await updateDoc(doc(getFirestoreDb(), `businesses/${businessId}/fees`, feeId), fee);
}

export async function deleteFee(businessId: string, feeId: string) {
  await deleteDoc(doc(getFirestoreDb(), `businesses/${businessId}/fees`, feeId));
  await decrementBusinessUsage(businessId);
}
