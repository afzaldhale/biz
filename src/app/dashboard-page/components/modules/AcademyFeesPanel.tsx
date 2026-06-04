'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { handleAppError } from '@/utils/appErrorHandler';
import { Eye, Plus, Printer, Search } from 'lucide-react';
import { AcademyFee, AcademyPaymentMode, AcademyReceipt, AcademyStudent, AuthUser } from '@/types';
import { getAcademyStudents } from '@/services/academyStudentService';
import { getStudentCourseOptions, StudentCourseOption } from '@/services/academyEnrollmentService';
import { getAcademyFees, recordAcademyFeePayment } from '@/services/academyFeeService';
import { getAcademyReceipts, getReceiptById } from '@/services/academyReceiptService';
import { useBusiness } from '@/context/BusinessContext';
import RetryState from '@/components/ui/RetryState';
import { useSlowLoading } from '@/hooks/useSlowLoading';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

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

export default function AcademyFeesPanel({ user, onNavigate }: AcademyFeesPanelProps) {
  const { business } = useBusiness();
  const { isOffline } = useNetworkStatus();
  const [students, setStudents] = useState<AcademyStudent[]>([]);
  const [enrollmentOptions, setEnrollmentOptions] = useState<StudentCourseOption[]>([]);
  const [fees, setFees] = useState<AcademyFee[]>([]);
  const [receiptsMap, setReceiptsMap] = useState<Map<string, AcademyReceipt>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AcademyFee['status']>('all');
  const [modeFilter, setModeFilter] = useState<'all' | AcademyPaymentMode>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<FeePaymentForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const debouncedSearch = useDebouncedValue(search, 250);
  const { showSlowMessage, showRetry } = useSlowLoading(loading);

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.allSettled([
      getAcademyStudents(user.id),
      getAcademyFees(user.id),
      getAcademyReceipts(user.id),
    ])
      .then(([studentResult, feeResult, receiptResult]) => {
        if (!active) return;

        if (studentResult.status === 'fulfilled') {
          setStudents(studentResult.value);
        } else {
          console.error('[academy-fees] unable to load students', studentResult.reason);
          setStudents([]);
        }

        if (feeResult.status === 'fulfilled') {
          setFees(feeResult.value);
        } else {
          console.error('[academy-fees] unable to load fees', feeResult.reason);
          setFees([]);
        }

        if (receiptResult.status === 'fulfilled') {
          setReceiptsMap(
            new Map(receiptResult.value.map((receipt) => [receipt.receiptId, receipt]))
          );
        } else {
          console.error('[academy-fees] unable to load receipts', receiptResult.reason);
          setReceiptsMap(new Map());
        }

        if (
          studentResult.status === 'rejected' &&
          feeResult.status === 'rejected' &&
          receiptResult.status === 'rejected'
        ) {
          toast.error('Unable to load fee records right now.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retryKey, user.id]);

  useEffect(() => {
    if (!form.studentId) {
      setEnrollmentOptions([]);
      setEnrollmentError(null);
      setLoadingEnrollments(false);
      setForm((current) => ({ ...current, enrollmentId: '' }));
      return;
    }

    const student = students.find((item) => item.studentId === form.studentId);
    if (!student) {
      setEnrollmentOptions([]);
      setEnrollmentError('Unable to find this student record.');
      return;
    }

    setLoadingEnrollments(true);
    setEnrollmentError(null);
    setEnrollmentOptions([]);

    getStudentCourseOptions(user.id, student)
      .then((options) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[academy-fees] selected student', student);
          console.log('[academy-fees] loaded course options', options);
        }

        const activeOptions = options.filter((item) => item.status === 'active');
        setEnrollmentOptions(activeOptions);
        setForm((current) => ({
          ...current,
          enrollmentId: activeOptions.length === 1 ? activeOptions[0].enrollmentId : '',
          amountPaid: '',
        }));

        if (activeOptions.length === 0) {
          setEnrollmentError(
            'This student is not enrolled in any course. Please enroll the student in a course first.'
          );
        }
      })
      .catch((error) => {
        console.error('[academy-fees] unable to load enrollments', error);
        setEnrollmentOptions([]);
        setEnrollmentError('Unable to load enrollments for this student.');
        toast.error('Unable to load enrollments for this student.');
      })
      .finally(() => {
        setLoadingEnrollments(false);
      });
  }, [form.studentId, students, user.id]);

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
    () =>
      enrollmentOptions.find((enrollment) => enrollment.enrollmentId === form.enrollmentId) ?? null,
    [enrollmentOptions, form.enrollmentId]
  );
  const selectedEnrollmentPaid = useMemo(() => {
    if (!selectedStudent || !selectedEnrollment) return 0;

    return fees
      .filter((fee) => {
        if (fee.studentId !== selectedStudent.studentId) return false;
        if (selectedEnrollment.isVirtual) {
          return fee.courseId === selectedEnrollment.courseId;
        }
        return (
          fee.enrollmentId === selectedEnrollment.enrollmentId ||
          fee.courseId === selectedEnrollment.courseId
        );
      })
      .reduce((sum, fee) => sum + Number(fee.paidAmount || 0), 0);
  }, [fees, selectedEnrollment, selectedStudent]);

  const selectedEnrollmentPending = useMemo(() => {
    if (!selectedEnrollment) return 0;
    return Math.max(0, Number(selectedEnrollment.courseFees || 0) - selectedEnrollmentPaid);
  }, [selectedEnrollment, selectedEnrollmentPaid]);

  const filteredFees = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
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
  }, [debouncedSearch, fees, modeFilter, statusFilter]);

  const openModal = useCallback(() => {
    setForm(emptyForm);
    setEnrollmentOptions([]);
    setLoadingEnrollments(false);
    setEnrollmentError(null);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setForm(emptyForm);
    setEnrollmentOptions([]);
    setLoadingEnrollments(false);
    setEnrollmentError(null);
    setIsModalOpen(false);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!selectedStudent) {
        toast.error('Student required.');
        return;
      }
      if (isOffline) {
        toast.error('You are offline. Reconnect to save payments.');
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
      if (amount > selectedEnrollmentPending) {
        toast.error('Amount cannot exceed pending amount.');
        return;
      }
      if (selectedEnrollmentPending <= 0) {
        toast.error('This course fee is fully paid.');
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
          courseFees: selectedEnrollment.courseFees,
          courseName: selectedEnrollment.courseName,
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
        handleAppError(caught, 'Unable to record payment.');
      } finally {
        setSaving(false);
      }
    },
    [
      business,
      closeModal,
      form.amountPaid,
      form.notes,
      form.paymentDate,
      form.paymentMode,
      isOffline,
      selectedEnrollment,
      selectedEnrollmentPending,
      selectedStudent,
      user.id,
    ]
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
        <button
          type="button"
          onClick={openModal}
          className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm"
        >
          <Plus size={16} />
          Add Fee Payment
        </button>
      </div>

      <div className="glass-card rounded-2xl border border-border overflow-hidden">
        <div className="grid gap-4 border-b border-border p-5 lg:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by student, course, status, or payment mode"
              className="w-full rounded-xl border border-border bg-input py-3 pl-11 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as 'all' | AcademyFee['status'])
            }
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
          showRetry ? (
            <div className="p-5">
              <RetryState onRetry={() => setRetryKey((current) => current + 1)} />
            </div>
          ) : (
            <div className="p-16 text-center text-muted-foreground">
              {showSlowMessage
                ? 'Network is slow. Trying to load your workspace.'
                : 'Loading fee records...'}
            </div>
          )
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
                      <td className="px-5 py-4 text-muted-foreground">
                        {receipt?.receiptNumber ?? '—'}
                      </td>
                      <td className="px-5 py-4 font-600 text-foreground">{fee.studentName}</td>
                      <td className="px-5 py-4 text-muted-foreground">{fee.courseName}</td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {formatCurrency(fee.paidAmount)}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {formatCurrency(fee.pendingAmount)}
                      </td>
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
              <p className="text-xs font-700 uppercase tracking-[0.22em] text-primary">
                Add Fee Payment
              </p>
              <h2 className="mt-1 text-xl font-700 text-foreground">Record student payment</h2>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-4 p-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-600 text-foreground">
                  Select Student
                </label>
                <select
                  required
                  value={form.studentId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      studentId: event.target.value,
                      enrollmentId: '',
                      amountPaid: '',
                    }))
                  }
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
                <label className="mb-1.5 block text-sm font-600 text-foreground">
                  Select Course / Enrollment
                </label>
                <select
                  required
                  value={form.enrollmentId}
                  onChange={(event) => {
                    const nextEnrollmentId = event.target.value;
                    setForm((current) => ({
                      ...current,
                      enrollmentId: nextEnrollmentId,
                      amountPaid: '',
                    }));
                    if (process.env.NODE_ENV === 'development') {
                      const chosen =
                        enrollmentOptions.find(
                          (option) => option.enrollmentId === nextEnrollmentId
                        ) ?? null;
                      console.log('[academy-fees] selected enrollment', chosen);
                    }
                  }}
                  disabled={!form.studentId || loadingEnrollments}
                  className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">Choose enrollment</option>
                  {enrollmentOptions.map((enrollment) => (
                    <option key={enrollment.enrollmentId} value={enrollment.enrollmentId}>
                      {enrollment.courseName} — {formatCurrency(enrollment.courseFees)} —{' '}
                      {enrollment.status}
                    </option>
                  ))}
                </select>
                {loadingEnrollments && (
                  <p className="mt-2 text-xs text-muted-foreground">Loading enrolled courses...</p>
                )}
                {!loadingEnrollments && enrollmentError && (
                  <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    {enrollmentError}
                  </div>
                )}
                {!loadingEnrollments &&
                  !enrollmentError &&
                  form.studentId &&
                  enrollmentOptions.length === 0 && (
                    <div className="mt-2 rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                      No course enrollment found for this student. Enroll the student in a course
                      first.
                    </div>
                  )}
                {!loadingEnrollments &&
                  !enrollmentError &&
                  form.studentId &&
                  enrollmentOptions.length === 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        closeModal();
                        onNavigate('nav-students');
                      }}
                      className="mt-2 text-xs font-600 text-primary"
                    >
                      Go to Students or Courses to enroll this student
                    </button>
                  )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-600 text-foreground">
                  Pending Amount
                </label>
                <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
                  {selectedEnrollment
                    ? formatCurrency(selectedEnrollmentPending)
                    : 'Select enrollment'}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-600 text-foreground">Amount Paid</label>
                <input
                  required
                  min="1"
                  max={selectedEnrollmentPending || undefined}
                  type="number"
                  disabled={!selectedEnrollment || selectedEnrollmentPending <= 0}
                  value={form.amountPaid}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, amountPaid: event.target.value }))
                  }
                  className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-600 text-foreground">Course Fee</label>
                <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
                  {selectedEnrollment
                    ? formatCurrency(selectedEnrollment.courseFees)
                    : 'Select enrollment'}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-600 text-foreground">
                  Already Paid
                </label>
                <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
                  {selectedEnrollment
                    ? formatCurrency(selectedEnrollmentPaid)
                    : 'Select enrollment'}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-600 text-foreground">
                  Payment Mode
                </label>
                <select
                  required
                  value={form.paymentMode}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      paymentMode: event.target.value as AcademyPaymentMode,
                    }))
                  }
                  className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank">Bank</option>
                  <option value="card">Card</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-600 text-foreground">
                  Payment Date
                </label>
                <input
                  required
                  type="date"
                  value={form.paymentDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, paymentDate: event.target.value }))
                  }
                  className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-600 text-foreground">Notes</label>
                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, notes: event.target.value }))
                  }
                  className="w-full resize-none rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              {selectedEnrollment && selectedEnrollmentPending <= 0 && (
                <div className="md:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  This course fee is fully paid.
                </div>
              )}
              <div className="md:col-span-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-outline rounded-xl px-5 py-3 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    saving || isOffline || !selectedEnrollment || selectedEnrollmentPending <= 0
                  }
                  className="btn-primary rounded-xl px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Saving...' : isOffline ? 'Offline' : 'Save Payment & Print Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
