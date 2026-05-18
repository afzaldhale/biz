import {
  addDoc,
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
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { GymPaymentRecord } from '@/types';
import { canAddRecord } from '@/utils/planLimits';
import { decrementBusinessUsage, safeIncrementBusinessUsage } from '@/services/businessService';

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

export async function addGymPayment(businessId: string, payment: GymPaymentRecord) {
  await canAddRecord(businessId, 'gymPayments');
  const docRef = await addDoc(
    collection(getFirestoreDb(), `businesses/${businessId}/gymPayments`),
    {
      ...payment,
      createdAt: payment.createdAt ?? new Date().toISOString(),
    }
  );

  await safeIncrementBusinessUsage(businessId);
  return docRef.id;
}

export async function deleteGymPayment(businessId: string, paymentId: string) {
  await deleteDoc(doc(getFirestoreDb(), `businesses/${businessId}/gymPayments`, paymentId));
  await decrementBusinessUsage(businessId);
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

  return query(
    collection(getFirestoreDb(), `businesses/${businessId}/gymPayments`),
    ...queryConstraints
  );
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
    const data = snapshot.docs.map((paymentDoc) => ({
      id: paymentDoc.id,
      ...(paymentDoc.data() as Omit<GymPaymentRecord, 'id'>),
    }));
    return {
      data,
      lastDoc: snapshot.docs.at(-1) ?? null,
      hasMore: data.length === pageSize,
    };
  }

  const paymentsQuery = query(
    collection(getFirestoreDb(), `businesses/${businessId}/gymPayments`),
    orderBy('createdAt', 'desc'),
    orderBy('__name__', 'desc')
  );
  const snapshot = await getDocs(paymentsQuery);
  return snapshot.docs.map((paymentDoc) => ({
    id: paymentDoc.id,
    ...(paymentDoc.data() as Omit<GymPaymentRecord, 'id'>),
  }));
}

export async function getGymPaymentById(businessId: string, paymentId: string) {
  const paymentDoc = await getDoc(
    doc(getFirestoreDb(), `businesses/${businessId}/gymPayments`, paymentId)
  );
  return paymentDoc.exists()
    ? ({
        id: paymentDoc.id,
        ...(paymentDoc.data() as Omit<GymPaymentRecord, 'id'>),
      } as GymPaymentRecord)
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

  return query(
    collection(getFirestoreDb(), `businesses/${businessId}/gymPayments`),
    ...queryConstraints
  );
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
    const data = snapshot.docs.map((paymentDoc) => ({
      id: paymentDoc.id,
      ...(paymentDoc.data() as Omit<GymPaymentRecord, 'id'>),
    }));
    return {
      data,
      lastDoc: snapshot.docs.at(-1) ?? null,
      hasMore: data.length === pageSize,
    };
  }

  const paymentsQuery = query(
    collection(getFirestoreDb(), `businesses/${businessId}/gymPayments`),
    where('memberDocId', '==', memberDocId),
    orderBy('createdAt', 'desc'),
    orderBy('__name__', 'desc')
  );
  const snapshot = await getDocs(paymentsQuery);

  return snapshot.docs.map((paymentDoc) => ({
    id: paymentDoc.id,
    ...(paymentDoc.data() as Omit<GymPaymentRecord, 'id'>),
  }));
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
