'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Eye, Plus, Printer, Search } from 'lucide-react';
import { AcademyEnrollment, AcademyFee, AcademyPaymentMode, AcademyReceipt, AcademyStudent, AuthUser } from '@/types';
import { getAcademyStudents } from '@/services/academyStudentService';
import { getStudentEnrollments } from '@/services/academyEnrollmentService';
import { getAcademyFees, recordAcademyFeePayment } from '@/services/academyFeeService';
import { getAcademyReceipts, getReceiptById } from '@/services/academyReceiptService';
import { useBusiness } from '@/context/BusinessContext';

interface AcademyFeesPanelProps {
  user: AuthUser;
  onNavigate: (navId: string) => void;
}

interface FeePaymentForm {
  studentId: string;
  enrollmentId: string;
  amountPaid: string;
  paymentMode: AcademyPaymentMode;
  paymentDate: string;
  notes: string;
}

const emptyForm: FeePaymentForm = {
  studentId: '',
  enrollmentId: '',
  amountPaid: '',
  paymentMode: 'cash',
  paymentDate: new Date().toISOString().slice(0, 10),
  notes: '',
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function printReceipt(receipt: AcademyReceipt) {
  const receiptWindow = window.open('', '_blank', 'width=920,height=760');
  if (!receiptWindow) {
    toast.error('Popup blocked. Please allow popups to print receipts.');
    return;
  }

  receiptWindow.document.write(`
    <html>
      <head>
        <title>${receipt.receiptNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; color: #111827; }
          .shell { max-width: 820px; margin: 0 auto; padding: 32px; }
          .card { border: 1px solid #dbe3f0; border-radius: 18px; padding: 28px; }
          .row { display: flex; justify-content: space-between; gap: 24px; }
          .muted { color: #64748b; font-size: 13px; }
          .brand { color: #4338ca; font-size: 28px; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="shell">
          <div class="card">
            <div class="row">
              <div>
                <div class="brand">${receipt.businessName}</div>
                <div class="muted">${receipt.businessAddress || ''}</div>
                <div class="muted">${receipt.businessPhone || ''}</div>
              </div>
              <div>
                <div><strong>Receipt:</strong> ${receipt.receiptNumber}</div>
                <div><strong>Date:</strong> ${receipt.paymentDate}</div>
              </div>
            </div>
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />
            <div><strong>Student:</strong> ${receipt.studentName}</div>
            <div style="margin-top: 10px;"><strong>Course:</strong> ${receipt.courseName}</div>
            <div style="margin-top: 10px;"><strong>Payment Mode:</strong> ${receipt.paymentMode}</div>
            <div style="margin-top: 24px;"><strong>Amount Paid:</strong> ${formatCurrency(receipt.amountPaid)}</div>
            <div style="margin-top: 10px;"><strong>Pending Amount:</strong> ${formatCurrency(receipt.pendingAmount)}</div>
          </div>
        </div>
      </body>
    </html>
  `);
  receiptWindow.document.close();
  receiptWindow.focus();
  receiptWindow.print();
}

export default function AcademyFeesPanel({ user }: AcademyFeesPanelProps) {
  const { business } = useBusiness();
  const [students, setStudents] = useState<AcademyStudent[]>([]);
  const [enrollments, setEnrollments] = useState<AcademyEnrollment[]>([]);
  const [fees, setFees] = useState<AcademyFee[]>([]);
  const [receiptsMap, setReceiptsMap] = useState<Map<string, AcademyReceipt>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AcademyFee['status']>('all');
  const [modeFilter, setModeFilter] = useState<'all' | AcademyPaymentMode>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<FeePaymentForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([getAcademyStudents(user.id), getAcademyFees(user.id), getAcademyReceipts(user.id)])
      .then(([studentData, feeData, receiptData]) => {
        if (!active) return;
        setStudents(studentData);
        setFees(feeData);
        setReceiptsMap(new Map(receiptData.map((receipt) => [receipt.receiptId, receipt])));
      })
      .catch(() => {
        if (!active) return;
        toast.error('Unable to load fee records right now.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user.id]);

  useEffect(() => {
    if (!form.studentId) {
      setEnrollments([]);
      setForm((current) => ({ ...current, enrollmentId: '' }));
      return;
    }

    getStudentEnrollments(user.id, form.studentId)
      .then((data) => {
        setEnrollments(data.filter((item) => item.status === 'active'));
      })
      .catch(() => {
        toast.error('Unable to load enrollments for this student.');
      });
  }, [form.studentId, user.id]);

  useEffect(() => {
    const selectedStudentId = window.sessionStorage.getItem('academy:selectedStudentId');
    if (!selectedStudentId) return;
    setForm((current) => ({ ...current, studentId: selectedStudentId }));
    window.sessionStorage.removeItem('academy:selectedStudentId');
  }, []);

  const selectedStudent = useMemo(
    () => students.find((student) => student.studentId === form.studentId) ?? null,
    [form.studentId, students]
  );
  const selectedEnrollment = useMemo(
    () => enrollments.find((enrollment) => enrollment.enrollmentId === form.enrollmentId) ?? null,
    [enrollments, form.enrollmentId]
  );

  const filteredFees = useMemo(() => {
    const query = search.trim().toLowerCase();
    return fees.filter((fee) => {
      const matchesStatus = statusFilter === 'all' || fee.status === statusFilter;
      const matchesMode = modeFilter === 'all' || fee.paymentMode === modeFilter;
      const matchesQuery =
        query.length === 0 ||
        [fee.studentName, fee.courseName, fee.status, fee.paymentMode]
          .join(' ')
          .toLowerCase()
          .includes(query);
      return matchesStatus && matchesMode && matchesQuery;
    });
  }, [fees, modeFilter, search, statusFilter]);

  const openModal = useCallback(() => {
    setForm(emptyForm);
    setEnrollments([]);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setForm(emptyForm);
    setEnrollments([]);
    setIsModalOpen(false);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!selectedStudent) {
        toast.error('Student required.');
        return;
      }
      if (!selectedEnrollment) {
        toast.error('Course required.');
        return;
      }
      const amount = Number(form.amountPaid || 0);
      if (amount <= 0) {
        toast.error('Amount cannot be 0.');
        return;
      }
      if (amount > selectedStudent.pendingFees) {
        toast.error('Amount cannot exceed pending amount.');
        return;
      }
      if (!business) {
        toast.error('Business profile not loaded.');
        return;
      }

      setSaving(true);
      try {
        const paymentResult = await recordAcademyFeePayment(user.id, {
          studentId: selectedStudent.studentId,
          courseId: selectedEnrollment.courseId,
          enrollmentId: selectedEnrollment.enrollmentId,
          amountPaid: amount,
          paymentMode: form.paymentMode,
          paymentDate: form.paymentDate,
          notes: form.notes,
          businessProfile: {
            businessName: business.businessName,
            address: business.address ?? '',
            phone: business.phone,
          },
        });

        const [nextFees, nextReceipts, nextStudents] = await Promise.all([
          getAcademyFees(user.id),
          getAcademyReceipts(user.id),
          getAcademyStudents(user.id),
        ]);
        setFees(nextFees);
        setStudents(nextStudents);
        setReceiptsMap(new Map(nextReceipts.map((receipt) => [receipt.receiptId, receipt])));
        toast.success('Payment saved and receipt generated.');
        closeModal();

        const receipt = await getReceiptById(user.id, paymentResult.receiptId);
        if (receipt) {
          printReceipt(receipt);
        }
      } catch (caught) {
        toast.error(caught instanceof Error ? caught.message : 'Unable to record payment.');
      } finally {
        setSaving(false);
      }
    },
    [business, closeModal, form.amountPaid, form.notes, form.paymentDate, form.paymentMode, selectedEnrollment, selectedStudent, user.id]
  );

  return (
    <div className="max-w-screen-2xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-700 uppercase tracking-[0.24em] text-primary">Academy Fees</p>
          <h1 className="mt-1 text-2xl font-700 text-foreground">Fee Ledger</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Student-linked fee payments with automatic receipt generation.
          </p>
        </div>
        <button type="button" onClick={openModal} className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm">
          <Plus size={16} />
          Add Fee Payment
        </button>
      </div>

      <div className="glass-card rounded-2xl border border-border overflow-hidden">
        <div className="grid gap-4 border-b border-border p-5 lg:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by student, course, status, or payment mode"
              className="w-full rounded-xl border border-border bg-input py-3 pl-11 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | AcademyFee['status'])}
            className="rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All statuses</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
          </select>
          <select
            value={modeFilter}
            onChange={(event) => setModeFilter(event.target.value as 'all' | AcademyPaymentMode)}
            className="rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All modes</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="bank">Bank</option>
            <option value="card">Card</option>
          </select>
        </div>

        {loading ? (
          <div className="p-16 text-center text-muted-foreground">Loading fee records...</div>
        ) : filteredFees.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm font-600 text-foreground">
              No fee records yet. Add a payment to generate receipts.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/80 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-4">Receipt No.</th>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Course</th>
                  <th className="px-5 py-4">Amount Paid</th>
                  <th className="px-5 py-4">Pending After Payment</th>
                  <th className="px-5 py-4">Payment Mode</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {filteredFees.map((fee) => {
                  const receipt = receiptsMap.get(fee.receiptId);
                  return (
                    <tr key={fee.id}>
                      <td className="px-5 py-4 text-muted-foreground">{receipt?.receiptNumber ?? '—'}</td>
                      <td className="px-5 py-4 font-600 text-foreground">{fee.studentName}</td>
                      <td className="px-5 py-4 text-muted-foreground">{fee.courseName}</td>
                      <td className="px-5 py-4 text-muted-foreground">{formatCurrency(fee.paidAmount)}</td>
                      <td className="px-5 py-4 text-muted-foreground">{formatCurrency(fee.pendingAmount)}</td>
                      <td className="px-5 py-4 text-muted-foreground">{fee.paymentMode}</td>
                      <td className="px-5 py-4 text-muted-foreground">{fee.paymentDate}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => receipt && printReceipt(receipt)}
                            className="btn-outline rounded-xl px-3 py-2 text-xs"
                          >
                            <Printer size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              receipt
                                ? toast.success(`Receipt ${receipt.receiptNumber} ready to print.`)
                                : toast.error('Receipt not found.')
                            }
                            className="btn-outline rounded-xl px-3 py-2 text-xs"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-[28px] border border-border bg-white shadow-card">
            <div className="border-b border-border px-6 py-5">
              <p className="text-xs font-700 uppercase tracking-[0.22em] text-primary">Add Fee Payment</p>
              <h2 className="mt-1 text-xl font-700 text-foreground">Record student payment</h2>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-4 p-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-600 text-foreground">Select Student</label>
                <select
                  required
                  value={form.studentId}
                  onChange={(event) => setForm((current) => ({ ...current, studentId: event.target.value, enrollmentId: '' }))}
                  className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Choose student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.studentId}>
                      {student.studentName} · {student.admissionId}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-600 text-foreground">Select Course / Enrollment</label>
                <select
                  required
                  value={form.enrollmentId}
                  onChange={(event) => setForm((current) => ({ ...current, enrollmentId: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Choose enrollment</option>
                  {enrollments.map((enrollment) => (
                    <option key={enrollment.id} value={enrollment.enrollmentId}>
                      {enrollment.courseName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-600 text-foreground">Pending Amount</label>
                <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
                  {selectedStudent ? formatCurrency(selectedStudent.pendingFees) : 'Select student'}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-600 text-foreground">Amount Paid</label>
                <input
                  required
                  min="1"
                  type="number"
                  value={form.amountPaid}
                  onChange={(event) => setForm((current) => ({ ...current, amountPaid: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-600 text-foreground">Payment Mode</label>
                <select
                  required
                  value={form.paymentMode}
                  onChange={(event) => setForm((current) => ({ ...current, paymentMode: event.target.value as AcademyPaymentMode }))}
                  className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank">Bank</option>
                  <option value="card">Card</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-600 text-foreground">Payment Date</label>
                <input
                  required
                  type="date"
                  value={form.paymentDate}
                  onChange={(event) => setForm((current) => ({ ...current, paymentDate: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-600 text-foreground">Notes</label>
                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  className="w-full resize-none rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="md:col-span-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeModal} className="btn-outline rounded-xl px-5 py-3 text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary rounded-xl px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Payment & Print Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
