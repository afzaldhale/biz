import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { GymReceiptRecord } from '@/types';

function ensureFirebaseConfigured() {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase environment variables are missing. Please configure NEXT_PUBLIC_FIREBASE_* values.'
    );
  }
}

function getFirestoreDb() {
  ensureFirebaseConfigured();
  return db!;
}

export async function deleteGymReceipt(businessId: string, receiptId: string) {
  await deleteDoc(doc(getFirestoreDb(), 'businesses', businessId, 'gymReceipts', receiptId));
}

export async function getGymReceipts(businessId: string): Promise<GymReceiptRecord[]> {
  const snapshot = await getDocs(
    query(
      collection(getFirestoreDb(), 'businesses', businessId, 'gymReceipts'),
      orderBy('createdAt', 'desc'),
      orderBy('__name__', 'desc')
    )
  );

  return snapshot.docs.map((receiptDoc) => ({
    id: receiptDoc.id,
    ...(receiptDoc.data() as Omit<GymReceiptRecord, 'id'>),
  }));
}

export async function getGymReceiptsForMember(
  businessId: string,
  memberDocId: string
): Promise<GymReceiptRecord[]> {
  const receipts = await getGymReceipts(businessId);
  return receipts.filter((receipt) => receipt.memberDocId === memberDocId);
}
