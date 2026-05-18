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
import { GymMemberRecord } from '@/types';
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

export async function addGymMember(businessId: string, member: GymMemberRecord) {
  await canAddRecord(businessId, 'gymMembers');

  const firestore = getFirestoreDb();
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(firestore, `businesses/${businessId}/gymMembers`), {
    ...member,
    createdAt: member.createdAt ?? now,
    updatedAt: now,
  });

  await safeIncrementBusinessUsage(businessId);
  return docRef.id;
}

export async function updateGymMember(
  businessId: string,
  memberId: string,
  member: GymMemberRecord
) {
  await updateDoc(doc(getFirestoreDb(), `businesses/${businessId}/gymMembers`, memberId), {
    ...member,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteGymMember(businessId: string, memberId: string) {
  await deleteDoc(doc(getFirestoreDb(), `businesses/${businessId}/gymMembers`, memberId));
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

function getGymMemberQuery(
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
    collection(getFirestoreDb(), `businesses/${businessId}/gymMembers`),
    ...queryConstraints
  );
}

export async function getGymMembers(businessId: string): Promise<GymMemberRecord[]>;
export async function getGymMembers(
  businessId: string,
  options: PaginationOptions
): Promise<PaginatedResult<GymMemberRecord>>;
export async function getGymMembers(
  businessId: string,
  options?: PaginationOptions
): Promise<GymMemberRecord[] | PaginatedResult<GymMemberRecord>> {
  if (options) {
    const pageSize = options.pageSize ?? 25;
    const membersQuery = getGymMemberQuery(businessId, pageSize, options.lastDoc ?? undefined);
    const snapshot = await getDocs(membersQuery);
    const data = snapshot.docs.map((memberDoc) => ({
      id: memberDoc.id,
      ...(memberDoc.data() as Omit<GymMemberRecord, 'id'>),
    }));
    return {
      data,
      lastDoc: snapshot.docs.at(-1) ?? null,
      hasMore: data.length === pageSize,
    };
  }

  const snapshot = await getDocs(
    query(
      collection(getFirestoreDb(), `businesses/${businessId}/gymMembers`),
      orderBy('createdAt', 'desc'),
      orderBy('__name__', 'desc')
    )
  );
  return snapshot.docs.map((memberDoc) => ({
    id: memberDoc.id,
    ...(memberDoc.data() as Omit<GymMemberRecord, 'id'>),
  }));
}

export async function getGymMemberById(businessId: string, memberId: string) {
  const memberDoc = await getDoc(
    doc(getFirestoreDb(), `businesses/${businessId}/gymMembers`, memberId)
  );
  return memberDoc.exists()
    ? ({
        id: memberDoc.id,
        ...(memberDoc.data() as Omit<GymMemberRecord, 'id'>),
      } as GymMemberRecord)
    : null;
}
