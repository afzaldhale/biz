import {
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  where,
} from 'firebase/firestore';
import { AcademyFee, AcademyPaymentMode, AcademyReceipt, AcademyStudent, BusinessProfile } from '@/types';
import {
  academyCollection,
  academyDoc,
  firestoreTimestamp,
  getFirestoreDb,
  mapSnapshot,
  normalizeDateValue,
} from './academyShared';
import { canAddRecord } from '@/utils/planLimits';
import { safeIncrementBusinessUsage } from './businessService';

export interface RecordFeePaymentInput {
  studentId: string;
  courseId: string;
  enrollmentId: string;
  amountPaid: number;
  paymentMode: AcademyPaymentMode;
  paymentDate: string;
  notes: string;
  businessProfile: Pick<BusinessProfile, 'businessName' | 'address' | 'phone'>;
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

export async function getAcademyFees(businessId: string) {
  const snapshot = await getDocs(
    query(academyCollection(businessId, 'fees'), orderBy('createdAt', 'desc'))
  );
  return snapshot.docs.map((doc) => mapSnapshot<AcademyFee>(doc, normalizeFee));
}

export async function getStudentFeeHistory(businessId: string, studentId: string) {
  const snapshot = await getDocs(
    query(
      academyCollection(businessId, 'fees'),
      where('studentId', '==', studentId),
      orderBy('createdAt', 'desc')
    )
  );
  return snapshot.docs.map((doc) => mapSnapshot<AcademyFee>(doc, normalizeFee));
}

export function buildReceiptNumber(receiptCount: number) {
  return `RCPT-${String(receiptCount + 1).padStart(5, '0')}`;
}

export async function recordAcademyFeePayment(businessId: string, input: RecordFeePaymentInput) {
  await canAddRecord(businessId, 'fees');
  const firestore = getFirestoreDb();
  const studentsCollection = academyCollection(businessId, 'students');
  const feesCollection = academyCollection(businessId, 'fees');
  const receiptsCollection = academyCollection(businessId, 'receipts');
  const enrollmentsCollection = academyCollection(businessId, 'enrollments');
  const existingReceipts = await getDocs(receiptsCollection);

  const result = await runTransaction(firestore, async (transaction) => {
    const studentRef = academyDoc(businessId, 'students', input.studentId);
    const enrollmentRef = academyDoc(businessId, 'enrollments', input.enrollmentId);
    const studentSnap = await transaction.get(studentRef);
    const enrollmentSnap = await transaction.get(enrollmentRef);

    if (!studentSnap.exists()) {
      throw new Error('Student not found.');
    }
    if (!enrollmentSnap.exists()) {
      throw new Error('Enrollment not found.');
    }

    const studentData = studentSnap.data() as AcademyStudent;
    const enrollmentData = enrollmentSnap.data();
    const currentPending = Number(studentData.pendingFees ?? 0);
    const paid = Number(input.amountPaid || 0);

    if (paid <= 0) {
      throw new Error('Amount cannot be 0.');
    }
    if (paid > currentPending) {
      throw new Error('Amount cannot exceed pending amount.');
    }

    const nextPaid = Number(studentData.paidFees ?? 0) + paid;
    const nextPending = Math.max(0, currentPending - paid);
    const totalAmount = Number(studentData.totalFees ?? 0);

    const feeRef = doc(feesCollection);
    const receiptRef = doc(receiptsCollection);
    const receiptNumber = buildReceiptNumber(existingReceipts.size);

    const feeRecord = {
      feeId: feeRef.id,
      studentId: input.studentId,
      studentName: String(studentData.studentName ?? ''),
      courseId: input.courseId,
      courseName: String(enrollmentData.courseName ?? ''),
      enrollmentId: input.enrollmentId,
      totalAmount,
      paidAmount: paid,
      pendingAmount: nextPending,
      paymentMode: input.paymentMode,
      paymentDate: input.paymentDate,
      status: nextPending === 0 ? 'paid' : 'partial',
      receiptId: receiptRef.id,
      notes: input.notes.trim(),
      createdAt: firestoreTimestamp(),
      updatedAt: firestoreTimestamp(),
    };

    const receiptRecord: Omit<AcademyReceipt, 'id' | 'createdAt'> & { createdAt: unknown } = {
      receiptId: receiptRef.id,
      receiptNumber,
      studentId: input.studentId,
      studentName: String(studentData.studentName ?? ''),
      courseId: input.courseId,
      courseName: String(enrollmentData.courseName ?? ''),
      feeId: feeRef.id,
      amountPaid: paid,
      pendingAmount: nextPending,
      paymentMode: input.paymentMode,
      paymentDate: input.paymentDate,
      businessName: input.businessProfile.businessName,
      businessAddress: input.businessProfile.address ?? '',
      businessPhone: input.businessProfile.phone,
      createdAt: firestoreTimestamp(),
    };

    transaction.set(feeRef, feeRecord);
    transaction.set(receiptRef, receiptRecord);
    transaction.update(studentRef, {
      paidFees: nextPaid,
      pendingFees: nextPending,
      updatedAt: firestoreTimestamp(),
    });

    return {
      feeId: feeRef.id,
      receiptId: receiptRef.id,
      receiptNumber,
    };
  });

  await safeIncrementBusinessUsage(businessId);
  await safeIncrementBusinessUsage(businessId);
  return result;
}
