import {
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { AcademyCourse, AcademyStudent } from '@/types';
import {
  academyCollection,
  academyDoc,
  firestoreTimestamp,
  getFirestoreDb,
  mapSnapshot,
  normalizeDateValue,
} from './academyShared';
import { canAddRecord } from '@/utils/planLimits';
import { decrementBusinessUsage, safeIncrementBusinessUsage } from './businessService';

export interface AcademyStudentInput {
  studentName: string;
  parentName: string;
  phone: string;
  email: string;
  address: string;
  dateOfBirth: string;
  admissionDate: string;
  notes: string;
  status: AcademyStudent['status'];
  selectedCourses: Pick<AcademyCourse, 'courseId' | 'courseName' | 'fees'>[];
}

function normalizeStudent(data: Record<string, unknown>, id: string): AcademyStudent {
  return {
    id,
    studentId: String(data.studentId ?? id),
    admissionId: String(data.admissionId ?? ''),
    studentName: String(data.studentName ?? ''),
    parentName: String(data.parentName ?? ''),
    phone: String(data.phone ?? ''),
    email: String(data.email ?? ''),
    address: String(data.address ?? ''),
    dateOfBirth: String(data.dateOfBirth ?? ''),
    admissionDate: String(data.admissionDate ?? ''),
    status: (data.status as AcademyStudent['status']) ?? 'active',
    notes: String(data.notes ?? ''),
    totalFees: Number(data.totalFees ?? 0),
    paidFees: Number(data.paidFees ?? 0),
    pendingFees: Number(data.pendingFees ?? 0),
    enrolledCourseIds: Array.isArray(data.enrolledCourseIds)
      ? data.enrolledCourseIds.map((value) => String(value))
      : [],
    createdAt: normalizeDateValue(data.createdAt),
    updatedAt: normalizeDateValue(data.updatedAt),
  };
}

function buildAdmissionId(studentDocId: string) {
  return `ADM-${studentDocId.slice(0, 6).toUpperCase()}`;
}

export async function getAcademyStudents(businessId: string) {
  const snapshot = await getDocs(
    query(academyCollection(businessId, 'students'), orderBy('createdAt', 'desc'))
  );
  return snapshot.docs.map((doc) => mapSnapshot<AcademyStudent>(doc, normalizeStudent));
}

export async function getAcademyStudent(businessId: string, studentId: string) {
  const snapshot = await getDoc(academyDoc(businessId, 'students', studentId));
  if (!snapshot.exists()) return null;
  return normalizeStudent(snapshot.data() as Record<string, unknown>, snapshot.id);
}

export async function createAcademyStudent(businessId: string, input: AcademyStudentInput) {
  await canAddRecord(businessId, 'students');
  const firestore = getFirestoreDb();
  const studentsCollection = academyCollection(businessId, 'students');
  const totalFees = input.selectedCourses.reduce((sum, course) => sum + Number(course.fees || 0), 0);
  const studentRef = await addDoc(studentsCollection, {
    studentName: input.studentName.trim(),
    parentName: input.parentName.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    address: input.address.trim(),
    dateOfBirth: input.dateOfBirth,
    admissionDate: input.admissionDate,
    status: input.status,
    notes: input.notes.trim(),
    totalFees,
    paidFees: 0,
    pendingFees: totalFees,
    enrolledCourseIds: input.selectedCourses.map((course) => course.courseId),
    createdAt: firestoreTimestamp(),
    updatedAt: firestoreTimestamp(),
  });

  const batch = writeBatch(firestore);
  batch.update(studentRef, {
    studentId: studentRef.id,
    admissionId: buildAdmissionId(studentRef.id),
  });
  await batch.commit();

  const studentSnapshot = await getDoc(studentRef);
  const student = normalizeStudent(studentSnapshot.data() as Record<string, unknown>, studentRef.id);

  if (input.selectedCourses.length > 0) {
    const enrollmentBatch = writeBatch(firestore);
    input.selectedCourses.forEach((course) => {
      const enrollmentRef = doc(academyCollection(businessId, 'enrollments'));
      enrollmentBatch.set(enrollmentRef, {
        enrollmentId: enrollmentRef.id,
        studentId: student.studentId,
        studentName: student.studentName,
        courseId: course.courseId,
        courseName: course.courseName,
        courseFees: Number(course.fees) || 0,
        enrollmentDate: input.admissionDate,
        status: 'active',
        createdAt: firestoreTimestamp(),
        updatedAt: firestoreTimestamp(),
      });
    });
    await enrollmentBatch.commit();
  }

  await safeIncrementBusinessUsage(businessId);
  return studentRef.id;
}

export async function updateAcademyStudent(
  businessId: string,
  studentId: string,
  input: AcademyStudentInput & {
    paidFees: number;
  }
) {
  const firestore = getFirestoreDb();
  const currentStudent = await getAcademyStudent(businessId, studentId);
  if (!currentStudent) {
    throw new Error('Student not found.');
  }

  const totalFees = input.selectedCourses.reduce((sum, course) => sum + Number(course.fees || 0), 0);
  const nextPendingFees = Math.max(0, totalFees - Number(input.paidFees || 0));

  await updateDoc(academyDoc(businessId, 'students', studentId), {
    studentName: input.studentName.trim(),
    parentName: input.parentName.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    address: input.address.trim(),
    dateOfBirth: input.dateOfBirth,
    admissionDate: input.admissionDate,
    status: input.status,
    notes: input.notes.trim(),
    enrolledCourseIds: input.selectedCourses.map((course) => course.courseId),
    totalFees,
    paidFees: Number(input.paidFees) || 0,
    pendingFees: nextPendingFees,
    updatedAt: firestoreTimestamp(),
  });

  const existingEnrollments = await getDocs(
    query(academyCollection(businessId, 'enrollments'), where('studentId', '==', currentStudent.studentId))
  );
  const existingCourseIds = new Set(
    existingEnrollments.docs
      .filter((docSnapshot) => String(docSnapshot.data().status ?? '') !== 'cancelled')
      .map((docSnapshot) => String(docSnapshot.data().courseId ?? ''))
  );
  const nextCourseIds = new Set(input.selectedCourses.map((course) => course.courseId));
  const batch = writeBatch(firestore);

  input.selectedCourses.forEach((course) => {
    if (!existingCourseIds.has(course.courseId)) {
      const enrollmentRef = doc(academyCollection(businessId, 'enrollments'));
      batch.set(enrollmentRef, {
        enrollmentId: enrollmentRef.id,
        studentId: currentStudent.studentId,
        studentName: input.studentName.trim(),
        courseId: course.courseId,
        courseName: course.courseName,
        courseFees: Number(course.fees) || 0,
        enrollmentDate: input.admissionDate,
        status: 'active',
        createdAt: firestoreTimestamp(),
        updatedAt: firestoreTimestamp(),
      });
    }
  });

  existingEnrollments.docs.forEach((docSnapshot) => {
    const courseId = String(docSnapshot.data().courseId ?? '');
    if (!nextCourseIds.has(courseId)) {
      batch.update(docSnapshot.ref, {
        status: 'cancelled',
        updatedAt: firestoreTimestamp(),
      });
    }
  });

  await batch.commit();
}

export async function deleteAcademyStudent(businessId: string, studentId: string) {
  const firestore = getFirestoreDb();
  const enrollments = await getDocs(
    query(academyCollection(businessId, 'enrollments'), where('studentId', '==', studentId))
  );
  const fees = await getDocs(
    query(academyCollection(businessId, 'fees'), where('studentId', '==', studentId))
  );
  const receipts = await getDocs(
    query(academyCollection(businessId, 'receipts'), where('studentId', '==', studentId))
  );
  const attendance = await getDocs(
    query(academyCollection(businessId, 'attendance'), where('studentId', '==', studentId))
  );

  const batch = writeBatch(firestore);
  batch.delete(academyDoc(businessId, 'students', studentId));
  enrollments.docs.forEach((doc) => batch.delete(doc.ref));
  fees.docs.forEach((doc) => batch.delete(doc.ref));
  receipts.docs.forEach((doc) => batch.delete(doc.ref));
  attendance.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  await decrementBusinessUsage(businessId);
}

export async function searchStudentByCourse(businessId: string, courseId: string) {
  const snapshot = await getDocs(
    query(academyCollection(businessId, 'students'), where('enrolledCourseIds', 'array-contains', courseId))
  );
  return snapshot.docs.map((doc) => mapSnapshot<AcademyStudent>(doc, normalizeStudent));
}
