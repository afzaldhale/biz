import {
  addDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { AcademyAttendance, AcademyAttendanceStatus, AcademyStudent } from '@/types';
import {
  academyCollection,
  academyDoc,
  firestoreTimestamp,
  mapSnapshot,
  normalizeDateValue,
} from './academyShared';
import { canAddRecord } from '@/utils/planLimits';
import { safeIncrementBusinessUsage } from './businessService';

export interface AttendanceMarkInput {
  courseId: string;
  courseName: string;
  attendanceDate: string;
  markedBy: string;
  records: Array<{
    student: Pick<AcademyStudent, 'studentId' | 'studentName'>;
    status: AcademyAttendanceStatus;
    remarks: string;
  }>;
}

function normalizeAttendance(data: Record<string, unknown>, id: string): AcademyAttendance {
  return {
    id,
    attendanceId: String(data.attendanceId ?? id),
    studentId: String(data.studentId ?? ''),
    studentName: String(data.studentName ?? ''),
    courseId: String(data.courseId ?? ''),
    courseName: String(data.courseName ?? ''),
    attendanceDate: String(data.attendanceDate ?? ''),
    status: (data.status as AcademyAttendance['status']) ?? 'present',
    remarks: String(data.remarks ?? ''),
    markedBy: String(data.markedBy ?? ''),
    createdAt: normalizeDateValue(data.createdAt),
    updatedAt: normalizeDateValue(data.updatedAt),
  };
}

export async function getAcademyAttendance(businessId: string) {
  const snapshot = await getDocs(
    query(academyCollection(businessId, 'attendance'), orderBy('createdAt', 'desc'))
  );
  return snapshot.docs.map((doc) => mapSnapshot<AcademyAttendance>(doc, normalizeAttendance));
}

export async function getStudentAttendanceHistory(businessId: string, studentId: string) {
  const snapshot = await getDocs(
    query(
      academyCollection(businessId, 'attendance'),
      where('studentId', '==', studentId),
      orderBy('createdAt', 'desc')
    )
  );
  return snapshot.docs.map((doc) => mapSnapshot<AcademyAttendance>(doc, normalizeAttendance));
}

export async function markAcademyAttendance(businessId: string, input: AttendanceMarkInput) {
  if (!input.courseId) {
    throw new Error('Course is required.');
  }
  if (!input.attendanceDate) {
    throw new Error('Date is required.');
  }
  if (input.records.length === 0) {
    throw new Error('Select at least one student.');
  }

  const existingSnapshot = await getDocs(
    query(
      academyCollection(businessId, 'attendance'),
      where('courseId', '==', input.courseId),
      where('attendanceDate', '==', input.attendanceDate)
    )
  );
  const existingKeys = new Set(existingSnapshot.docs.map((doc) => String(doc.data().studentId ?? '')));

  const createdIds: string[] = [];
  for (const record of input.records) {
    if (existingKeys.has(record.student.studentId)) {
      continue;
    }

    await canAddRecord(businessId, 'attendance');
    const docRef = await addDoc(academyCollection(businessId, 'attendance'), {
      studentId: record.student.studentId,
      studentName: record.student.studentName,
      courseId: input.courseId,
      courseName: input.courseName,
      attendanceDate: input.attendanceDate,
      status: record.status,
      remarks: record.remarks.trim(),
      markedBy: input.markedBy,
      createdAt: firestoreTimestamp(),
      updatedAt: firestoreTimestamp(),
    });
    await updateDoc(docRef, {
      attendanceId: docRef.id,
    });
    createdIds.push(docRef.id);
    await safeIncrementBusinessUsage(businessId);
  }

  return createdIds;
}
