'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Check,
  Circle,
  Clock3,
  History,
  IndianRupee,
  Pencil,
  Plus,
  Search,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react';
import { AcademyAttendance, AcademyCourse, AcademyPaymentMode, AcademyReceipt, AcademyStudent, AuthUser } from '@/types';
import { useBusiness } from '@/context/BusinessContext';
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog';
import RetryState from '@/components/ui/RetryState';
import {
  AcademyStudentInput,
  createAcademyStudent,
  deleteAcademyStudent,
  getAcademyStudents,
  updateAcademyStudent,
} from '@/services/academyStudentService';
import { getAcademyCourses } from '@/services/academyCourseService';
import { addStudentPayment } from '@/services/academyFeeService';
import { getReceiptById } from '@/services/academyReceiptService';
import { getStudentHistory } from '@/services/academyDashboardService';
import { getTodayAttendanceMap, markTodayAttendance } from '@/services/academyAttendanceService';
import { useSlowLoading } from '@/hooks/useSlowLoading';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface AcademyStudentsPanelProps {
  user: AuthUser;
  onNavigate: (navId: string) => void;
}

interface StudentFormState extends AcademyStudentInput {}

interface PaymentFormState {
  amountPaid: string;
  paymentMode: AcademyPaymentMode;
  paymentDate: string;
  notes: string;
}

type AttendanceFilter = 'all' | 'present' | 'absent' | 'not_marked';
type HistoryTab = 'overview' | 'fees' | 'receipts' | 'attendance' | 'courses';

const emptyForm: StudentFormState = {
  studentName: '',
  parentName: '',
  phone: '',
  email: '',
  address: '',
  dateOfBirth: '',
  admissionDate: new Date().toISOString().slice(0, 10),
  notes: '',
  status: 'active',
  selectedCourses: [],
};

const emptyPaymentForm: PaymentFormState = {
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

function attendanceBadge(status?: AcademyAttendance['status']) {
  if (status === 'present') return 'badge-success';
  if (status === 'absent') return 'badge-danger';
  if (status === 'late') return 'badge-warning';
  return 'badge-neutral';
}

function attendanceLabel(status?: AcademyAttendance['status']) {
  if (status === 'present') return 'Present';
  if (status === 'absent') return 'Absent';
  if (status === 'late') return 'Late';
  return 'Not marked';
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
        <title>Receipt ${receipt.receiptNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; margin: 0; }
          .receipt { max-width: 820px; margin: 24px auto; padding: 32px; }
          .card { border: 1px solid #dbe3f0; border-radius: 18px; padding: 28px; }
          .header { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
          .brand { font-size: 28px; font-weight: 700; color: #4338ca; }
          .muted { color: #64748b; font-size: 13px; }
          .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-top: 18px; }
          .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 6px; }
          .value { font-size: 14px; font-weight: 600; color: #111827; }
          .summary { margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
          .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="card">
            <div class="header">
              <div>
                <div class="brand">${receipt.businessName}</div>
                <div class="muted">${receipt.businessAddress || ''}</div>
                <div class="muted">${receipt.businessPhone || ''}</div>
              </div>
              <div>
                <div class="label">Receipt Number</div>
                <div class="value">${receipt.receiptNumber}</div>
                <div class="label" style="margin-top: 14px;">Payment Date</div>
                <div class="value">${receipt.paymentDate}</div>
              </div>
            </div>
            <div class="grid">
              <div><div class="label">Student Name</div><div class="value">${receipt.studentName}</div></div>
              <div><div class="label">Course</div><div class="value">${receipt.courseName}</div></div>
              <div><div class="label">Payment Mode</div><div class="value">${receipt.paymentMode}</div></div>
              <div><div class="label">Receipt ID</div><div class="value">${receipt.receiptId}</div></div>
            </div>
            <div class="summary">
              <div class="summary-row"><span>Amount Paid</span><strong>${formatCurrency(receipt.amountPaid)}</strong></div>
              <div class="summary-row"><span>Pending Amount</span><strong>${formatCurrency(receipt.pendingAmount)}</strong></div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `);

  receiptWindow.document.close();
  receiptWindow.focus();
  receiptWindow.print();
}

function StudentFormModal({
  courses,
  editingStudent,
  form,
  isOffline,
  saving,
  onClose,
  onSubmit,
  onToggleCourse,
  onFormChange,
}: {
  courses: AcademyCourse[];
  editingStudent: AcademyStudent | null;
  form: StudentFormState;
  isOffline: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onToggleCourse: (course: AcademyCourse) => void;
  onFormChange: <K extends keyof StudentFormState>(key: K, value: StudentFormState[K]) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-[28px] border border-border bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <p className="text-xs font-700 uppercase tracking-[0.22em] text-primary">
              {editingStudent ? 'Edit Student' : 'New Admission'}
            </p>
            <h2 className="mt-1 text-xl font-700 text-foreground">
              {editingStudent ? 'Update student record' : 'Add student'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-muted p-2 text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4 p-6 md:grid-cols-2">
          {[
            ['Student Name', 'studentName'],
            ['Parent Name', 'parentName'],
            ['Phone', 'phone'],
            ['Email', 'email'],
          ].map(([label, key]) => (
            <div key={key}>
              <label className="mb-1.5 block text-sm font-600 text-foreground">{label}</label>
              <input
                required={key !== 'email'}
                type={key === 'email' ? 'email' : 'text'}
                value={form[key as keyof StudentFormState] as string}
                onChange={(event) => onFormChange(key as keyof StudentFormState, event.target.value as never)}
                className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-600 text-foreground">Address</label>
            <input
              value={form.address}
              onChange={(event) => onFormChange('address', event.target.value)}
              className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-600 text-foreground">Admission Date</label>
            <input
              required
              type="date"
              value={form.admissionDate}
              onChange={(event) => onFormChange('admissionDate', event.target.value)}
              className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-600 text-foreground">Date of Birth</label>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(event) => onFormChange('dateOfBirth', event.target.value)}
              className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-600 text-foreground">Enrolled Courses</label>
            <div className="grid gap-3 rounded-2xl border border-border bg-muted/30 p-4 sm:grid-cols-2">
              {courses.map((course) => {
                const selected = form.selectedCourses.some((item) => item.courseId === course.courseId);
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => onToggleCourse(course)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      selected ? 'border-primary bg-indigo-50' : 'border-border bg-white'
                    }`}
                  >
                    <p className="font-600 text-foreground">{course.courseName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {course.duration} · {formatCurrency(course.fees)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-600 text-foreground">Notes</label>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) => onFormChange('notes', event.target.value)}
              className="w-full resize-none rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-600 text-foreground">Status</label>
            <select
              value={form.status}
              onChange={(event) => onFormChange('status', event.target.value as AcademyStudent['status'])}
              className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="md:col-span-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn-outline rounded-xl px-5 py-3 text-sm">
              Cancel
            </button>
                <button type="submit" disabled={saving || isOffline} className="btn-primary rounded-xl px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? 'Saving...' : isOffline ? 'Offline' : editingStudent ? 'Update Student' : 'Add Student'}
                </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PaymentModal({
  student,
  form,
  isOffline,
  saving,
  onClose,
  onSubmit,
  onChange,
}: {
  student: AcademyStudent;
  form: PaymentFormState;
  isOffline: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onChange: <K extends keyof PaymentFormState>(key: K, value: PaymentFormState[K]) => void;
}) {
  const pendingFees = Math.max(0, student.pendingFees);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-[28px] border border-border bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <p className="text-xs font-700 uppercase tracking-[0.22em] text-primary">Add Payment</p>
            <h2 className="mt-1 text-xl font-700 text-foreground">{student.studentName}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-muted p-2 text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4 p-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Fees</p>
            <p className="mt-2 text-lg font-700 text-foreground">{formatCurrency(student.totalFees)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Paid Fees</p>
            <p className="mt-2 text-lg font-700 text-foreground">{formatCurrency(student.paidFees)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending Fees</p>
            <p className="mt-2 text-lg font-700 text-foreground">{formatCurrency(student.pendingFees)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Admission ID</p>
            <p className="mt-2 text-lg font-700 text-foreground">{student.admissionId}</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-600 text-foreground">Amount</label>
            <input
              required
              min="1"
              max={pendingFees}
              type="number"
              disabled={pendingFees === 0}
              value={form.amountPaid}
              onChange={(event) => onChange('amountPaid', event.target.value)}
              className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-600 text-foreground">Payment Mode</label>
            <select
              value={form.paymentMode}
              onChange={(event) => onChange('paymentMode', event.target.value as AcademyPaymentMode)}
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
              onChange={(event) => onChange('paymentDate', event.target.value)}
              className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-600 text-foreground">Notes</label>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) => onChange('notes', event.target.value)}
              className="w-full resize-none rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {pendingFees === 0 && (
            <div className="md:col-span-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              No pending balance.
            </div>
          )}

          <div className="md:col-span-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn-outline rounded-xl px-5 py-3 text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || isOffline || pendingFees === 0}
              className="btn-primary rounded-xl px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : isOffline ? 'Offline' : 'Save Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HistoryDrawer({
  student,
  historyData,
  historyLoading,
  historyTab,
  onClose,
  onTabChange,
}: {
  student: AcademyStudent;
  historyData: Awaited<ReturnType<typeof getStudentHistory>> | null;
  historyLoading: boolean;
  historyTab: HistoryTab;
  onClose: () => void;
  onTabChange: (tab: HistoryTab) => void;
}) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full max-w-4xl overflow-y-auto border-l border-border bg-white shadow-card">
        <div className="sticky top-0 z-10 border-b border-border bg-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-700 uppercase tracking-[0.22em] text-primary">Student History</p>
              <h2 className="mt-1 text-xl font-700 text-foreground">{student.studentName}</h2>
            </div>
            <button type="button" onClick={onClose} className="rounded-full bg-muted p-2 text-muted-foreground">
              <X size={18} />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {([
              ['overview', 'Overview'],
              ['fees', 'Fee History'],
              ['receipts', 'Receipt History'],
              ['attendance', 'Attendance History'],
              ['courses', 'Courses'],
            ] as Array<[HistoryTab, string]>).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                className={`rounded-full px-4 py-2 text-sm font-600 ${
                  historyTab === tab ? 'bg-indigo-50 text-primary' : 'bg-muted/60 text-muted-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {historyLoading || !historyData ? (
            <div className="rounded-2xl border border-dashed border-border px-5 py-16 text-center text-sm text-muted-foreground">
              Loading student history...
            </div>
          ) : (
            <>
              {historyTab === 'overview' && (
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="rounded-2xl border border-border p-5">
                    <p className="text-sm font-700 text-foreground">Student Details</p>
                    <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                      <p><span className="font-600 text-foreground">Admission ID:</span> {student.admissionId}</p>
                      <p><span className="font-600 text-foreground">Parent:</span> {student.parentName}</p>
                      <p><span className="font-600 text-foreground">Phone:</span> {student.phone}</p>
                      <p><span className="font-600 text-foreground">Email:</span> {student.email || '—'}</p>
                      <p><span className="font-600 text-foreground">Address:</span> {student.address || '—'}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border p-5">
                    <p className="text-sm font-700 text-foreground">Operations Summary</p>
                    <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                      <p><span className="font-600 text-foreground">Total Fees:</span> {formatCurrency(student.totalFees)}</p>
                      <p><span className="font-600 text-foreground">Paid Fees:</span> {formatCurrency(student.paidFees)}</p>
                      <p><span className="font-600 text-foreground">Pending Fees:</span> {formatCurrency(student.pendingFees)}</p>
                      <p><span className="font-600 text-foreground">Attendance Records:</span> {historyData.attendance.length}</p>
                      <p><span className="font-600 text-foreground">Enrolled Courses:</span> {historyData.enrollments.length}</p>
                    </div>
                  </div>
                </div>
              )}

              {historyTab === 'fees' && (
                <div className="space-y-3">
                  {historyData.fees.length ? historyData.fees.map((fee) => (
                    <div key={fee.id} className="rounded-2xl border border-border p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-600 text-foreground">{fee.courseName || 'Fee Payment'}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{fee.paymentDate} · {fee.paymentMode}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-700 text-foreground">{formatCurrency(fee.paidAmount)}</p>
                          <p className="mt-1 text-xs text-muted-foreground">Pending {formatCurrency(fee.pendingAmount)}</p>
                        </div>
                      </div>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">No fee history found.</p>}
                </div>
              )}

              {historyTab === 'receipts' && (
                <div className="space-y-3">
                  {historyData.receipts.length ? historyData.receipts.map((receipt) => (
                    <div key={receipt.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4">
                      <div>
                        <p className="font-600 text-foreground">{receipt.receiptNumber}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {receipt.paymentDate} · {formatCurrency(receipt.amountPaid)}
                        </p>
                      </div>
                      <button type="button" onClick={() => printReceipt(receipt)} className="btn-outline rounded-xl px-4 py-2 text-xs">
                        Print
                      </button>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">No receipts found.</p>}
                </div>
              )}

              {historyTab === 'attendance' && (
                <div className="space-y-3">
                  {historyData.attendance.length ? historyData.attendance.map((record) => (
                    <div key={record.id} className="rounded-2xl border border-border p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-600 text-foreground">{record.attendanceDate}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{record.courseName || 'General attendance'}</p>
                        </div>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-600 ${attendanceBadge(record.status)}`}>
                          {attendanceLabel(record.status)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">{record.remarks || 'No remarks'}</p>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">No attendance history found.</p>}
                </div>
              )}

              {historyTab === 'courses' && (
                <div className="space-y-3">
                  {historyData.enrollments.length ? historyData.enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="rounded-2xl border border-border p-4">
                      <p className="font-600 text-foreground">{enrollment.courseName}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Enrolled {enrollment.enrollmentDate} · {formatCurrency(enrollment.courseFees)} · {enrollment.status}
                      </p>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">No enrolled courses found.</p>}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AcademyStudentsPanel({ user, onNavigate }: AcademyStudentsPanelProps) {
  const { business } = useBusiness();
  const { isOffline } = useNetworkStatus();
  const [students, setStudents] = useState<AcademyStudent[]>([]);
  const [courses, setCourses] = useState<AcademyCourse[]>([]);
  const [todayAttendanceMap, setTodayAttendanceMap] = useState<Map<string, AcademyAttendance>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AcademyStudent['status']>('all');
  const [attendanceFilter, setAttendanceFilter] = useState<AttendanceFilter>('all');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<AcademyStudent | null>(null);
  const [form, setForm] = useState<StudentFormState>(emptyForm);
  const [savingStudent, setSavingStudent] = useState(false);

  const [paymentStudent, setPaymentStudent] = useState<AcademyStudent | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(emptyPaymentForm);
  const [savingPayment, setSavingPayment] = useState(false);

  const [historyStudent, setHistoryStudent] = useState<AcademyStudent | null>(null);
  const [historyData, setHistoryData] = useState<Awaited<ReturnType<typeof getStudentHistory>> | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyTab, setHistoryTab] = useState<HistoryTab>('overview');

  const [deleteStudentTarget, setDeleteStudentTarget] = useState<AcademyStudent | null>(null);
  const [deletingStudent, setDeletingStudent] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const debouncedSearch = useDebouncedValue(search, 250);
  const { showSlowMessage, showRetry } = useSlowLoading(loading);

  const loadStudentsWorkspace = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    const [studentsResult, coursesResult, attendanceResult] = await Promise.allSettled([
      getAcademyStudents(user.id),
      getAcademyCourses(user.id),
      getTodayAttendanceMap(user.id),
    ]);

    if (studentsResult.status === 'fulfilled') {
      setStudents(studentsResult.value);
    } else {
      console.error('[academy-students] unable to load students', studentsResult.reason);
      setStudents([]);
      setLoadError('Unable to load students. Please refresh or try again.');
    }

    if (coursesResult.status === 'fulfilled') {
      setCourses(coursesResult.value.filter((course) => course.status === 'active'));
    } else {
      console.error('[academy-students] unable to load courses', coursesResult.reason);
      setCourses([]);
    }

    if (attendanceResult.status === 'fulfilled') {
      setTodayAttendanceMap(attendanceResult.value);
    } else {
      console.error('[academy-students] unable to load today attendance', attendanceResult.reason);
      setTodayAttendanceMap(new Map());
    }

    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    void loadStudentsWorkspace();
  }, [loadStudentsWorkspace, retryKey]);

  useEffect(() => {
    setPage(1);
  }, [attendanceFilter, rowsPerPage, search, statusFilter]);

  const filteredStudents = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();

    return students.filter((student) => {
      const attendance = todayAttendanceMap.get(student.studentId);
      const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
      const matchesAttendance =
        attendanceFilter === 'all' ||
        (attendanceFilter === 'present' && attendance?.status === 'present') ||
        (attendanceFilter === 'absent' && attendance?.status === 'absent') ||
        (attendanceFilter === 'not_marked' && !attendance);
      const matchesQuery =
        query.length === 0 ||
        [
          student.studentName,
          student.parentName,
          student.phone,
          student.email,
          student.admissionId,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesAttendance && matchesQuery;
    });
  }, [attendanceFilter, debouncedSearch, statusFilter, students, todayAttendanceMap]);

  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredStudents.slice(start, start + rowsPerPage);
  }, [filteredStudents, page, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / rowsPerPage));

  const stats = useMemo(() => ({
    totalStudents: students.length,
    presentToday: Array.from(todayAttendanceMap.values()).filter((record) => record.status === 'present').length,
    absentToday: Array.from(todayAttendanceMap.values()).filter((record) => record.status === 'absent').length,
    pendingFees: students.reduce((sum, student) => sum + Number(student.pendingFees || 0), 0),
  }), [students, todayAttendanceMap]);

  const updateFormField = useCallback(<K extends keyof StudentFormState>(key: K, value: StudentFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  }, []);

  const updatePaymentField = useCallback(<K extends keyof PaymentFormState>(key: K, value: PaymentFormState[K]) => {
    setPaymentForm((current) => ({ ...current, [key]: value }));
  }, []);

  const toggleCourse = useCallback((course: AcademyCourse) => {
    setForm((current) => {
      const exists = current.selectedCourses.some((item) => item.courseId === course.courseId);
      return {
        ...current,
        selectedCourses: exists
          ? current.selectedCourses.filter((item) => item.courseId !== course.courseId)
          : [...current.selectedCourses, { courseId: course.courseId, courseName: course.courseName, fees: course.fees }],
      };
    });
  }, []);

  const openCreateModal = useCallback(() => {
    setEditingStudent(null);
    setForm(emptyForm);
    setIsFormModalOpen(true);
  }, []);

  const openEditModal = useCallback((student: AcademyStudent) => {
    setEditingStudent(student);
    setForm({
      studentName: student.studentName,
      parentName: student.parentName,
      phone: student.phone,
      email: student.email,
      address: student.address,
      dateOfBirth: student.dateOfBirth,
      admissionDate: student.admissionDate,
      notes: student.notes,
      status: student.status,
      selectedCourses: courses
        .filter((course) => student.enrolledCourseIds.includes(course.courseId))
        .map((course) => ({ courseId: course.courseId, courseName: course.courseName, fees: course.fees })),
    });
    setIsFormModalOpen(true);
  }, [courses]);

  const closeFormModal = useCallback(() => {
    setEditingStudent(null);
    setForm(emptyForm);
    setIsFormModalOpen(false);
  }, []);

  const handleStudentSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isOffline) {
      toast.error('You are offline. Reconnect to save student changes.');
      return;
    }
    setSavingStudent(true);

    try {
      if (editingStudent) {
        await updateAcademyStudent(user.id, editingStudent.id, {
          ...form,
          paidFees: editingStudent.paidFees,
        });
        toast.success('Student updated successfully.');
      } else {
        await createAcademyStudent(user.id, form);
        toast.success('Student added successfully.');
      }

      await loadStudentsWorkspace();
      closeFormModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save student.');
    } finally {
      setSavingStudent(false);
    }
  }, [closeFormModal, editingStudent, form, isOffline, loadStudentsWorkspace, user.id]);

  const handleAttendanceAction = useCallback(async (student: AcademyStudent, status: 'present' | 'absent') => {
    if (isOffline) {
      toast.error('You are offline. Reconnect to update attendance.');
      return;
    }
    const previous = todayAttendanceMap.get(student.studentId);
    const optimistic: AcademyAttendance = {
      id: previous?.id ?? `${student.studentId}_${new Date().toISOString().slice(0, 10)}`,
      attendanceId: previous?.attendanceId ?? `${student.studentId}_${new Date().toISOString().slice(0, 10)}`,
      studentId: student.studentId,
      studentName: student.studentName,
      courseId: previous?.courseId ?? student.enrolledCourseIds[0] ?? '',
      courseName: previous?.courseName ?? '',
      attendanceDate: new Date().toISOString().slice(0, 10),
      status,
      remarks: previous?.remarks ?? '',
      markedBy: user.ownerName,
      createdAt: previous?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTodayAttendanceMap((current) => {
      const next = new Map(current);
      next.set(student.studentId, optimistic);
      return next;
    });

    try {
      const saved = await markTodayAttendance(user.id, {
        id: student.id,
        studentId: student.studentId,
        studentName: student.studentName,
        enrolledCourseIds: student.enrolledCourseIds,
      }, status, { markedBy: user.ownerName });

      if (saved) {
        setTodayAttendanceMap((current) => {
          const next = new Map(current);
          next.set(student.studentId, saved);
          return next;
        });
      }

      toast.success(status === 'present' ? 'Attendance marked present' : 'Attendance marked absent');
    } catch (error) {
      console.error('[academy-students] unable to mark attendance', error);
      setTodayAttendanceMap((current) => {
        const next = new Map(current);
        if (previous) {
          next.set(student.studentId, previous);
        } else {
          next.delete(student.studentId);
        }
        return next;
      });
      toast.error('Unable to update attendance right now.');
    }
  }, [isOffline, todayAttendanceMap, user.id, user.ownerName]);

  const openPaymentModal = useCallback((student: AcademyStudent) => {
    setPaymentStudent(student);
    setPaymentForm(emptyPaymentForm);
  }, []);

  const closePaymentModal = useCallback(() => {
    setPaymentStudent(null);
    setPaymentForm(emptyPaymentForm);
  }, []);

  const handlePaymentSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!paymentStudent) return;
    if (isOffline) {
      toast.error('You are offline. Reconnect to save payments.');
      return;
    }
    if (!business) {
      toast.error('Business profile not loaded.');
      return;
    }

    const amount = Number(paymentForm.amountPaid || 0);
    if (amount <= 0) {
      toast.error('Amount is required.');
      return;
    }
    if (amount > paymentStudent.pendingFees) {
      toast.error('Amount cannot exceed pending amount.');
      return;
    }

    setSavingPayment(true);
    try {
      const paymentResult = await addStudentPayment(user.id, paymentStudent, {
        amountPaid: amount,
        paymentMode: paymentForm.paymentMode,
        paymentDate: paymentForm.paymentDate,
        notes: paymentForm.notes,
        businessProfile: {
          businessName: business.businessName,
          address: business.address ?? '',
          phone: business.phone,
        },
      });

      await loadStudentsWorkspace();
      closePaymentModal();
      toast.success('Payment saved and receipt generated.');

      const receipt = await getReceiptById(user.id, paymentResult.receiptId);
      if (receipt && window.confirm(`Payment saved. Print receipt ${receipt.receiptNumber} now?`)) {
        printReceipt(receipt);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save payment.');
    } finally {
      setSavingPayment(false);
    }
  }, [business, closePaymentModal, isOffline, loadStudentsWorkspace, paymentForm.amountPaid, paymentForm.notes, paymentForm.paymentDate, paymentForm.paymentMode, paymentStudent, user.id]);

  const openHistoryDrawer = useCallback(async (student: AcademyStudent) => {
    setHistoryStudent(student);
    setHistoryData(null);
    setHistoryTab('overview');
    setHistoryLoading(true);

    try {
      const result = await getStudentHistory(user.id, student.studentId);
      setHistoryData(result);
    } catch (error) {
      console.error('[academy-students] unable to load student history', error);
      toast.error('Unable to load student history right now.');
      setHistoryStudent(null);
    } finally {
      setHistoryLoading(false);
    }
  }, [user.id]);

  const handleDeleteStudent = useCallback(async () => {
    if (!deleteStudentTarget) return;
    if (isOffline) {
      toast.error('You are offline. Reconnect to update this student.');
      return;
    }
    setDeletingStudent(true);

    try {
      await deleteAcademyStudent(user.id, deleteStudentTarget.id);
      await loadStudentsWorkspace();
      toast.success('Student moved to inactive status.');
      setDeleteStudentTarget(null);
    } catch (error) {
      console.error('[academy-students] unable to delete student', error);
      toast.error('Unable to update student status right now.');
    } finally {
      setDeletingStudent(false);
    }
  }, [deleteStudentTarget, isOffline, loadStudentsWorkspace, user.id]);

  return (
    <div className="max-w-screen-2xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-700 uppercase tracking-[0.24em] text-primary">Academy Students</p>
          <h1 className="mt-1 text-2xl font-700 text-foreground">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage admissions, attendance, fee collection, and student records from one workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onNavigate('nav-fees')} className="btn-outline rounded-xl px-4 py-2.5 text-sm">
            Open Fees
          </button>
          <button type="button" onClick={openCreateModal} className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm">
            <Plus size={16} />
            Add Student
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Total Students</p>
          <p className="mt-2 text-2xl font-700 text-foreground">{stats.totalStudents}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Present Today</p>
          <p className="mt-2 text-2xl font-700 text-foreground">{stats.presentToday}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Absent Today</p>
          <p className="mt-2 text-2xl font-700 text-foreground">{stats.absentToday}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Pending Fees</p>
          <p className="mt-2 text-2xl font-700 text-foreground">{formatCurrency(stats.pendingFees)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-border bg-white shadow-sm">
        <div className="grid gap-4 border-b border-border p-5 lg:grid-cols-[1fr_180px_180px_150px]">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, phone, email, parent, or admission ID"
              className="w-full rounded-xl border border-border bg-input py-3 pl-11 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | AcademyStudent['status'])}
            className="rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={attendanceFilter}
            onChange={(event) => setAttendanceFilter(event.target.value as AttendanceFilter)}
            className="rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Attendance</option>
            <option value="present">Present Today</option>
            <option value="absent">Absent Today</option>
            <option value="not_marked">Not Marked</option>
          </select>
          <select
            value={rowsPerPage}
            onChange={(event) => setRowsPerPage(Number(event.target.value))}
            className="rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value={10}>10 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
          </select>
        </div>

        {loading ? (
          <div className="p-16 text-center text-muted-foreground">Loading students...</div>
        ) : loadError ? (
          <div className="p-5">
            <RetryState
              title="Unable to load students"
              description="Please refresh or try again."
              onRetry={() => setRetryKey((current) => current + 1)}
            />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-sm font-600 text-foreground">No students matched the current filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[1220px] w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  <tr>
                    <th className="px-5 py-4">Select</th>
                    <th className="px-5 py-4">Name</th>
                    <th className="px-5 py-4">Attendance</th>
                    <th className="px-5 py-4">Fees Paid</th>
                    <th className="px-5 py-4">Pending</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {paginatedStudents.map((student) => {
                    const todayAttendance = todayAttendanceMap.get(student.studentId);
                    const isSelected = selectedStudentId === student.studentId;
                    const presentActive = todayAttendance?.status === 'present';
                    const absentActive = todayAttendance?.status === 'absent';

                    return (
                      <tr key={student.id} className="transition hover:bg-slate-50/80">
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedStudentId(isSelected ? '' : student.studentId)}
                            className={`flex h-6 w-6 items-center justify-center rounded-full border transition ${
                              isSelected ? 'border-primary bg-primary text-white' : 'border-slate-300 bg-white text-transparent'
                            }`}
                          >
                            <Circle size={10} fill="currentColor" />
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-600 text-foreground">{student.studentName}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {student.admissionId} · {student.parentName || 'No parent'}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {student.phone || 'No phone'} · {student.email || 'No email'}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => void handleAttendanceAction(student, 'present')}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-600 transition ${
                                presentActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-border bg-white text-muted-foreground'
                              }`}
                            >
                              <Check size={13} />
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleAttendanceAction(student, 'absent')}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-600 transition ${
                                absentActive ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-border bg-white text-muted-foreground'
                              }`}
                            >
                              <X size={13} />
                              Absent
                            </button>
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-600 ${attendanceBadge(todayAttendance?.status)}`}>
                              {attendanceLabel(todayAttendance?.status)}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-700 text-foreground">
                            {formatCurrency(student.paidFees)} / {formatCurrency(student.totalFees)}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-700 text-foreground">{formatCurrency(student.pendingFees)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openPaymentModal(student)}
                              disabled={student.pendingFees === 0}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-600 text-foreground transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <WalletCards size={14} />
                              Pay
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(student)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-600 text-foreground transition hover:bg-slate-50"
                            >
                              <Pencil size={14} />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void openHistoryDrawer(student)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-600 text-foreground transition hover:bg-slate-50"
                            >
                              <History size={14} />
                              History
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteStudentTarget(student)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-600 text-rose-700 transition hover:bg-rose-100"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-border bg-white px-5 py-4">
              <p className="text-xs text-muted-foreground">
                Showing {(page - 1) * rowsPerPage + 1}-{Math.min(page * rowsPerPage, filteredStudents.length)} of {filteredStudents.length} students
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  className="btn-outline rounded-xl px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="rounded-lg bg-muted px-3 py-2 text-xs font-600 text-foreground">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page === totalPages}
                  className="btn-outline rounded-xl px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
        {loading && showRetry && (
          <div className="p-5">
            <RetryState onRetry={() => setRetryKey((current) => current + 1)} />
          </div>
        )}
        {loading && showSlowMessage && !showRetry && (
          <div className="border-t border-border bg-amber-50 px-5 py-3 text-sm text-amber-800">
            Network is slow. Trying to load your workspace.
          </div>
        )}
      </div>

      {isFormModalOpen && (
        <StudentFormModal
          courses={courses}
          editingStudent={editingStudent}
          form={form}
          isOffline={isOffline}
          saving={savingStudent}
          onClose={closeFormModal}
          onSubmit={handleStudentSubmit}
          onToggleCourse={toggleCourse}
          onFormChange={updateFormField}
        />
      )}

      {paymentStudent && (
        <PaymentModal
          student={paymentStudent}
          form={paymentForm}
          isOffline={isOffline}
          saving={savingPayment}
          onClose={closePaymentModal}
          onSubmit={handlePaymentSubmit}
          onChange={updatePaymentField}
        />
      )}

      {historyStudent && (
        <HistoryDrawer
          student={historyStudent}
          historyData={historyData}
          historyLoading={historyLoading}
          historyTab={historyTab}
          onClose={() => {
            setHistoryStudent(null);
            setHistoryData(null);
          }}
          onTabChange={setHistoryTab}
        />
      )}

      <AdminConfirmDialog
        open={Boolean(deleteStudentTarget)}
        title="Delete student?"
        description="Are you sure you want to delete this student? Related fee and attendance history may remain for audit records."
        confirmLabel="Set Inactive"
        cancelLabel="Cancel"
        variant="warning"
        loading={deletingStudent}
        onCancel={() => setDeleteStudentTarget(null)}
        onConfirm={() => void handleDeleteStudent()}
      />
    </div>
  );
}
