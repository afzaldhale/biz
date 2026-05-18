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
  updateDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { canAddRecord } from '@/utils/planLimits';
import { decrementBusinessUsage, safeIncrementBusinessUsage } from '@/services/businessService';
import { GenericBusinessRecord } from '@/types';

export interface PaginationOptions {
  pageSize?: number;
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
}

export interface PaginatedResult<T> {
  data: T[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

function getBusinessRecordsQuery(
  businessId: string,
  collectionName: string,
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
    collection(getFirestoreDb(), `businesses/${businessId}/${collectionName}`),
    ...queryConstraints
  );
}

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

export async function getBusinessRecords(
  businessId: string,
  collectionName: string
): Promise<GenericBusinessRecord[]>;
export async function getBusinessRecords(
  businessId: string,
  collectionName: string,
  options: PaginationOptions
): Promise<PaginatedResult<GenericBusinessRecord>>;
export async function getBusinessRecords(
  businessId: string,
  collectionName: string,
  options?: PaginationOptions
): Promise<GenericBusinessRecord[] | PaginatedResult<GenericBusinessRecord>> {
  if (options) {
    const pageSize = options.pageSize ?? 25;
    const recordsQuery = getBusinessRecordsQuery(
      businessId,
      collectionName,
      pageSize,
      options.lastDoc ?? undefined
    );
    const snapshot = await getDocs(recordsQuery);
    const data = snapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      ...(docSnapshot.data() as Omit<GenericBusinessRecord, 'id'>),
    }));
    return {
      data,
      lastDoc: snapshot.docs.at(-1) ?? null,
      hasMore: data.length === pageSize,
    };
  }

  const snapshot = await getDocs(
    collection(getFirestoreDb(), `businesses/${businessId}/${collectionName}`)
  );
  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...(docSnapshot.data() as Omit<GenericBusinessRecord, 'id'>),
  }));
}

export async function getBusinessRecordById(
  businessId: string,
  collectionName: string,
  recordId: string
): Promise<GenericBusinessRecord | null> {
  const recordDoc = await getDoc(
    doc(getFirestoreDb(), `businesses/${businessId}/${collectionName}`, recordId)
  );
  return recordDoc.exists()
    ? ({
        id: recordDoc.id,
        ...(recordDoc.data() as Omit<GenericBusinessRecord, 'id'>),
      } as GenericBusinessRecord)
    : null;
}

export async function addBusinessRecord(
  businessId: string,
  collectionName: string,
  record: Omit<GenericBusinessRecord, 'id'>
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
  record: Omit<GenericBusinessRecord, 'id'>
) {
  await updateDoc(doc(getFirestoreDb(), `businesses/${businessId}/${collectionName}`, recordId), {
    ...record,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteBusinessRecord(
  businessId: string,
  collectionName: string,
  recordId: string
) {
  await deleteDoc(doc(getFirestoreDb(), `businesses/${businessId}/${collectionName}`, recordId));
  await decrementBusinessUsage(businessId);
}
