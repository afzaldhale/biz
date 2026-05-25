import { getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import {
  AcademyAttendance,
  AcademyCourse,
  AcademyDashboardSummary,
  AcademyEnrollment,
  AcademyFee,
  AcademyReceipt,
  AcademyStudent,
} from '@/types';
import {
  academyCollection,
  isFirestoreIndexError,
  mapSnapshot,
  normalizeDateValue,
  sortByCreatedAtDesc,
  sumNumber,
} from './academyShared';

const ACADEMY_DASHBOARD_CACHE_TTL_MS = 30_000;
const overviewCache = new Map<string, { expiresAt: number; value: AcademyOverviewData }>();
const sidebarCache = new Map<string, { expiresAt: number; value: AcademySidebarCounts }>();

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

function normalizeCourse(data: Record<string, unknown>, id: string): AcademyCourse {
  return {
    id,
    courseId: String(data.courseId ?? id),
    courseName: String(data.courseName ?? ''),
    duration: String(data.duration ?? ''),
    fees: Number(data.fees ?? 0),
    description: String(data.description ?? ''),
    status: (data.status as AcademyCourse['status']) ?? 'active',
    createdAt: normalizeDateValue(data.createdAt),
    updatedAt: normalizeDateValue(data.updatedAt),
  };
}

function normalizeFee(data: Record<string, unknown>, id: string): AcademyFee {
  return {
    id,
    feeId: String(data.feeId ?? id),
    studentId: String(data.studentId ?? ''),
    studentName: String(data.studentName ?? ''),
    courseId: String(data.courseId ?? ''),
    courseName: String(data.courseName ?? ''),
    enrollmentId: String(data.enrollmentId ?? ''),
    totalAmount: Number(data.totalAmount ?? 0),
    paidAmount: Number(data.paidAmount ?? 0),
    pendingAmount: Number(data.pendingAmount ?? 0),
    paymentMode: (data.paymentMode as AcademyFee['paymentMode']) ?? 'cash',
    paymentDate: String(data.paymentDate ?? ''),
    status: (data.status as AcademyFee['status']) ?? 'pending',
    receiptId: String(data.receiptId ?? ''),
    notes: String(data.notes ?? ''),
    createdAt: normalizeDateValue(data.createdAt),
    updatedAt: normalizeDateValue(data.updatedAt),
  };
}

function normalizeReceipt(data: Record<string, unknown>, id: string): AcademyReceipt {
  return {
    id,
    receiptId: String(data.receiptId ?? id),
    receiptNumber: String(data.receiptNumber ?? ''),
    studentId: String(data.studentId ?? ''),
    studentName: String(data.studentName ?? ''),
    courseId: String(data.courseId ?? ''),
    courseName: String(data.courseName ?? ''),
    feeId: String(data.feeId ?? ''),
    amountPaid: Number(data.amountPaid ?? 0),
    pendingAmount: Number(data.pendingAmount ?? 0),
    paymentMode: (data.paymentMode as AcademyReceipt['paymentMode']) ?? 'cash',
    paymentDate: String(data.paymentDate ?? ''),
    businessName: String(data.businessName ?? ''),
    businessAddress: String(data.businessAddress ?? ''),
    businessPhone: String(data.businessPhone ?? ''),
    createdAt: normalizeDateValue(data.createdAt),
  };
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

async function runDashboardQuery<T>(
  label: string,
  load: () => Promise<T>,
  fallback: T
): Promise<{ value: T; indexError: boolean; failed: boolean }> {
  try {
    return { value: await load(), indexError: false, failed: false };
  } catch (error) {
    console.error(`[academy-dashboard] ${label} query failed`, error);
    return { value: fallback, indexError: isFirestoreIndexError(error), failed: true };
  }
}

export interface AcademyOverviewData {
  summary: AcademyDashboardSummary;
  recentStudents: AcademyStudent[];
  recentPayments: AcademyFee[];
  todayAttendance: AcademyAttendance[];
  warningMessage: string | null;
}

export interface AcademySidebarCounts {
  students: number;
  courses: number;
  fees: number;
  receipts: number;
  attendance: number;
}

export interface AcademyStudentHistory {
  student: AcademyStudent | null;
  enrollments: AcademyEnrollment[];
  fees: AcademyFee[];
  receipts: AcademyReceipt[];
  attendance: AcademyAttendance[];
}

export async function getAcademyDashboardStats(
  businessId: string
): Promise<AcademyOverviewData['summary']> {
  const overview = await getAcademyOverviewData(businessId);
  return overview.summary;
}

export async function getAcademyOverviewData(businessId: string): Promise<AcademyOverviewData> {
  const cached = overviewCache.get(businessId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const today = new Date().toISOString().slice(0, 10);
  const [studentsResult, coursesResult, feesResult, attendanceResult] = await Promise.all([
    runDashboardQuery(
      'students',
      async () => {
        const snapshot = await getDocs(
          query(academyCollection(businessId, 'students'), orderBy('createdAt', 'desc'))
        );
        return snapshot.docs.map((doc) => mapSnapshot<AcademyStudent>(doc, normalizeStudent));
      },
      [] as AcademyStudent[]
    ),
    runDashboardQuery(
      'courses',
      async () => {
        const snapshot = await getDocs(
          query(academyCollection(businessId, 'courses'), orderBy('createdAt', 'desc'))
        );
        return snapshot.docs.map((doc) => mapSnapshot<AcademyCourse>(doc, normalizeCourse));
      },
      [] as AcademyCourse[]
    ),
    runDashboardQuery(
      'fees',
      async () => {
        const snapshot = await getDocs(
          query(academyCollection(businessId, 'fees'), orderBy('createdAt', 'desc'))
        );
        return snapshot.docs.map((doc) => mapSnapshot<AcademyFee>(doc, normalizeFee));
      },
      [] as AcademyFee[]
    ),
    runDashboardQuery(
      'attendance',
      async () => {
        const snapshot = await getDocs(
          query(academyCollection(businessId, 'attendance'), where('attendanceDate', '==', today))
        );
        return sortByCreatedAtDesc(
          snapshot.docs.map((doc) => mapSnapshot<AcademyAttendance>(doc, normalizeAttendance))
        );
      },
      [] as AcademyAttendance[]
    ),
  ]);

  const students = studentsResult.value;
  const courses = coursesResult.value;
  const fees = feesResult.value;
  const attendance = attendanceResult.value;
  const hasIndexError = [
    studentsResult,
    coursesResult,
    feesResult,
    attendanceResult,
  ].some((result) => result.indexError);
  const hasAnyFailure = [studentsResult, coursesResult, feesResult, attendanceResult].some(
    (result) => result.failed
  );

  const nextValue = {
    summary: {
      totalStudents: students.length,
      activeCourses: courses.filter((course) => course.status === 'active').length,
      feesCollected: sumNumber(fees.map((fee) => fee.paidAmount)),
      pendingFees: sumNumber(students.map((student) => student.pendingFees)),
      todayAttendanceCount: attendance.length,
      todayPresentCount: attendance.filter((record) => record.status === 'present').length,
      todayAbsentCount: attendance.filter((record) => record.status === 'absent').length,
      todayLateCount: attendance.filter((record) => record.status === 'late').length,
    },
    recentStudents: students.slice(0, 5),
    recentPayments: fees.slice(0, 5),
    todayAttendance: attendance,
    warningMessage: hasIndexError
      ? 'Dashboard data needs a Firestore index. Please deploy indexes or simplify the query.'
      : hasAnyFailure
        ? 'Dashboard insights are being prepared. Please try again shortly.'
        : null,
  };

  overviewCache.set(businessId, {
    value: nextValue,
    expiresAt: Date.now() + ACADEMY_DASHBOARD_CACHE_TTL_MS,
  });

  return nextValue;
}

export async function getAcademySidebarCounts(businessId: string): Promise<AcademySidebarCounts> {
  const cached = sidebarCache.get(businessId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const today = new Date().toISOString().slice(0, 10);
  const [students, courses, fees, receipts, attendance] = await Promise.all([
    getDocs(academyCollection(businessId, 'students')),
    getDocs(query(academyCollection(businessId, 'courses'), where('status', '==', 'active'))),
    getDocs(
      query(academyCollection(businessId, 'fees'), where('status', 'in', ['pending', 'partial']))
    ),
    getDocs(academyCollection(businessId, 'receipts')),
    getDocs(query(academyCollection(businessId, 'attendance'), where('attendanceDate', '==', today))),
  ]);

  const nextValue = {
    students: students.size,
    courses: courses.size,
    fees: fees.size,
    receipts: receipts.size,
    attendance: attendance.size,
  };

  sidebarCache.set(businessId, {
    value: nextValue,
    expiresAt: Date.now() + ACADEMY_DASHBOARD_CACHE_TTL_MS,
  });

  return nextValue;
}

export async function getStudentHistory(
  businessId: string,
  studentId: string
): Promise<AcademyStudentHistory> {
  const [studentSnap, enrollmentsSnap, feesSnap, receiptsSnap, attendanceSnap] = await Promise.all([
    getDocs(query(academyCollection(businessId, 'students'), where('studentId', '==', studentId), limit(1))),
    getDocs(query(academyCollection(businessId, 'enrollments'), where('studentId', '==', studentId))),
    getDocs(query(academyCollection(businessId, 'fees'), where('studentId', '==', studentId))),
    getDocs(query(academyCollection(businessId, 'receipts'), where('studentId', '==', studentId))),
    getDocs(query(academyCollection(businessId, 'attendance'), where('studentId', '==', studentId))),
  ]);

  const student = studentSnap.docs[0]
    ? mapSnapshot<AcademyStudent>(studentSnap.docs[0], normalizeStudent)
    : null;

  return {
    student,
    enrollments: sortByCreatedAtDesc(
      enrollmentsSnap.docs.map((doc) => mapSnapshot<AcademyEnrollment>(doc, normalizeEnrollment))
    ),
    fees: sortByCreatedAtDesc(
      feesSnap.docs.map((doc) => mapSnapshot<AcademyFee>(doc, normalizeFee))
    ),
    receipts: sortByCreatedAtDesc(
      receiptsSnap.docs.map((doc) => mapSnapshot<AcademyReceipt>(doc, normalizeReceipt))
    ),
    attendance: sortByCreatedAtDesc(
      attendanceSnap.docs.map((doc) => mapSnapshot<AcademyAttendance>(doc, normalizeAttendance))
    ),
  };
}

export async function getStudentProfileData(businessId: string, studentId: string) {
  return getStudentHistory(businessId, studentId);
}
