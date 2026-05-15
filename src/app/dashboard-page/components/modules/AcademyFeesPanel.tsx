'use client';

import React, { useCallback, useEffect, useMemo, useState, useDeferredValue } from 'react';
import { toast } from 'sonner';
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { AuthUser, FeeRecord } from '@/types';
import { addFee, deleteFee, getFees, updateFee } from '@/services/feeService';

interface AcademyFeesPanelProps {
  user: AuthUser;
  onNavigate: (navId: string) => void;
}

const emptyFee: Omit<FeeRecord, 'id'> = {
  title: '',
  description: '',
  studentName: '',
  amount: 0,
  dueDate: new Date().toISOString().slice(0, 10),
  status: 'pending',
  notes: '',
  createdAt: undefined,
};

function useDebouncedValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
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

export default function AcademyFeesPanel({ user, onNavigate }: AcademyFeesPanelProps) {
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Omit<FeeRecord, 'id'>>(emptyFee);
  const [submitting, setSubmitting] = useState(false);

  const debouncedSearchTerm = useDebouncedValue(searchInput, 250);
  const deferredSearchTerm = useDeferredValue(debouncedSearchTerm);

  useEffect(() => {
    let active = true;
    setLoading(true);

    async function loadFees() {
      try {
        const data = await getFees(user.id);
        if (!active) return;
        setFees(data as FeeRecord[]);
      } catch {
        if (!active) return;
        toast.error('Unable to load fee records right now.');
        setFees([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadFees();
    return () => {
      active = false;
    };
  }, [user.id]);

  const filteredFees = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase();
    if (!query) return fees;
    return fees.filter((fee) =>
      [fee.title, fee.description, fee.studentName, fee.status, fee.notes, fee.dueDate]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [fees, deferredSearchTerm]);

  const totals = useMemo(() => ({
    invoices: fees.length,
    totalAmount: fees.reduce((sum, fee) => sum + (fee.amount ?? 0), 0),
    overdue: fees.filter((fee) => fee.status === 'overdue').length,
    collected: fees.filter((fee) => fee.status === 'paid').length,
  }), [fees]);

  const totalPages = Math.max(1, Math.ceil(filteredFees.length / rowsPerPage));
  const paginatedFees = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredFees.slice(startIndex, startIndex + rowsPerPage);
  }, [currentPage, filteredFees, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchTerm, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const openForm = useCallback((fee?: FeeRecord) => {
    if (fee) {
      setEditingFeeId(fee.id);
      setFormValues({
        title: fee.title,
        description: fee.description ?? '',
        studentName: fee.studentName,
        amount: fee.amount,
        dueDate: fee.dueDate,
        status: fee.status,
        notes: fee.notes ?? '',
        createdAt: fee.createdAt,
      });
    } else {
      setEditingFeeId(null);
      setFormValues(emptyFee);
    }
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setEditingFeeId(null);
    setFormValues(emptyFee);
    setFormOpen(false);
  }, []);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = event.target;
      setFormValues((current) => ({
        ...current,
        [name]: name === 'amount' ? Number(value) : value,
      }));
    },
    [],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmitting(true);

      const nextFee: Omit<FeeRecord, 'id'> = {
        title: formValues.title.trim(),
        description: formValues.description.trim(),
        studentName: formValues.studentName.trim(),
        amount: formValues.amount,
        dueDate: formValues.dueDate,
        status: formValues.status,
        notes: formValues.notes?.trim() ?? '',
        createdAt: formValues.createdAt,
      };

      try {
        if (editingFeeId) {
          await updateFee(user.id, editingFeeId, nextFee);
          setFees((current) => current.map((fee) => (fee.id === editingFeeId ? { id: editingFeeId, ...nextFee } : fee)));
          toast.success('Fee record updated successfully.');
        } else {
          const newId = await addFee(user.id, nextFee);
          setFees((current) => [{ id: newId, ...nextFee }, ...current]);
          toast.success('Fee record added successfully.');
        }
        closeForm();
      } catch {
        toast.error('Unable to save fee record right now. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [closeForm, formValues, user.id],
  );

  const handleDelete = useCallback(
    async (feeId: string) => {
      const confirmed = window.confirm('Delete this fee record?');
      if (!confirmed) return;

      try {
        await deleteFee(user.id, feeId);
        setFees((current) => current.filter((fee) => fee.id !== feeId));
        toast.success('Fee record deleted successfully.');
      } catch {
        toast.error('Unable to delete fee record right now.');
      }
    },
    [user.id],
  );

  return (
    <div className="max-w-screen-2xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-700 tracking-[0.24em] text-primary uppercase">Academy Fees</p>
          <h1 className="text-2xl font-700 text-foreground mt-1">Fee Ledger</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track fee collections, payment status, and due amounts for student invoices.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onNavigate('nav-students')} className="btn-outline px-4 py-2.5 rounded-xl text-sm">
            Back to Students
          </button>
          <button type="button" onClick={() => openForm()} className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm">
            <Plus size={16} /> Add Fee
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass-card rounded-2xl border border-border p-5">
          <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">Invoices</p>
          <p className="text-2xl font-700 text-foreground mt-2">{totals.invoices}</p>
        </div>
        <div className="glass-card rounded-2xl border border-border p-5">
          <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">Collected</p>
          <p className="text-2xl font-700 text-foreground mt-2">{totals.collected}</p>
        </div>
        <div className="glass-card rounded-2xl border border-border p-5">
          <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">Overdue</p>
          <p className="text-2xl font-700 text-foreground mt-2">{totals.overdue}</p>
        </div>
        <div className="glass-card rounded-2xl border border-border p-5">
          <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">Total Fee</p>
          <p className="text-2xl font-700 text-foreground mt-2">{formatCurrency(totals.totalAmount)}</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search fee records by student, description, or status"
              className="w-full bg-input border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={rowsPerPage}
              onChange={(event) => setRowsPerPage(Number(event.target.value))}
              className="bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {[10, 20, 30].map((option) => (
                <option key={option} value={option}>
                  {option} rows
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-muted-foreground">Loading fee records...</div>
        ) : filteredFees.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm font-600 text-foreground">No fee records found.</p>
            <p className="text-xs text-muted-foreground mt-1">Create your first invoice to track student payments.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/80 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-4">Invoice</th>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Due</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {paginatedFees.map((fee) => (
                  <tr key={fee.id}>
                    <td className="px-5 py-4 font-600 text-foreground">{fee.title}</td>
                    <td className="px-5 py-4 text-muted-foreground">{fee.studentName || 'Student'}</td>
                    <td className="px-5 py-4 text-muted-foreground">{formatCurrency(fee.amount)}</td>
                    <td className="px-5 py-4 text-muted-foreground">{new Date(fee.dueDate).toLocaleDateString('en-IN')}</td>
                    <td className="px-5 py-4 text-sm font-600 capitalize text-foreground">{fee.status}</td>
                    <td className="px-5 py-4 space-x-2">
                      <button type="button" onClick={() => openForm(fee)} className="btn-outline px-3 py-2 rounded-xl text-xs">
                        <Pencil size={14} />
                      </button>
                      <button type="button" onClick={() => handleDelete(fee.id)} className="btn-outline px-3 py-2 rounded-xl text-xs text-red-600 border-red-200 hover:bg-red-50">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredFees.length > 0 && (
          <div className="px-5 py-4 border-t border-border bg-white/80 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, filteredFees.length)} of {filteredFees.length} fee records
            </p>
            <div className="flex items-center gap-2 self-end md:self-auto">
              <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="btn-outline px-3 py-2 rounded-lg text-xs inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="text-xs font-600 text-foreground px-3 py-2 rounded-lg bg-muted">{currentPage} / {totalPages}</span>
              <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="btn-outline px-3 py-2 rounded-lg text-xs inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 overflow-y-auto">
          <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 md:p-8 shadow-xl">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">{editingFeeId ? 'Edit fee record' : 'New Fee Record'}</p>
                <h2 className="text-2xl font-700 text-foreground mt-1">{editingFeeId ? 'Update invoice' : 'Create invoice'}</h2>
              </div>
              <button type="button" onClick={closeForm} className="text-muted-foreground hover:text-foreground">
                <ChevronLeft size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-600 text-foreground mb-1.5">Invoice Title</label>
                <input name="title" required value={formValues.title} onChange={handleChange} className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">Student Name</label>
                <input name="studentName" value={formValues.studentName} onChange={handleChange} className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">Amount</label>
                <input name="amount" required type="number" min="0" value={formValues.amount} onChange={handleChange} className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">Due Date</label>
                <input name="dueDate" required type="date" value={formValues.dueDate} onChange={handleChange} className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-600 text-foreground mb-1.5">Description</label>
                <textarea name="description" rows={4} value={formValues.description} onChange={handleChange} className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">Status</label>
                <select name="status" value={formValues.status} onChange={handleChange} className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-600 text-foreground mb-1.5">Notes</label>
                <textarea name="notes" rows={4} value={formValues.notes} onChange={handleChange} className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="md:col-span-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeForm} className="btn-outline px-5 py-3 rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary px-5 py-3 rounded-xl text-sm disabled:opacity-60 disabled:cursor-not-allowed">{submitting ? 'Saving...' : editingFeeId ? 'Save changes' : 'Create Invoice'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
