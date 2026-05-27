import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { AcademyCourse, AcademyStudent, BusinessProfile } from '@/types';
import {
  academyCollection,
  academyDoc,
  firestoreTimestamp,
  getFirestoreDb,
  mapSnapshot,
  normalizeDateValue,
  sortByCreatedAtDesc,
} from './academyShared';
import { canAddRecord } from '@/utils/planLimits';
import { getStudentHistory } from './academyDashboardService';
import {
  decrementUsageOnDeactivate,
  incrementUsageOnCreate,
  SubscriptionLimitError,
} from './subscriptionService';
import {
  calculateRemainingRecords,
  normalizeSubscriptionBusinessData,
} from '@/utils/subscription';

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

export async function getStudents(businessId: string) {
  return getAcademyStudents(businessId);
}

export async function getAcademyStudents(businessId: string) {
  const snapshot = await getDocs(
    query(academyCollection(businessId, 'students'), orderBy('createdAt', 'desc'))
  );
  return snapshot.docs.map((docSnapshot) => mapSnapshot<AcademyStudent>(docSnapshot, normalizeStudent));
}

export async function getAcademyStudent(businessId: string, studentId: string) {
  const snapshot = await getDoc(academyDoc(businessId, 'students', studentId));
  if (!snapshot.exists()) return null;
  return normalizeStudent(snapshot.data() as Record<string, unknown>, snapshot.id);
}

export async function getStudentByBusinessStudentId(businessId: string, studentId: string) {
  const snapshot = await getDocs(
    query(academyCollection(businessId, 'students'), where('studentId', '==', studentId))
  );
  const first = snapshot.docs[0];
  return first ? mapSnapshot<AcademyStudent>(first, normalizeStudent) : null;
}

export async function createAcademyStudent(businessId: string, input: AcademyStudentInput) {
  const firestore = getFirestoreDb();
  const totalFees = input.selectedCourses.reduce((sum, course) => sum + Number(course.fees || 0), 0);
  const studentRef = doc(collection(firestore, 'businesses', businessId, 'students'));
  const studentId = studentRef.id;
  const admissionId = buildAdmissionId(studentId);
  const businessRef = doc(firestore, 'businesses', businessId);

  await runTransaction(firestore, async (transaction) => {
    if (input.status === 'active') {
      const businessSnapshot = await transaction.get(businessRef);
      if (!businessSnapshot.exists()) {
        throw new Error('Business profile not found.');
      }

      const business = normalizeSubscriptionBusinessData(
        businessSnapshot.data() as BusinessProfile
      );
      const currentUsage = business?.currentUsage ?? 0;
      const recordLimit = business?.recordLimit ?? business?.planLimit ?? 0;

      if (currentUsage >= recordLimit) {
        throw new SubscriptionLimitError(currentUsage, recordLimit);
      }

      const nextUsage = currentUsage + 1;
      transaction.update(businessRef, {
        currentUsage: nextUsage,
        remainingRecords: calculateRemainingRecords(recordLimit, nextUsage),
        updatedAt: firestoreTimestamp(),
      });
    }

    transaction.set(studentRef, {
      studentId,
      admissionId,
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

    input.selectedCourses.forEach((course) => {
      const enrollmentRef = doc(collection(firestore, 'businesses', businessId, 'enrollments'));
      transaction.set(enrollmentRef, {
        enrollmentId: enrollmentRef.id,
        studentId,
        studentName: input.studentName.trim(),
        courseId: course.courseId,
        courseName: course.courseName,
        courseFees: Number(course.fees) || 0,
        enrollmentDate: input.admissionDate,
        status: 'active',
        createdAt: firestoreTimestamp(),
        updatedAt: firestoreTimestamp(),
      });
    });
  });

  return studentId;
}

export async function updateStudent(
  businessId: string,
  studentId: string,
  data: Partial<AcademyStudentInput> & { paidFees?: number; pendingFees?: number; totalFees?: number }
) {
  const updates: Record<string, unknown> = {
    updatedAt: firestoreTimestamp(),
  };

  if (typeof data.studentName === 'string') updates.studentName = data.studentName.trim();
  if (typeof data.parentName === 'string') updates.parentName = data.parentName.trim();
  if (typeof data.phone === 'string') updates.phone = data.phone.trim();
  if (typeof data.email === 'string') updates.email = data.email.trim();
  if (typeof data.address === 'string') updates.address = data.address.trim();
  if (typeof data.dateOfBirth === 'string') updates.dateOfBirth = data.dateOfBirth;
  if (typeof data.admissionDate === 'string') updates.admissionDate = data.admissionDate;
  if (typeof data.notes === 'string') updates.notes = data.notes.trim();
  if (typeof data.status === 'string') updates.status = data.status;
  if (typeof data.totalFees === 'number') updates.totalFees = data.totalFees;
  if (typeof data.paidFees === 'number') updates.paidFees = data.paidFees;
  if (typeof data.pendingFees === 'number') updates.pendingFees = data.pendingFees;
  if (Array.isArray(data.selectedCourses)) {
    updates.enrolledCourseIds = data.selectedCourses.map((course) => course.courseId);
  }

  await updateDoc(academyDoc(businessId, 'students', studentId), updates);
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
  const statusChanged = currentStudent.status !== input.status;

  if (statusChanged && currentStudent.status !== 'active' && input.status === 'active') {
    await canAddRecord(businessId, 'students');
    await incrementUsageOnCreate(businessId);
  }

  await updateStudent(businessId, studentId, {
    ...input,
    totalFees,
    paidFees: Number(input.paidFees) || 0,
    pendingFees: nextPendingFees,
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

  if (statusChanged && currentStudent.status === 'active' && input.status !== 'active') {
    await decrementUsageOnDeactivate(businessId);
  }
}

export async function deleteAcademyStudent(businessId: string, studentId: string) {
  const student = await getAcademyStudent(businessId, studentId);
  await updateDoc(academyDoc(businessId, 'students', studentId), {
    status: 'inactive',
    updatedAt: firestoreTimestamp(),
  });

  if (student?.status === 'active') {
    await decrementUsageOnDeactivate(businessId);
  }
}

export async function getStudentHistorySummary(businessId: string, studentId: string) {
  return getStudentHistory(businessId, studentId);
}

export async function searchStudentByCourse(businessId: string, courseId: string) {
  const snapshot = await getDocs(
    query(academyCollection(businessId, 'students'), where('enrolledCourseIds', 'array-contains', courseId))
  );
  return sortByCreatedAtDesc(
    snapshot.docs.map((docSnapshot) => mapSnapshot<AcademyStudent>(docSnapshot, normalizeStudent))
  );
}
