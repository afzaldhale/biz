'use client';

import React, { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';
import {
  Search,
  UserPlus,
  PencilLine,
  Trash2,
  Printer,
  X,
  Users,
  GraduationCap,
  IndianRupee,
  ReceiptText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AuthUser, StudentRecord } from '@/types';
import { addStudent, deleteStudent, getStudents, updateStudent } from '@/services/studentService';

interface AcademyStudentsPanelProps {
  user: AuthUser;
  onNavigate: (navId: string) => void;
}

interface StudentFormValues {
  studentName: string;
  parentName: string;
  courseName: string;
  phone: string;
  email: string;
  admissionDate: string;
  feeAmount: string;
  paidAmount: string;
  status: StudentRecord['status'];
  notes: string;
}

interface StudentTableProps {
  currentPage: number;
  loading: boolean;
  onDelete: (student: StudentRecord) => void;
  onEdit: (student: StudentRecord) => void;
  onPrint: (student: StudentRecord) => void;
  students: StudentRecord[];
  hasMoreStudents: boolean;
  loadMoreStudents: () => void;
}

interface StudentFormModalProps {
  formValues: StudentFormValues;
  editingStudentId: string | null;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  submitting: boolean;
}

const rowsPerPageOptions = [25, 50];

const emptyForm: StudentFormValues = {
  studentName: '',
  parentName: '',
  courseName: '',
  phone: '',
  email: '',
  admissionDate: new Date().toISOString().slice(0, 10),
  feeAmount: '',
  paidAmount: '',
  status: 'active',
  notes: '',
};

function useDebouncedValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [delay, value]);

  return debouncedValue;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildAdmissionId(students: StudentRecord[]) {
  return `ADM-${String(students.length + 2401).padStart(4, '0')}`;
}

function normalizeStudentRecord(
  student: Partial<StudentRecord>,
  fallbackId: string
): StudentRecord {
  return {
    id: student.id ?? fallbackId,
    admissionId: student.admissionId ?? fallbackId.toUpperCase(),
    studentName: student.studentName ?? 'Unknown Student',
    courseName: student.courseName ?? 'Unassigned Course',
    phone: student.phone ?? '',
    email: student.email ?? '',
    parentName: student.parentName ?? 'N/A',
    status: (student.status as StudentRecord['status']) ?? 'active',
    admissionDate: student.admissionDate ?? new Date().toISOString().slice(0, 10),
    feeAmount: Number(student.feeAmount ?? 0),
    paidAmount: Number(student.paidAmount ?? 0),
    notes: student.notes ?? '',
    createdAt: student.createdAt,
  };
}

const StudentsTable = memo(function StudentsTable({
  currentPage,
  loading,
  onDelete,
  onEdit,
  onPrint,
  students,
  hasMoreStudents,
  loadMoreStudents,
}: StudentTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px]">
        <thead className="bg-muted/40">
          <tr>
            <th className="text-left px-5 py-3 text-2xs font-700 text-muted-foreground uppercase tracking-wider">
              Student
            </th>
            <th className="text-left px-5 py-3 text-2xs font-700 text-muted-foreground uppercase tracking-wider">
              Course
            </th>
            <th className="text-left px-5 py-3 text-2xs font-700 text-muted-foreground uppercase tracking-wider">
              Contact
            </th>
            <th className="text-left px-5 py-3 text-2xs font-700 text-muted-foreground uppercase tracking-wider">
              Status
            </th>
            <th className="text-left px-5 py-3 text-2xs font-700 text-muted-foreground uppercase tracking-wider">
              Fees
            </th>
            <th className="text-right px-5 py-3 text-2xs font-700 text-muted-foreground uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <tr key={`student-skeleton-${index}`}>
                  <td colSpan={6} className="px-5 py-4">
                    <div className="h-14 rounded-xl bg-muted animate-pulse" />
                  </td>
                </tr>
              ))
            : students.map((student) => {
                const balance = student.feeAmount - student.paidAmount;
                return (
                  <tr key={student.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-700 text-foreground">{student.studentName}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {student.admissionId} · Parent: {student.parentName}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-600 text-foreground">{student.courseName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Joined {student.admissionDate}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-foreground">{student.phone}</p>
                      <p className="text-xs text-muted-foreground mt-1">{student.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-600 capitalize ${
                          student.status === 'active'
                            ? 'badge-success'
                            : student.status === 'pending'
                              ? 'badge-warning'
                              : 'badge-info'
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-700 text-foreground">
                        {formatCurrency(student.paidAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Balance {formatCurrency(balance)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onPrint(student)}
                          className="btn-outline px-3 py-2 rounded-lg text-xs inline-flex items-center gap-1.5"
                        >
                          <Printer size={14} />
                          Receipt
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(student)}
                          className="btn-outline px-3 py-2 rounded-lg text-xs inline-flex items-center gap-1.5"
                        >
                          <PencilLine size={14} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(student)}
                          className="px-3 py-2 rounded-lg text-xs inline-flex items-center gap-1.5 border border-danger/30 bg-danger/5 text-danger hover:bg-danger/10 transition-colors"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          {!loading && students.length === 0 && (
            <tr>
              <td colSpan={6} className="px-5 py-16 text-center">
                <p className="text-sm font-600 text-foreground">No students found on this page.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try a different filter or return to page 1.
                </p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {!loading && students.length > 0 && (
        <div className="px-5 py-3 border-t border-border bg-white/80 text-xs text-muted-foreground">
          Page {currentPage}
        </div>
      )}
      {!loading && hasMoreStudents && (
        <div className="px-5 py-4 border-t border-border bg-white/80 text-right">
          <button
            type="button"
            onClick={loadMoreStudents}
            className="btn-outline inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
          >
            Load more students
          </button>
        </div>
      )}
    </div>
  );
});

const StudentFormModal = memo(function StudentFormModal({
  formValues,
  editingStudentId,
  onChange,
  onClose,
  onSubmit,
  submitting,
}: StudentFormModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center">
        <div className="w-full max-w-3xl glass-card rounded-[28px] border border-border shadow-card overflow-hidden animate-slide-up">
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <div>
              <p className="text-xs font-700 tracking-[0.22em] text-primary uppercase">
                {editingStudentId ? 'Edit Record' : 'New Admission'}
              </p>
              <h2 className="text-xl font-700 text-foreground mt-1">
                {editingStudentId ? 'Update Student' : 'Add Student'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors"
              aria-label="Close form"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="p-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">
                  Student Name
                </label>
                <input
                  required
                  name="studentName"
                  value={formValues.studentName}
                  onChange={onChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">Parent Name</label>
                <input
                  required
                  name="parentName"
                  value={formValues.parentName}
                  onChange={onChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">Course Name</label>
                <input
                  required
                  name="courseName"
                  value={formValues.courseName}
                  onChange={onChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">
                  Admission Date
                </label>
                <input
                  required
                  type="date"
                  name="admissionDate"
                  value={formValues.admissionDate}
                  onChange={onChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">Phone</label>
                <input
                  required
                  name="phone"
                  value={formValues.phone}
                  onChange={onChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">Email</label>
                <input
                  required
                  type="email"
                  name="email"
                  value={formValues.email}
                  onChange={onChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">Total Fee</label>
                <input
                  required
                  min="0"
                  type="number"
                  name="feeAmount"
                  value={formValues.feeAmount}
                  onChange={onChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">Paid Amount</label>
                <input
                  required
                  min="0"
                  type="number"
                  name="paidAmount"
                  value={formValues.paidAmount}
                  onChange={onChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-600 text-foreground mb-1.5">
                  Enrollment Status
                </label>
                <select
                  name="status"
                  value={formValues.status}
                  onChange={onChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-600 text-foreground mb-1.5">Notes</label>
                <textarea
                  name="notes"
                  rows={4}
                  value={formValues.notes}
                  onChange={onChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Batch preference, fee reminder, academic notes, or parent communication details"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="btn-outline px-5 py-3 rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary px-5 py-3 rounded-xl text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : editingStudentId ? 'Update Student' : 'Add Student'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

export default function AcademyStudentsPanel({ user, onNavigate }: AcademyStudentsPanelProps) {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StudentRecord['status']>('all');
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastStudentDoc, setLastStudentDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(
    null
  );
  const [hasMoreStudents, setHasMoreStudents] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formValues, setFormValues] = useState<StudentFormValues>(emptyForm);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const debouncedSearchTerm = useDebouncedValue(searchInput, 250);
  const deferredSearchTerm = useDeferredValue(debouncedSearchTerm);

  useEffect(() => {
    let mounted = true;

    async function loadStudents() {
      setLoading(true);
      setLastStudentDoc(null);
      setHasMoreStudents(false);

      try {
        const paginated = await getStudents(user.id, { pageSize: rowsPerPage });
        if (!mounted) {
          return;
        }

        setStudents(
          paginated.data.map((student: StudentRecord, index: number) =>
            normalizeStudentRecord(student, `student-${index + 1}`)
          )
        );
        setLastStudentDoc(paginated.lastDoc);
        setHasMoreStudents(paginated.hasMore);
      } catch {
        if (!mounted) {
          return;
        }

        setStudents([]);
        toast.error('Unable to load students from Firebase right now.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadStudents();

    return () => {
      mounted = false;
    };
  }, [user.id, rowsPerPage]);

  const loadMoreStudents = useCallback(async () => {
    if (!hasMoreStudents || !lastStudentDoc) {
      return;
    }

    setLoading(true);
    try {
      const paginated = await getStudents(user.id, {
        pageSize: rowsPerPage,
        lastDoc: lastStudentDoc,
      });

      setStudents((current) => [
        ...current,
        ...paginated.data.map((student: StudentRecord, index: number) =>
          normalizeStudentRecord(student, `student-${current.length + index + 1}`)
        ),
      ]);
      setLastStudentDoc(paginated.lastDoc);
      setHasMoreStudents(paginated.hasMore);
    } catch {
      toast.error('Unable to load more students. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [hasMoreStudents, lastStudentDoc, rowsPerPage, user.id]);

  const filteredStudents = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase();

    return students.filter((student) => {
      const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
      const matchesQuery =
        query.length === 0 ||
        [
          student.studentName,
          student.courseName,
          student.phone,
          student.email,
          student.parentName,
          student.admissionId,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesQuery;
    });
  }, [deferredSearchTerm, statusFilter, students]);

  const studentStats = useMemo(() => {
    const totalFees = students.reduce((sum, student) => sum + student.feeAmount, 0);
    const totalCollected = students.reduce((sum, student) => sum + student.paidAmount, 0);

    return {
      totalStudents: students.length,
      activeStudents: students.filter((student) => student.status === 'active').length,
      totalCollected,
      pendingFees: totalFees - totalCollected,
    };
  }, [students]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredStudents.length / rowsPerPage)),
    [filteredStudents.length, rowsPerPage]
  );

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredStudents.slice(startIndex, startIndex + rowsPerPage);
  }, [currentPage, filteredStudents, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchTerm, rowsPerPage, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const closeForm = useCallback(() => {
    setFormValues(emptyForm);
    setEditingStudentId(null);
    setIsFormOpen(false);
  }, []);

  const openCreateForm = useCallback(() => {
    setFormValues(emptyForm);
    setEditingStudentId(null);
    setIsFormOpen(true);
  }, []);

  const openEditForm = useCallback((student: StudentRecord) => {
    setEditingStudentId(student.id);
    setFormValues({
      studentName: student.studentName,
      parentName: student.parentName,
      courseName: student.courseName,
      phone: student.phone,
      email: student.email,
      admissionDate: student.admissionDate,
      feeAmount: String(student.feeAmount),
      paidAmount: String(student.paidAmount),
      status: student.status,
      notes: student.notes ?? '',
    });
    setIsFormOpen(true);
  }, []);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = event.target;
      setFormValues((current) => ({
        ...current,
        [name]: value,
      }));
    },
    []
  );

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchInput('');
    setStatusFilter('all');
    setCurrentPage(1);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmitting(true);

      const nextRecord: StudentRecord = {
        id: editingStudentId ?? `student-${Date.now()}`,
        admissionId:
          students.find((student) => student.id === editingStudentId)?.admissionId ??
          buildAdmissionId(students),
        studentName: formValues.studentName.trim(),
        parentName: formValues.parentName.trim(),
        courseName: formValues.courseName.trim(),
        phone: formValues.phone.trim(),
        email: formValues.email.trim(),
        admissionDate: formValues.admissionDate,
        feeAmount: Number(formValues.feeAmount || 0),
        paidAmount: Number(formValues.paidAmount || 0),
        status: formValues.status,
        notes: formValues.notes.trim(),
        createdAt: new Date().toISOString(),
      };

      try {
        if (editingStudentId) {
          await updateStudent(user.id, editingStudentId, nextRecord);
        } else {
          const newId = await addStudent(user.id, nextRecord);
          nextRecord.id = newId;
        }

        setStudents((current) => {
          if (editingStudentId) {
            return current.map((student) =>
              student.id === editingStudentId ? nextRecord : student
            );
          }

          return [nextRecord, ...current];
        });

        toast.success(
          editingStudentId ? 'Student details updated successfully.' : 'Student added successfully.'
        );
        closeForm();
      } catch {
        toast.error('Unable to save student right now. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [closeForm, editingStudentId, formValues, students, user.id]
  );

  const handleDelete = useCallback(
    async (student: StudentRecord) => {
      const confirmed = window.confirm(`Delete ${student.studentName} from the student list?`);
      if (!confirmed) {
        return;
      }

      try {
        await deleteStudent(user.id, student.id);

        setStudents((current) => current.filter((item) => item.id !== student.id));
        toast.success('Student removed successfully.');
      } catch {
        toast.error('Unable to delete this student right now.');
      }
    },
    [user.id]
  );

  const handlePrintReceipt = useCallback(
    (student: StudentRecord) => {
      const balance = student.feeAmount - student.paidAmount;
      const receiptWindow = window.open('', '_blank', 'width=900,height=700');

      if (!receiptWindow) {
        toast.error('Popup blocked. Please allow popups to print receipts.');
        return;
      }

      receiptWindow.document.write(`
        <html>
          <head>
            <title>Receipt ${student.admissionId}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; color: #0f172a; }
              .print-area { padding: 32px; width: 100%; max-width: 900px; margin: 0 auto; }
              .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 24px; }
              .brand { font-size: 24px; font-weight: 700; color: #4338ca; margin-bottom: 8px; }
              .card { border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; background: #fff; }
              .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 16px; }
              .label { font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 6px; letter-spacing: 0.04em; }
              .value { font-size: 14px; font-weight: 600; color: #0f172a; }
              .summary { margin-top: 24px; padding: 18px; border-radius: 12px; background: #eef2ff; }
              .summary div { margin-bottom: 10px; }
              .summary div:last-child { margin-bottom: 0; }
              @media print {
                body { color: #000; }
                .print-area { box-shadow: none; }
                .no-print, button { display: none !important; }
              }
            </style>
          </head>
          <body>
            <div class="print-area">
              <div class="header">
                <div>
                  <div class="brand">${user.businessName}</div>
                  <div>Academy Fee Receipt</div>
                </div>
                <div>
                  <div><strong>Receipt:</strong> ${student.admissionId}</div>
                  <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</div>
                </div>
              </div>
              <div class="card">
                <div class="grid">
                  <div><div class="label">Student Name</div><div class="value">${student.studentName}</div></div>
                  <div><div class="label">Parent Name</div><div class="value">${student.parentName}</div></div>
                  <div><div class="label">Course</div><div class="value">${student.courseName}</div></div>
                  <div><div class="label">Phone</div><div class="value">${student.phone}</div></div>
                  <div><div class="label">Email</div><div class="value">${student.email}</div></div>
                  <div><div class="label">Admission Date</div><div class="value">${student.admissionDate}</div></div>
                </div>
                <div class="summary">
                  <div><strong>Total Fee:</strong> ${formatCurrency(student.feeAmount)}</div>
                  <div><strong>Paid:</strong> ${formatCurrency(student.paidAmount)}</div>
                  <div><strong>Balance:</strong> ${formatCurrency(balance)}</div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `);
      receiptWindow.document.close();
      receiptWindow.focus();
      receiptWindow.print();
    },
    [user.businessName]
  );

  const handleRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(event.target.value));
  }, []);

  return (
    <div className="max-w-screen-2xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-700 tracking-[0.24em] text-primary uppercase">
            Academy Management
          </p>
          <h1 className="text-2xl font-700 text-foreground mt-1">Students</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage admissions, track fee collection, and print student receipts from one workspace.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onNavigate('nav-fees')}
            className="btn-outline px-4 py-2.5 rounded-xl text-sm"
          >
            Open Fees
          </button>
          <button
            type="button"
            onClick={openCreateForm}
            className="btn-primary px-4 py-2.5 rounded-xl text-sm inline-flex items-center gap-2"
          >
            <UserPlus size={16} />
            Add Student
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">
                Total Students
              </p>
              <p className="text-2xl font-700 text-foreground mt-2">{studentStats.totalStudents}</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-primary">
              <Users size={20} />
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">
                Active Enrollments
              </p>
              <p className="text-2xl font-700 text-foreground mt-2">
                {studentStats.activeStudents}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600">
              <GraduationCap size={20} />
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">
                Fees Collected
              </p>
              <p className="text-2xl font-700 text-foreground mt-2">
                {formatCurrency(studentStats.totalCollected)}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <IndianRupee size={20} />
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">
                Pending Balance
              </p>
              <p className="text-2xl font-700 text-foreground mt-2">
                {formatCurrency(studentStats.pendingFees)}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
              <ReceiptText size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Search by name, course, phone, email, parent, or admission ID"
              className="w-full bg-input border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as 'all' | StudentRecord['status'])
              }
              className="bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
              className="bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {rowsPerPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option} rows
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn-outline px-4 py-3 rounded-xl text-sm"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {!loading && filteredStudents.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm font-600 text-foreground">
              No students match the current filters.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Try a different search or add a new student.
            </p>
          </div>
        ) : (
          <StudentsTable
            currentPage={currentPage}
            loading={loading}
            onDelete={handleDelete}
            onEdit={openEditForm}
            onPrint={handlePrintReceipt}
            students={paginatedStudents}
            hasMoreStudents={hasMoreStudents}
            loadMoreStudents={loadMoreStudents}
          />
        )}

        {!loading && filteredStudents.length > 0 && (
          <div className="px-5 py-4 border-t border-border bg-white/80 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * rowsPerPage + 1}-
              {Math.min(currentPage * rowsPerPage, filteredStudents.length)} of{' '}
              {filteredStudents.length} students
            </p>
            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="btn-outline px-3 py-2 rounded-lg text-xs inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
                Prev
              </button>
              <span className="text-xs font-600 text-foreground px-3 py-2 rounded-lg bg-muted">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="btn-outline px-3 py-2 rounded-lg text-xs inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {isFormOpen && (
        <StudentFormModal
          formValues={formValues}
          editingStudentId={editingStudentId}
          onChange={handleInputChange}
          onClose={closeForm}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}
    </div>
  );
}
