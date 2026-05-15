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
import { GymMemberRecord } from '@/types';
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
  member: GymMemberRecord,
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

export async function getGymMembers(businessId: string): Promise<GymMemberRecord[]> {
  const snapshot = await getDocs(collection(getFirestoreDb(), `businesses/${businessId}/gymMembers`));
  return snapshot.docs.map((memberDoc) => ({
    id: memberDoc.id,
    ...(memberDoc.data() as Omit<GymMemberRecord, 'id'>),
  }));
}

export async function getGymMemberById(businessId: string, memberId: string) {
  const memberDoc = await getDoc(doc(getFirestoreDb(), `businesses/${businessId}/gymMembers`, memberId));
  return memberDoc.exists()
    ? ({ id: memberDoc.id, ...(memberDoc.data() as Omit<GymMemberRecord, 'id'>) } as GymMemberRecord)
    : null;
}
