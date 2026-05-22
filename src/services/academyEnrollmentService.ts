import {
  addDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { AcademyEnrollment, AcademyStudent, AcademyCourse } from '@/types';
import {
  academyCollection,
  academyDoc,
  firestoreTimestamp,
  mapSnapshot,
  normalizeDateValue,
} from './academyShared';
import { canAddRecord } from '@/utils/planLimits';
import { safeIncrementBusinessUsage } from './businessService';

export interface EnrollmentInput {
  student: Pick<AcademyStudent, 'studentId' | 'studentName'>;
  course: Pick<AcademyCourse, 'courseId' | 'courseName' | 'fees'>;
  enrollmentDate: string;
  status?: AcademyEnrollment['status'];
}

function normalizeEnrollment(data: Record<string, unknown>, id: string): AcademyEnrollment {
  return {
    id,
    enrollmentId: String(data.enrollmentId ?? id),
    studentId: String(data.studentId ?? ''),
    studentName: String(data.studentName ?? ''),
    courseId: String(data.courseId ?? ''),
    courseName: String(data.courseName ?? ''),
    courseFees: Number(data.courseFees ?? 0),
    enrollmentDate: String(data.enrollmentDate ?? ''),
    status: (data.status as AcademyEnrollment['status']) ?? 'active',
    createdAt: normalizeDateValue(data.createdAt),
    updatedAt: normalizeDateValue(data.updatedAt),
  };
}

export async function getAcademyEnrollments(businessId: string) {
  const snapshot = await getDocs(
    query(academyCollection(businessId, 'enrollments'), orderBy('createdAt', 'desc'))
  );
  return snapshot.docs.map((doc) => mapSnapshot<AcademyEnrollment>(doc, normalizeEnrollment));
}

export async function getStudentEnrollments(businessId: string, studentId: string) {
  const snapshot = await getDocs(
    query(
      academyCollection(businessId, 'enrollments'),
      where('studentId', '==', studentId),
      orderBy('createdAt', 'desc')
    )
  );
  return snapshot.docs.map((doc) => mapSnapshot<AcademyEnrollment>(doc, normalizeEnrollment));
}

export async function getCourseEnrollments(businessId: string, courseId: string) {
  const snapshot = await getDocs(
    query(
      academyCollection(businessId, 'enrollments'),
      where('courseId', '==', courseId),
      orderBy('createdAt', 'desc')
    )
  );
  return snapshot.docs.map((doc) => mapSnapshot<AcademyEnrollment>(doc, normalizeEnrollment));
}

export async function createEnrollment(businessId: string, input: EnrollmentInput) {
  await canAddRecord(businessId, 'enrollments');
  const docRef = await addDoc(academyCollection(businessId, 'enrollments'), {
    studentId: input.student.studentId,
    studentName: input.student.studentName,
    courseId: input.course.courseId,
    courseName: input.course.courseName,
    courseFees: Number(input.course.fees) || 0,
    enrollmentDate: input.enrollmentDate,
    status: input.status ?? 'active',
    createdAt: firestoreTimestamp(),
    updatedAt: firestoreTimestamp(),
  });

  await setDoc(docRef, { enrollmentId: docRef.id }, { merge: true });
  await safeIncrementBusinessUsage(businessId);
  return docRef.id;
}

export async function updateEnrollmentStatus(
  businessId: string,
  enrollmentId: string,
  status: AcademyEnrollment['status']
) {
  await updateDoc(academyDoc(businessId, 'enrollments', enrollmentId), {
    status,
    updatedAt: firestoreTimestamp(),
  });
}
