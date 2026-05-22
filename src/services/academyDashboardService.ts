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
import { academyCollection, mapSnapshot, normalizeDateValue, sumNumber } from './academyShared';

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

export interface AcademyOverviewData {
  summary: AcademyDashboardSummary;
  recentStudents: AcademyStudent[];
  recentPayments: AcademyFee[];
  todayAttendance: AcademyAttendance[];
}

export interface AcademySidebarCounts {
  students: number;
  courses: number;
  fees: number;
  receipts: number;
  attendance: number;
}

export async function getAcademyOverviewData(businessId: string): Promise<AcademyOverviewData> {
  const today = new Date().toISOString().slice(0, 10);
  const [studentsSnap, coursesSnap, feesSnap, attendanceSnap] = await Promise.all([
    getDocs(query(academyCollection(businessId, 'students'), orderBy('createdAt', 'desc'))),
    getDocs(query(academyCollection(businessId, 'courses'), orderBy('createdAt', 'desc'))),
    getDocs(query(academyCollection(businessId, 'fees'), orderBy('createdAt', 'desc'))),
    getDocs(
      query(
        academyCollection(businessId, 'attendance'),
        where('attendanceDate', '==', today),
        orderBy('createdAt', 'desc')
      )
    ),
  ]);

  const students = studentsSnap.docs.map((doc) => mapSnapshot<AcademyStudent>(doc, normalizeStudent));
  const courses = coursesSnap.docs.map((doc) => mapSnapshot<AcademyCourse>(doc, normalizeCourse));
  const fees = feesSnap.docs.map((doc) => mapSnapshot<AcademyFee>(doc, normalizeFee));
  const attendance = attendanceSnap.docs.map((doc) =>
    mapSnapshot<AcademyAttendance>(doc, normalizeAttendance)
  );

  return {
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
  };
}

export async function getAcademySidebarCounts(businessId: string): Promise<AcademySidebarCounts> {
  const today = new Date().toISOString().slice(0, 10);
  const [students, courses, fees, receipts, attendance] = await Promise.all([
    getDocs(academyCollection(businessId, 'students')),
    getDocs(query(academyCollection(businessId, 'courses'), where('status', '==', 'active'))),
    getDocs(query(academyCollection(businessId, 'fees'), where('status', 'in', ['pending', 'partial']))),
    getDocs(academyCollection(businessId, 'receipts')),
    getDocs(query(academyCollection(businessId, 'attendance'), where('attendanceDate', '==', today))),
  ]);

  return {
    students: students.size,
    courses: courses.size,
    fees: fees.size,
    receipts: receipts.size,
    attendance: attendance.size,
  };
}

export async function getStudentProfileData(businessId: string, studentId: string) {
  const [studentSnap, enrollmentsSnap, feesSnap, receiptsSnap, attendanceSnap] = await Promise.all([
    getDocs(query(academyCollection(businessId, 'students'), where('studentId', '==', studentId), limit(1))),
    getDocs(query(academyCollection(businessId, 'enrollments'), where('studentId', '==', studentId), orderBy('createdAt', 'desc'))),
    getDocs(query(academyCollection(businessId, 'fees'), where('studentId', '==', studentId), orderBy('createdAt', 'desc'))),
    getDocs(query(academyCollection(businessId, 'receipts'), where('studentId', '==', studentId), orderBy('createdAt', 'desc'))),
    getDocs(query(academyCollection(businessId, 'attendance'), where('studentId', '==', studentId), orderBy('createdAt', 'desc'))),
  ]);

  const student = studentSnap.docs[0]
    ? mapSnapshot<AcademyStudent>(studentSnap.docs[0], normalizeStudent)
    : null;
  const enrollments = enrollmentsSnap.docs.map((doc) =>
    mapSnapshot<AcademyEnrollment>(doc, normalizeEnrollment)
  );
  const fees = feesSnap.docs.map((doc) => mapSnapshot<AcademyFee>(doc, normalizeFee));
  const receipts = receiptsSnap.docs.map((doc) => mapSnapshot<AcademyReceipt>(doc, normalizeReceipt));
  const attendance = attendanceSnap.docs.map((doc) =>
    mapSnapshot<AcademyAttendance>(doc, normalizeAttendance)
  );

  return { student, enrollments, fees, receipts, attendance };
}
