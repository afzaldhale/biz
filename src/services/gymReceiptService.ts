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

function normalizeGymReceipt(
  rawReceipt: Partial<GymReceiptRecord> & Record<string, unknown>,
  documentId: string
): GymReceiptRecord {
  const resolvedMemberId =
    String(rawReceipt.memberId ?? rawReceipt.memberDocId ?? '').trim() || documentId;
  const resolvedMemberCode =
    String(rawReceipt.memberCode ?? rawReceipt.memberId ?? rawReceipt.memberDocId ?? '').trim() ||
    resolvedMemberId;

  return {
    id: documentId,
    receiptId: String(rawReceipt.receiptId ?? documentId),
    receiptNumber: String(rawReceipt.receiptNumber ?? rawReceipt.paymentId ?? documentId),
    paymentId: String(rawReceipt.paymentId ?? ''),
    memberDocId: String(rawReceipt.memberDocId ?? resolvedMemberId),
    memberId: resolvedMemberId,
    memberCode: resolvedMemberCode,
    memberName: String(rawReceipt.memberName ?? ''),
    amount: Number(rawReceipt.amount ?? 0),
    paymentDate: String(rawReceipt.paymentDate ?? ''),
    paymentMethod: (rawReceipt.paymentMethod as GymReceiptRecord['paymentMethod']) ?? 'cash',
    businessName: rawReceipt.businessName ? String(rawReceipt.businessName) : undefined,
    transactionId: rawReceipt.transactionId ? String(rawReceipt.transactionId) : undefined,
    billingPeriod: rawReceipt.billingPeriod ? String(rawReceipt.billingPeriod) : undefined,
    createdAt: rawReceipt.createdAt ? String(rawReceipt.createdAt) : undefined,
    updatedAt: rawReceipt.updatedAt ? String(rawReceipt.updatedAt) : undefined,
  };
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

  return snapshot.docs.map((receiptDoc) =>
    normalizeGymReceipt(receiptDoc.data() as GymReceiptRecord & Record<string, unknown>, receiptDoc.id)
  );
}

export async function getGymReceiptsForMember(
  businessId: string,
  memberDocId: string
): Promise<GymReceiptRecord[]> {
  const receipts = await getGymReceipts(businessId);
  return receipts.filter((receipt) => receipt.memberDocId === memberDocId);
}
