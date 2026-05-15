import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { GymPaymentRecord } from '@/types';
import { canAddRecord } from '@/utils/planLimits';
import { decrementBusinessUsage, safeIncrementBusinessUsage } from '@/services/businessService';

function ensureFirebaseConfigured() {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase environment variables are missing. Please configure NEXT_PUBLIC_FIREBASE_* values.');
  }
}

function getFirestoreDb() {
  ensureFirebaseConfigured();
  return db!;
}

export async function addGymPayment(businessId: string, payment: GymPaymentRecord) {
  await canAddRecord(businessId, 'gymPayments');
  const docRef = await addDoc(collection(getFirestoreDb(), `businesses/${businessId}/gymPayments`), {
    ...payment,
    createdAt: payment.createdAt ?? new Date().toISOString(),
  });

  await safeIncrementBusinessUsage(businessId);
  return docRef.id;
}

export async function deleteGymPayment(businessId: string, paymentId: string) {
  await deleteDoc(doc(getFirestoreDb(), `businesses/${businessId}/gymPayments`, paymentId));
  await decrementBusinessUsage(businessId);
}

export async function getGymPayments(businessId: string): Promise<GymPaymentRecord[]> {
  const paymentsQuery = query(
    collection(getFirestoreDb(), `businesses/${businessId}/gymPayments`),
    orderBy('createdAt', 'desc'),
  );
  const snapshot = await getDocs(paymentsQuery);
  return snapshot.docs.map((paymentDoc) => ({
    id: paymentDoc.id,
    ...(paymentDoc.data() as Omit<GymPaymentRecord, 'id'>),
  }));
}

export async function getGymPaymentById(businessId: string, paymentId: string) {
  const paymentDoc = await getDoc(doc(getFirestoreDb(), `businesses/${businessId}/gymPayments`, paymentId));
  return paymentDoc.exists()
    ? ({ id: paymentDoc.id, ...(paymentDoc.data() as Omit<GymPaymentRecord, 'id'>) } as GymPaymentRecord)
    : null;
}

export async function getGymPaymentsForMember(
  businessId: string,
  memberDocId: string,
): Promise<GymPaymentRecord[]> {
  const paymentsQuery = query(
    collection(getFirestoreDb(), `businesses/${businessId}/gymPayments`),
    where('memberDocId', '==', memberDocId),
  );
  const snapshot = await getDocs(paymentsQuery);

  return snapshot.docs.map((paymentDoc) => ({
    id: paymentDoc.id,
    ...(paymentDoc.data() as Omit<GymPaymentRecord, 'id'>),
  }));
}
