import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { GymAttendanceRecord } from '@/types';
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

function getAttendanceDocId(memberDocId: string, attendanceDate: string) {
  return `${memberDocId}_${attendanceDate}`;
}

export async function upsertGymAttendance(
  businessId: string,
  attendance: Omit<GymAttendanceRecord, 'id' | 'attendanceId' | 'createdAt' | 'updatedAt'>
) {
  const attendanceId = getAttendanceDocId(attendance.memberDocId, attendance.attendanceDate);
  const attendanceRef = doc(getFirestoreDb(), `businesses/${businessId}/gymAttendance`, attendanceId);
  const existing = await getDoc(attendanceRef);
  const now = new Date().toISOString();

  await setDoc(
    attendanceRef,
    removeUndefinedFields({
      ...attendance,
      attendanceId,
      createdAt: existing.exists() ? existing.data().createdAt ?? now : now,
      updatedAt: now,
    }),
    { merge: true }
  );

  return attendanceId;
}

export async function deleteGymAttendance(businessId: string, attendanceId: string) {
  await deleteDoc(doc(getFirestoreDb(), `businesses/${businessId}/gymAttendance`, attendanceId));
}

export async function getGymAttendance(businessId: string): Promise<GymAttendanceRecord[]> {
  const snapshot = await getDocs(
    query(
      collection(getFirestoreDb(), `businesses/${businessId}/gymAttendance`),
      orderBy('attendanceDate', 'desc'),
      orderBy('__name__', 'desc')
    )
  );

  return snapshot.docs.map((attendanceDoc) => ({
    id: attendanceDoc.id,
    ...(attendanceDoc.data() as Omit<GymAttendanceRecord, 'id'>),
  }));
}

export async function getGymAttendanceForMember(
  businessId: string,
  memberDocId: string
): Promise<GymAttendanceRecord[]> {
  const allAttendance = await getGymAttendance(businessId);
  return allAttendance.filter((attendance) => attendance.memberDocId === memberDocId);
}
