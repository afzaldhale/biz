import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { canAddRecord } from '@/utils/planLimits';
import { decrementBusinessUsage, safeIncrementBusinessUsage } from '@/services/businessService';
import { GenericBusinessRecord } from '@/types';

function ensureFirebaseConfigured() {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase environment variables are missing. Please configure NEXT_PUBLIC_FIREBASE_* values.');
  }
}

function getFirestoreDb() {
  ensureFirebaseConfigured();
  return db!;
}

export async function getBusinessRecords(
  businessId: string,
  collectionName: string,
): Promise<GenericBusinessRecord[]> {
  const snapshot = await getDocs(collection(getFirestoreDb(), `businesses/${businessId}/${collectionName}`));
  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...(docSnapshot.data() as Omit<GenericBusinessRecord, 'id'>),
  }));
}

export async function getBusinessRecordById(
  businessId: string,
  collectionName: string,
  recordId: string,
): Promise<GenericBusinessRecord | null> {
  const recordDoc = await getDoc(doc(getFirestoreDb(), `businesses/${businessId}/${collectionName}`, recordId));
  return recordDoc.exists()
    ? ({ id: recordDoc.id, ...(recordDoc.data() as Omit<GenericBusinessRecord, 'id'>) } as GenericBusinessRecord)
    : null;
}

export async function addBusinessRecord(
  businessId: string,
  collectionName: string,
  record: Omit<GenericBusinessRecord, 'id'>,
) {
  await canAddRecord(businessId, collectionName);
  const firestore = getFirestoreDb();
  const docRef = await addDoc(collection(firestore, `businesses/${businessId}/${collectionName}`), {
    ...record,
    createdAt: record.createdAt ?? new Date().toISOString(),
  });

  await safeIncrementBusinessUsage(businessId);
  return docRef.id;
}

export async function updateBusinessRecord(
  businessId: string,
  collectionName: string,
  recordId: string,
  record: Omit<GenericBusinessRecord, 'id'>,
) {
  await updateDoc(doc(getFirestoreDb(), `businesses/${businessId}/${collectionName}`, recordId), {
    ...record,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteBusinessRecord(
  businessId: string,
  collectionName: string,
  recordId: string,
) {
  await deleteDoc(doc(getFirestoreDb(), `businesses/${businessId}/${collectionName}`, recordId));
  await decrementBusinessUsage(businessId);
}
