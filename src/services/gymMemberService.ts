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
  setDoc,
  startAfter,
  updateDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { GymMemberRecord } from '@/types';
import { canAddRecord } from '@/utils/planLimits';
import { removeUndefinedFields } from '@/utils/removeUndefinedFields';
import { decrementBusinessUsage, safeIncrementBusinessUsage } from '@/services/businessService';
import { runTransaction, serverTimestamp, doc as firestoreDoc } from 'firebase/firestore';
import { incrementUsageInTransaction, decrementUsageInTransaction } from '@/services/subscriptionUsageService';

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

function gymMembersCollection(businessId: string) {
  assertBusinessId(businessId);
  return collection(getFirestoreDb(), 'businesses', businessId, 'gymMembers');
}

function gymMemberDoc(businessId: string, memberId: string) {
  assertBusinessId(businessId);
  assertMemberId(memberId);
  return doc(getFirestoreDb(), 'businesses', businessId, 'gymMembers', memberId);
}

export function normalizeGymMember(
  rawMember: Partial<GymMemberRecord> & Record<string, unknown>,
  documentId: string
): GymMemberRecord {
  const resolvedMemberCode =
    String(rawMember.memberCode ?? rawMember.displayId ?? rawMember.memberId ?? '').trim() ||
    `GYM-${documentId.slice(-6).toUpperCase()}`;
  const feeAmount = Number(rawMember.feeAmount ?? rawMember.monthlyFee ?? 0);
  const paidAmount = Number(rawMember.paidAmount ?? rawMember.paidFees ?? 0);
  const pendingAmount = Math.max(
    Number(rawMember.pendingAmount ?? rawMember.pendingFees ?? feeAmount - paidAmount),
    0
  );

  return {
    id: documentId,
    memberId: documentId,
    memberCode: resolvedMemberCode,
    displayId: resolvedMemberCode,
    fullName: String(rawMember.fullName ?? ''),
    phone: String(rawMember.phone ?? ''),
    email: String(rawMember.email ?? ''),
    address: String(rawMember.address ?? ''),
    membershipPlan: String(rawMember.membershipPlan ?? 'Monthly'),
    trainerId: rawMember.trainerId ? String(rawMember.trainerId) : '',
    trainerName: rawMember.trainerName ? String(rawMember.trainerName) : '',
    joiningDate: String(rawMember.joiningDate ?? ''),
    renewalDate: String(rawMember.renewalDate ?? ''),
    feeAmount,
    paidAmount,
    pendingAmount,
    monthlyFee: feeAmount,
    paidFees: paidAmount,
    pendingFees: pendingAmount,
    status: (rawMember.status as GymMemberRecord['status']) ?? 'active',
    emergencyContact: rawMember.emergencyContact ? String(rawMember.emergencyContact) : '',
    notes: rawMember.notes ? String(rawMember.notes) : '',
    createdAt: rawMember.createdAt ? String(rawMember.createdAt) : undefined,
    updatedAt: rawMember.updatedAt ? String(rawMember.updatedAt) : undefined,
  };
}

type GymMemberDocument = {
  memberId: string;
  fullName: string;
  phone: string;
  email: string;
  address?: string;
  emergencyContact?: string;
  planName: string;
  monthlyFee: number;
  assignedTrainer?: string;
  joiningDate: string;
  renewalDate: string;
  status: GymMemberRecord['status'];
  feesPaid: number;
  pendingAmount: number;
  createdAt: string;
  updatedAt: string;
};

function buildGymMemberDocument(
  member: GymMemberRecord,
  memberId: string,
  createdAt: string,
  updatedAt: string
): GymMemberDocument {
  const monthlyFee = Number(member.monthlyFee ?? member.feeAmount ?? 0);
  const feesPaid = Number(member.paidFees ?? member.paidAmount ?? 0);
  const pendingAmount = Math.max(
    Number(member.pendingAmount ?? member.pendingFees ?? monthlyFee - feesPaid),
    0
  );

  return removeUndefinedFields({
    memberId,
    fullName: member.fullName,
    phone: member.phone,
    email: member.email,
    address: member.address?.trim() || undefined,
    emergencyContact: member.emergencyContact?.trim() || undefined,
    planName: String(member.membershipPlan ?? 'Monthly'),
    monthlyFee,
    assignedTrainer: member.trainerName?.trim() || undefined,
    joiningDate: member.joiningDate,
    renewalDate: member.renewalDate,
    status: member.status,
    feesPaid,
    pendingAmount,
    createdAt,
    updatedAt,
  });
}

export async function addGymMember(businessId: string, member: GymMemberRecord) {
  const now = new Date().toISOString();
  const memberRef = doc(gymMembersCollection(businessId));
  const normalized = normalizeGymMember(
    member as GymMemberRecord & Record<string, unknown>,
    memberRef.id
  );
  const payload = buildGymMemberDocument(normalized, memberRef.id, member.createdAt ?? now, now);
  console.log('Saving member:', payload);

  const firestore = getFirestoreDb();
  await runTransaction(firestore, async (transaction) => {
    // validate and increment usage
    if (member.status === 'active') {
      await incrementUsageInTransaction(transaction, businessId, 1);
    }

    transaction.set(memberRef, {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  return memberRef.id;
}

export async function updateGymMember(
  businessId: string,
  memberId: string,
  member: GymMemberRecord
) {
  const memberRef = gymMemberDoc(businessId, memberId);
  const existing = await getDoc(memberRef);
  const previousStatus = existing.exists()
    ? (existing.data().status as GymMemberRecord['status'] | undefined)
    : undefined;
  const nextStatus = member.status;
  const now = new Date().toISOString();
  const existingData = existing.data();
  const createdAt = existingData?.createdAt ? String(existingData.createdAt) : now;
  const payload = buildGymMemberDocument(member, memberId, createdAt, now);
  console.log('Updating member:', payload);

  // If activating a previously inactive member, do it inside a transaction to reserve usage atomically
  if (previousStatus !== 'active' && nextStatus === 'active') {
    const firestore = getFirestoreDb();
    await runTransaction(firestore, async (transaction) => {
      await incrementUsageInTransaction(transaction, businessId, 1);
      transaction.update(memberRef, {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    });
    return;
  }

  // If deactivating an active member, decrement usage atomically with update
  if (previousStatus === 'active' && nextStatus !== 'active') {
    const firestore = getFirestoreDb();
    await runTransaction(firestore, async (transaction) => {
      await decrementUsageInTransaction(transaction, businessId, 1);
      transaction.update(memberRef, {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    });
    return;
  }

  await updateDoc(memberRef, payload);
}

export async function deleteGymMember(businessId: string, memberId: string) {
  const firestore = getFirestoreDb();
  const memberRef = gymMemberDoc(businessId, memberId);

  await runTransaction(firestore, async (transaction) => {
    const memberSnapshot = await transaction.get(memberRef);
    if (!memberSnapshot.exists()) return;

    const status = memberSnapshot.data().status as GymMemberRecord['status'];
    if (status === 'active') {
      await decrementUsageInTransaction(transaction, businessId, 1);
    }

    transaction.delete(memberRef);
  });
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

  return query(gymMembersCollection(businessId), ...queryConstraints);
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
    const data = snapshot.docs.map((memberDoc) =>
      normalizeGymMember(
        memberDoc.data() as GymMemberRecord & Record<string, unknown>,
        memberDoc.id
      )
    );
    return {
      data,
      lastDoc: snapshot.docs.at(-1) ?? null,
      hasMore: data.length === pageSize,
    };
  }

  const snapshot = await getDocs(
    query(
      gymMembersCollection(businessId),
      orderBy('createdAt', 'desc'),
      orderBy('__name__', 'desc')
    )
  );
  return snapshot.docs.map((memberDoc) =>
    normalizeGymMember(memberDoc.data() as GymMemberRecord & Record<string, unknown>, memberDoc.id)
  );
}

export async function getGymMemberById(businessId: string, memberId: string) {
  const memberDoc = await getDoc(gymMemberDoc(businessId, memberId));
  return memberDoc.exists()
    ? normalizeGymMember(
        memberDoc.data() as GymMemberRecord & Record<string, unknown>,
        memberDoc.id
      )
    : null;
}
