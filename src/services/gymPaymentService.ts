import {
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  QueryConstraint,
  QueryDocumentSnapshot,
  startAfter,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { GymMemberRecord, GymPaymentRecord, GymReceiptRecord } from '@/types';
import { removeUndefinedFields } from '@/utils/removeUndefinedFields';

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

function assertBusinessId(businessId: string) {
  if (!businessId?.trim()) {
    throw new Error('Business ID missing');
  }
}

function assertMemberId(memberId: string) {
  if (!memberId?.trim()) {
    throw new Error('Member ID missing');
  }
}

function gymPaymentsCollection(businessId: string) {
  assertBusinessId(businessId);
  return collection(getFirestoreDb(), 'businesses', businessId, 'gymPayments');
}

function gymPaymentDoc(businessId: string, paymentId: string) {
  assertBusinessId(businessId);
  if (!paymentId?.trim()) {
    throw new Error('Payment ID missing');
  }
  return doc(getFirestoreDb(), 'businesses', businessId, 'gymPayments', paymentId);
}

function gymMemberDoc(businessId: string, memberId: string) {
  assertBusinessId(businessId);
  assertMemberId(memberId);
  return doc(getFirestoreDb(), 'businesses', businessId, 'gymMembers', memberId);
}

function gymReceiptsCollection(businessId: string) {
  assertBusinessId(businessId);
  return collection(getFirestoreDb(), 'businesses', businessId, 'gymReceipts');
}

function normalizeGymPayment(
  rawPayment: Partial<GymPaymentRecord> & Record<string, unknown>,
  documentId: string
): GymPaymentRecord {
  const resolvedMemberId =
    String(rawPayment.memberId ?? rawPayment.memberDocId ?? '').trim() ||
    String(rawPayment.memberCode ?? '').trim() ||
    documentId;

  return {
    id: documentId,
    memberDocId: String(rawPayment.memberDocId ?? resolvedMemberId),
    memberId: resolvedMemberId,
    memberCode:
      String(rawPayment.memberCode ?? rawPayment.memberId ?? rawPayment.memberDocId ?? '').trim() ||
      resolvedMemberId,
    memberName: String(rawPayment.memberName ?? ''),
    membershipPlan: String(rawPayment.membershipPlan ?? 'Monthly'),
    invoiceId: String(rawPayment.invoiceId ?? documentId),
    receiptId: rawPayment.receiptId ? String(rawPayment.receiptId) : undefined,
    receiptNumber: rawPayment.receiptNumber ? String(rawPayment.receiptNumber) : undefined,
    paymentDate: String(rawPayment.paymentDate ?? ''),
    billingPeriod: String(rawPayment.billingPeriod ?? ''),
    amount: Number(rawPayment.amount ?? 0),
    paymentMethod: (rawPayment.paymentMethod as GymPaymentRecord['paymentMethod']) ?? 'cash',
    transactionId: rawPayment.transactionId ? String(rawPayment.transactionId) : undefined,
    notes: rawPayment.notes ? String(rawPayment.notes) : undefined,
    createdAt: rawPayment.createdAt ? String(rawPayment.createdAt) : undefined,
    updatedAt: rawPayment.updatedAt ? String(rawPayment.updatedAt) : undefined,
  };
}

export interface PaginationOptions {
  pageSize?: number;
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
}

export interface PaginatedResult<T> {
  data: T[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

export interface SaveGymPaymentPayload {
  businessId: string;
  businessName: string;
  member: GymMemberRecord;
  payment: Omit<GymPaymentRecord, 'id' | 'receiptId' | 'updatedAt'>;
  receipt: Omit<GymReceiptRecord, 'id' | 'receiptId' | 'updatedAt'>;
}

export async function saveGymMemberPayment({
  businessId,
  businessName,
  member,
  payment,
  receipt,
}: SaveGymPaymentPayload) {
  assertBusinessId(businessId);
  const resolvedMemberId = String(member.memberId || member.id || '').trim();
  if (!resolvedMemberId) {
    throw new Error('Unable to identify member. Please refresh and try again.');
  }
  if (!(payment.amount > 0)) {
    throw new Error('Payment amount must be greater than zero.');
  }
  const knownPending =
    typeof member.pendingFees === 'number'
      ? member.pendingFees
      : typeof member.pendingAmount === 'number'
        ? member.pendingAmount
        : Math.max(
            (member.monthlyFee ?? member.feeAmount) - (member.paidFees ?? member.paidAmount),
            0
          );
  if (knownPending > 0 && payment.amount > knownPending) {
    throw new Error('Payment amount cannot exceed pending fees.');
  }
  assertMemberId(resolvedMemberId);

  const firestore = getFirestoreDb();
  const batch = writeBatch(firestore);
  const paymentRef = doc(gymPaymentsCollection(businessId));
  const receiptRef = doc(gymReceiptsCollection(businessId));
  const memberRef = gymMemberDoc(businessId, resolvedMemberId);
  const memberSnapshot = await getDoc(memberRef);

  if (!memberSnapshot.exists()) {
    throw new Error('Member record not found');
  }

  const existingMember = {
    ...member,
    ...(memberSnapshot.data() as Omit<GymMemberRecord, 'id'>),
    id: memberSnapshot.id,
    memberId: memberSnapshot.id,
  };
  const resolvedMemberCode =
    String(existingMember.memberCode ?? existingMember.displayId ?? '').trim() ||
    String(payment.memberCode ?? '').trim() ||
    resolvedMemberId;

  const now = new Date().toISOString();
  const monthlyFee = existingMember.monthlyFee ?? existingMember.feeAmount;
  const currentPaid = existingMember.paidFees ?? existingMember.paidAmount;
  const nextPaidAmount = currentPaid + payment.amount;
  const nextPendingAmount = Math.max(monthlyFee - nextPaidAmount, 0);

  const paymentData: Omit<GymPaymentRecord, 'id'> = removeUndefinedFields({
    ...payment,
    memberDocId: resolvedMemberId,
    memberId: resolvedMemberId,
    memberCode: resolvedMemberCode,
    receiptId: receiptRef.id,
    createdAt: payment.createdAt ?? now,
    updatedAt: now,
  });

  const receiptData: Omit<GymReceiptRecord, 'id'> = removeUndefinedFields({
    ...receipt,
    memberDocId: resolvedMemberId,
    memberId: resolvedMemberId,
    memberCode: resolvedMemberCode,
    receiptId: receiptRef.id,
    paymentId: paymentRef.id,
    businessName,
    createdAt: receipt.createdAt ?? now,
    updatedAt: now,
  });

  console.log('Saving payment:', paymentData);
  console.log('Saving receipt:', receiptData);

  batch.set(paymentRef, paymentData);
  batch.set(receiptRef, receiptData);
  batch.update(
    memberRef,
    removeUndefinedFields({
      memberId: resolvedMemberId,
      memberCode: resolvedMemberCode,
      displayId: resolvedMemberCode,
      paidAmount: nextPaidAmount,
      paidFees: nextPaidAmount,
      pendingAmount: nextPendingAmount,
      pendingFees: nextPendingAmount,
      monthlyFee,
      feeAmount: monthlyFee,
      status: existingMember.status === 'expired' ? 'active' : existingMember.status,
      updatedAt: now,
    })
  );

  await batch.commit();

  return {
    payment: { ...paymentData, id: paymentRef.id },
    receipt: { ...receiptData, id: receiptRef.id },
    member: {
      ...existingMember,
      memberId: resolvedMemberId,
      memberCode: resolvedMemberCode,
      displayId: resolvedMemberCode,
      paidAmount: nextPaidAmount,
      paidFees: nextPaidAmount,
      pendingAmount: nextPendingAmount,
      pendingFees: nextPendingAmount,
      monthlyFee,
      feeAmount: monthlyFee,
      status: existingMember.status === 'expired' ? 'active' : existingMember.status,
      updatedAt: now,
    },
  };
}

export const saveGymPaymentWithReceipt = saveGymMemberPayment;

export async function deleteGymPayment(businessId: string, paymentId: string) {
  await deleteDoc(gymPaymentDoc(businessId, paymentId));
}

function getGymPaymentQuery(
  businessId: string,
  pageSize: number,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
) {
  const queryConstraints: QueryConstraint[] = [
    orderBy('createdAt', 'desc'),
    orderBy('__name__', 'desc'),
    limit(pageSize),
  ];

  if (lastDoc) {
    queryConstraints.push(startAfter(lastDoc));
  }

  return query(gymPaymentsCollection(businessId), ...queryConstraints);
}

export async function getGymPayments(businessId: string): Promise<GymPaymentRecord[]>;
export async function getGymPayments(
  businessId: string,
  options: PaginationOptions
): Promise<PaginatedResult<GymPaymentRecord>>;
export async function getGymPayments(
  businessId: string,
  options?: PaginationOptions
): Promise<GymPaymentRecord[] | PaginatedResult<GymPaymentRecord>> {
  if (options) {
    const pageSize = options.pageSize ?? 25;
    const paymentsQuery = getGymPaymentQuery(businessId, pageSize, options.lastDoc ?? undefined);
    const snapshot = await getDocs(paymentsQuery);
    const data = snapshot.docs.map((paymentDoc) =>
      normalizeGymPayment(
        paymentDoc.data() as GymPaymentRecord & Record<string, unknown>,
        paymentDoc.id
      )
    );
    return {
      data,
      lastDoc: snapshot.docs.at(-1) ?? null,
      hasMore: data.length === pageSize,
    };
  }

  const paymentsQuery = query(
    gymPaymentsCollection(businessId),
    orderBy('createdAt', 'desc'),
    orderBy('__name__', 'desc')
  );
  const snapshot = await getDocs(paymentsQuery);
  return snapshot.docs.map((paymentDoc) =>
    normalizeGymPayment(
      paymentDoc.data() as GymPaymentRecord & Record<string, unknown>,
      paymentDoc.id
    )
  );
}

export async function getGymPaymentById(businessId: string, paymentId: string) {
  const paymentDoc = await getDoc(gymPaymentDoc(businessId, paymentId));
  return paymentDoc.exists()
    ? normalizeGymPayment(
        paymentDoc.data() as GymPaymentRecord & Record<string, unknown>,
        paymentDoc.id
      )
    : null;
}

function getGymPaymentsForMemberQuery(
  businessId: string,
  memberDocId: string,
  pageSize: number,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
) {
  const queryConstraints: QueryConstraint[] = [
    where('memberDocId', '==', memberDocId),
    orderBy('createdAt', 'desc'),
    orderBy('__name__', 'desc'),
    limit(pageSize),
  ];

  if (lastDoc) {
    queryConstraints.push(startAfter(lastDoc));
  }

  return query(gymPaymentsCollection(businessId), ...queryConstraints);
}

export async function getGymPaymentsForMember(
  businessId: string,
  memberDocId: string
): Promise<GymPaymentRecord[]>;
export async function getGymPaymentsForMember(
  businessId: string,
  memberDocId: string,
  options: PaginationOptions
): Promise<PaginatedResult<GymPaymentRecord>>;
export async function getGymPaymentsForMember(
  businessId: string,
  memberDocId: string,
  options?: PaginationOptions
): Promise<GymPaymentRecord[] | PaginatedResult<GymPaymentRecord>> {
  if (options) {
    const pageSize = options.pageSize ?? 25;
    const paymentsQuery = getGymPaymentsForMemberQuery(
      businessId,
      memberDocId,
      pageSize,
      options.lastDoc ?? undefined
    );
    const snapshot = await getDocs(paymentsQuery);
    const data = snapshot.docs.map((paymentDoc) =>
      normalizeGymPayment(
        paymentDoc.data() as GymPaymentRecord & Record<string, unknown>,
        paymentDoc.id
      )
    );
    return {
      data,
      lastDoc: snapshot.docs.at(-1) ?? null,
      hasMore: data.length === pageSize,
    };
  }

  const paymentsQuery = query(
    gymPaymentsCollection(businessId),
    where('memberDocId', '==', memberDocId),
    orderBy('createdAt', 'desc'),
    orderBy('__name__', 'desc')
  );
  const snapshot = await getDocs(paymentsQuery);

  return snapshot.docs.map((paymentDoc) =>
    normalizeGymPayment(
      paymentDoc.data() as GymPaymentRecord & Record<string, unknown>,
      paymentDoc.id
    )
  );
}

export async function getAllGymPaymentsForMember(
  businessId: string,
  memberDocId: string
): Promise<GymPaymentRecord[]> {
  const allPayments: GymPaymentRecord[] = [];
  let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;

  while (true) {
    const paginated: PaginatedResult<GymPaymentRecord> = await getGymPaymentsForMember(
      businessId,
      memberDocId,
      {
        pageSize: 50,
        lastDoc,
      }
    );

    allPayments.push(...paginated.data);

    if (!paginated.hasMore || !paginated.lastDoc) {
      break;
    }

    lastDoc = paginated.lastDoc;
  }

  return allPayments;
}
