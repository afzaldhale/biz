import { getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { AcademyReceipt } from '@/types';
import { academyCollection, academyDoc, mapSnapshot, normalizeDateValue } from './academyShared';

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

export async function getAcademyReceipts(businessId: string) {
  const snapshot = await getDocs(
    query(academyCollection(businessId, 'receipts'), orderBy('createdAt', 'desc'))
  );
  return snapshot.docs.map((doc) => mapSnapshot<AcademyReceipt>(doc, normalizeReceipt));
}

export async function getStudentReceipts(businessId: string, studentId: string) {
  const receipts = await getAcademyReceipts(businessId);
  return receipts.filter((receipt) => receipt.studentId === studentId);
}

export async function getReceiptById(businessId: string, receiptId: string) {
  const snapshot = await getDoc(academyDoc(businessId, 'receipts', receiptId));
  if (!snapshot.exists()) return null;
  return normalizeReceipt(snapshot.data() as Record<string, unknown>, snapshot.id);
}
