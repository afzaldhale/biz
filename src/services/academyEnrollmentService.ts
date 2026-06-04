import { addDoc, getDocs, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { AcademyEnrollment, AcademyStudent, AcademyCourse } from '@/types';
import {
  academyCollection,
  academyDoc,
  firestoreTimestamp,
  mapSnapshot,
  normalizeDateValue,
  sortByCreatedAtDesc,
} from './academyShared';
import { getAcademyCourses } from './academyCourseService';

export interface EnrollmentInput {
  student: Pick<AcademyStudent, 'studentId' | 'studentName'>;
  course: Pick<AcademyCourse, 'courseId' | 'courseName' | 'fees'>;
  enrollmentDate: string;
  status?: AcademyEnrollment['status'];
}

export interface StudentCourseOption extends AcademyEnrollment {
  isVirtual?: boolean;
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
    query(academyCollection(businessId, 'enrollments'), where('studentId', '==', studentId))
  );
  return sortByCreatedAtDesc(
    snapshot.docs.map((doc) => mapSnapshot<AcademyEnrollment>(doc, normalizeEnrollment))
  );
}

export async function getCourseEnrollments(businessId: string, courseId: string) {
  const snapshot = await getDocs(
    query(academyCollection(businessId, 'enrollments'), where('courseId', '==', courseId))
  );
  return sortByCreatedAtDesc(
    snapshot.docs.map((doc) => mapSnapshot<AcademyEnrollment>(doc, normalizeEnrollment))
  );
}

export async function getStudentCourseOptions(
  businessId: string,
  student: Pick<AcademyStudent, 'studentId' | 'studentName' | 'admissionDate' | 'enrolledCourseIds'>
): Promise<StudentCourseOption[]> {
  const enrollments = await getStudentEnrollments(businessId, student.studentId);
  const activeEnrollments = enrollments.filter((item) => item.status === 'active');

  if (process.env.NODE_ENV === 'development') {
    console.log('[academy-enrollments] selected student', student);
    console.log('[academy-enrollments] loaded enrollments', activeEnrollments);
  }

  if (activeEnrollments.length > 0) {
    return activeEnrollments;
  }

  if (!student.enrolledCourseIds.length) {
    return [];
  }

  const courses = await getAcademyCourses(businessId);
  const courseMap = new Map(courses.map((course) => [course.courseId, course]));
  const fallbackOptions = student.enrolledCourseIds
    .map((courseId) => courseMap.get(courseId))
    .filter((course): course is AcademyCourse => Boolean(course))
    .map<StudentCourseOption>((course) => ({
      id: `virtual-${course.courseId}`,
      enrollmentId: `virtual-${course.courseId}`,
      studentId: student.studentId,
      studentName: student.studentName,
      courseId: course.courseId,
      courseName: course.courseName,
      courseFees: Number(course.fees) || 0,
      enrollmentDate: student.admissionDate || '',
      status: 'active',
      createdAt: '',
      updatedAt: '',
      isVirtual: true,
    }));

  if (process.env.NODE_ENV === 'development') {
    console.log('[academy-enrollments] fallback course options', fallbackOptions);
  }

  return fallbackOptions;
}

export async function createEnrollment(businessId: string, input: EnrollmentInput) {
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
