import {
  addDoc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
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
  sortByCreatedAtDesc,
} from './academyShared';

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

export interface TodayAttendanceStudentInput
  extends Pick<
    AcademyStudent,
    'id' | 'studentId' | 'studentName' | 'enrolledCourseIds'
  > {
  courseId?: string;
  courseName?: string;
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

function buildAttendanceId(studentId: string, attendanceDate: string) {
  return `${studentId}_${attendanceDate}`;
}

export async function getAcademyAttendance(businessId: string) {
  const snapshot = await getDocs(
    query(academyCollection(businessId, 'attendance'), orderBy('createdAt', 'desc'))
  );
  return snapshot.docs.map((docSnapshot) =>
    mapSnapshot<AcademyAttendance>(docSnapshot, normalizeAttendance)
  );
}

export async function getStudentAttendanceHistory(businessId: string, studentId: string) {
  const snapshot = await getDocs(
    query(academyCollection(businessId, 'attendance'), where('studentId', '==', studentId))
  );
  return sortByCreatedAtDesc(
    snapshot.docs.map((docSnapshot) => mapSnapshot<AcademyAttendance>(docSnapshot, normalizeAttendance))
  );
}

export async function getTodayAttendanceMap(businessId: string, attendanceDate?: string) {
  const date = attendanceDate ?? new Date().toISOString().slice(0, 10);
  const snapshot = await getDocs(
    query(academyCollection(businessId, 'attendance'), where('attendanceDate', '==', date))
  );

  return new Map(
    snapshot.docs.map((docSnapshot) => {
      const record = mapSnapshot<AcademyAttendance>(docSnapshot, normalizeAttendance);
      return [record.studentId, record] as const;
    })
  );
}

export async function markTodayAttendance(
  businessId: string,
  student: TodayAttendanceStudentInput,
  status: AcademyAttendanceStatus,
  options?: {
    attendanceDate?: string;
    markedBy?: string;
    remarks?: string;
    courseId?: string;
    courseName?: string;
  }
) {
  const attendanceDate = options?.attendanceDate ?? new Date().toISOString().slice(0, 10);
  const attendanceId = buildAttendanceId(student.studentId, attendanceDate);
  const attendanceRef = academyDoc(businessId, 'attendance', attendanceId);
  const existingSnap = await getDoc(attendanceRef);

  const existingData = existingSnap.exists() ? (existingSnap.data() as Record<string, unknown>) : null;
  const courseId =
    options?.courseId ?? student.courseId ?? String(existingData?.courseId ?? '');
  const courseName =
    options?.courseName ?? student.courseName ?? String(existingData?.courseName ?? '');

  await setDoc(
    attendanceRef,
    {
      attendanceId,
      studentId: student.studentId,
      studentName: student.studentName,
      courseId,
      courseName,
      attendanceDate,
      status,
      remarks: options?.remarks?.trim() ?? String(existingData?.remarks ?? ''),
      markedBy: options?.markedBy ?? String(existingData?.markedBy ?? ''),
      createdAt: existingSnap.exists() ? existingData?.createdAt ?? firestoreTimestamp() : firestoreTimestamp(),
      updatedAt: firestoreTimestamp(),
    },
    { merge: true }
  );

  const updatedSnap = await getDoc(attendanceRef);
  return updatedSnap.exists()
    ? normalizeAttendance(updatedSnap.data() as Record<string, unknown>, updatedSnap.id)
    : null;
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

  const savedIds: string[] = [];
  for (const record of input.records) {
    const attendance = await markTodayAttendance(
      businessId,
      {
        id: record.student.studentId,
        studentId: record.student.studentId,
        studentName: record.student.studentName,
        enrolledCourseIds: [],
        courseId: input.courseId,
        courseName: input.courseName,
      },
      record.status,
      {
        attendanceDate: input.attendanceDate,
        markedBy: input.markedBy,
        remarks: record.remarks,
        courseId: input.courseId,
        courseName: input.courseName,
      }
    );

    if (attendance) {
      savedIds.push(attendance.attendanceId);
    }
  }

  return savedIds;
}
