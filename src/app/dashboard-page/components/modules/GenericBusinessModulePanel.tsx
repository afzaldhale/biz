'use client';

import React, { useCallback, useEffect, useMemo, useState, useDeferredValue } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AuthUser, GenericBusinessRecord } from '@/types';
import {
  addBusinessRecord,
  deleteBusinessRecord,
  getBusinessRecords,
  updateBusinessRecord,
} from '@/services/recordService';

interface GenericBusinessModulePanelProps {
  user: AuthUser;
  activeNav: string;
  moduleTitle: string;
}

const defaultFormValues: Omit<GenericBusinessRecord, 'id'> = {
  title: '',
  reference: '',
  amount: 0,
  date: new Date().toISOString().slice(0, 10),
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

function titleToCollection(activeNav: string) {
  return activeNav.replace('nav-', '').replace(/-/g, '');
}

function inferHasAmount(moduleTitle: string) {
  return /(bill|invoice|fee|payment|receipt|billing)/i.test(moduleTitle);
}

function inferHasDate(moduleTitle: string) {
  return /(booking|appointment|check|date|schedule|visit)/i.test(moduleTitle);
}

function inferPrimaryLabel(moduleTitle: string) {
  if (/customer|guest|patient|member|client/i.test(moduleTitle)) {
    return 'Name';
  }

  if (/room|table|service|ticket|invoice|receipt|booking|appointment/i.test(moduleTitle)) {
    return `${moduleTitle.replace(/s?$/i, '')} Name`;
  }

  return 'Title';
}

export default function GenericBusinessModulePanel({
  user,
  activeNav,
  moduleTitle,
}: GenericBusinessModulePanelProps) {
  const [records, setRecords] = useState<GenericBusinessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Omit<GenericBusinessRecord, 'id'>>(defaultFormValues);
  const [submitting, setSubmitting] = useState(false);

  const collectionName = titleToCollection(activeNav);
  const hasAmount = inferHasAmount(moduleTitle);
  const hasDate = inferHasDate(moduleTitle);
  const primaryFieldLabel = inferPrimaryLabel(moduleTitle);
  const secondaryFieldLabel = hasAmount ? 'Reference / Invoice' : 'Reference';

  const debouncedSearchTerm = useDebouncedValue(searchInput, 250);
  const deferredSearchTerm = useDeferredValue(debouncedSearchTerm);

  useEffect(() => {
    let active = true;
    setLoading(true);

    async function loadRecords() {
      try {
        const data = await getBusinessRecords(user.id, collectionName);
        if (!active) return;
        setRecords(data.sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? '')));
      } catch {
        if (!active) return;
        toast.error('Unable to load records. Please try again later.');
        setRecords([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRecords();
    return () => {
      active = false;
    };
  }, [collectionName, user.id]);

  const filteredRecords = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase();
    if (!query) {
      return records;
    }

    return records.filter((record) =>
      [record.title, record.reference, record.status, record.notes, record.date]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [deferredSearchTerm, records]);

  const totalAmount = useMemo(
    () => records.reduce((sum, record) => sum + (record.amount ?? 0), 0),
    [records],
  );

  const dueRecords = useMemo(
    () => records.filter((record) => record.status === 'pending' || record.status === 'overdue').length,
    [records],
  );

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / rowsPerPage));
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredRecords.slice(startIndex, startIndex + rowsPerPage);
  }, [currentPage, filteredRecords, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchTerm, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const openForm = useCallback((record?: GenericBusinessRecord) => {
    if (record) {
      setEditingId(record.id);
      setFormValues({
        title: record.title,
        reference: record.reference ?? '',
        amount: record.amount ?? 0,
        date: record.date ?? new Date().toISOString().slice(0, 10),
        status: record.status ?? 'pending',
        notes: record.notes ?? '',
        createdAt: record.createdAt,
      });
    } else {
      setEditingId(null);
      setFormValues(defaultFormValues);
    }
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setEditingId(null);
    setFormValues(defaultFormValues);
    setFormOpen(false);
  }, []);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

      const nextRecord: Omit<GenericBusinessRecord, 'id'> = {
        ...formValues,
        title: formValues.title.trim(),
        reference: formValues.reference?.trim() ?? '',
        notes: formValues.notes?.trim() ?? '',
        date: formValues.date,
        amount: formValues.amount ?? 0,
      };

      try {
        if (editingId) {
          await updateBusinessRecord(user.id, collectionName, editingId, nextRecord);
          setRecords((current) =>
            current.map((record) => (record.id === editingId ? { ...record, ...nextRecord } : record)),
          );
          toast.success(`${moduleTitle} updated successfully.`);
        } else {
          const newId = await addBusinessRecord(user.id, collectionName, nextRecord);
          setRecords((current) => [{ id: newId, ...nextRecord }, ...current]);
          toast.success(`${moduleTitle} record created successfully.`);
        }
        closeForm();
      } catch {
        toast.error('Unable to save the record right now. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [closeForm, collectionName, editingId, formValues, moduleTitle, user.id],
  );

  const handleDelete = useCallback(
    async (recordId: string) => {
      const confirmed = window.confirm('Delete this record permanently?');
      if (!confirmed) return;

      try {
        await deleteBusinessRecord(user.id, collectionName, recordId);
        setRecords((current) => current.filter((record) => record.id !== recordId));
        toast.success('Record deleted successfully.');
      } catch {
        toast.error('Unable to delete the record. Please try again later.');
      }
    },
    [collectionName, user.id],
  );

  return (
    <div className="max-w-screen-2xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-700 tracking-[0.24em] text-primary uppercase">{moduleTitle}</p>
          <h1 className="text-2xl font-700 text-foreground mt-1">{moduleTitle}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage {moduleTitle.toLowerCase()} records for {user.businessName} with search, edit, and print-ready actions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openForm()}
          className="btn-primary inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
        >
          <Plus size={16} />
          Add {moduleTitle.replace(/s$/, '')}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass-card rounded-2xl border border-border p-5">
          <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">Records</p>
          <p className="text-2xl font-700 text-foreground mt-2">{records.length}</p>
        </div>
        {hasAmount && (
          <div className="glass-card rounded-2xl border border-border p-5">
            <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">Total Amount</p>
            <p className="text-2xl font-700 text-foreground mt-2">{formatCurrency(totalAmount)}</p>
          </div>
        )}
        <div className="glass-card rounded-2xl border border-border p-5">
          <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">Open / Due</p>
          <p className="text-2xl font-700 text-foreground mt-2">{dueRecords}</p>
        </div>
        <div className="glass-card rounded-2xl border border-border p-5">
          <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">Workspace</p>
          <p className="text-2xl font-700 text-foreground mt-2">{user.businessName}</p>
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
              placeholder={`Search ${moduleTitle.toLowerCase()} by title, reference, or status`}
              className="w-full bg-input border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
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
          <div className="p-16 text-center text-muted-foreground">Loading records...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm font-600 text-foreground">No records found.</p>
            <p className="text-xs text-muted-foreground mt-1">Create your first record to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/80 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-4">{primaryFieldLabel}</th>
                  <th className="px-5 py-4">Reference</th>
                  {hasAmount && <th className="px-5 py-4">Amount</th>}
                  {hasDate && <th className="px-5 py-4">Date</th>}
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {paginatedRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-5 py-4 font-600 text-foreground">{record.title}</td>
                    <td className="px-5 py-4 text-muted-foreground">{record.reference || '—'}</td>
                    {hasAmount && (
                      <td className="px-5 py-4 text-muted-foreground">{formatCurrency(record.amount ?? 0)}</td>
                    )}
                    {hasDate && (
                      <td className="px-5 py-4 text-muted-foreground">
                        {record.date ? new Date(record.date).toLocaleDateString('en-IN') : '—'}
                      </td>
                    )}
                    <td className="px-5 py-4 text-sm font-600 capitalize text-foreground">{record.status ?? 'pending'}</td>
                    <td className="px-5 py-4 space-x-2">
                      <button
                        type="button"
                        onClick={() => openForm(record)}
                        className="btn-outline px-3 py-2 rounded-xl text-xs"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(record.id)}
                        className="btn-outline px-3 py-2 rounded-xl text-xs text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredRecords.length > 0 && (
          <div className="px-5 py-4 border-t border-border bg-white/80 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, filteredRecords.length)} of {filteredRecords.length}
            </p>
            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="btn-outline px-3 py-2 rounded-lg text-xs inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="text-xs font-600 text-foreground px-3 py-2 rounded-lg bg-muted">{currentPage} / {totalPages}</span>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="btn-outline px-3 py-2 rounded-lg text-xs inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
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
                <p className="text-sm text-muted-foreground">{editingId ? 'Edit' : 'New'} {moduleTitle.replace(/s$/, '')}</p>
                <h2 className="text-2xl font-700 text-foreground mt-1">{editingId ? 'Update' : 'Create'} record</h2>
              </div>
              <button type="button" onClick={closeForm} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-600 text-foreground mb-1.5">{primaryFieldLabel}</label>
                <input
                  required
                  name="title"
                  value={formValues.title}
                  onChange={handleChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">{secondaryFieldLabel}</label>
                <input
                  name="reference"
                  value={formValues.reference}
                  onChange={handleChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {hasAmount && (
                <div>
                  <label className="block text-sm font-600 text-foreground mb-1.5">Amount</label>
                  <input
                    required
                    type="number"
                    min="0"
                    name="amount"
                    value={formValues.amount}
                    onChange={handleChange}
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}

              {hasDate && (
                <div>
                  <label className="block text-sm font-600 text-foreground mb-1.5">Date</label>
                  <input
                    required
                    type="date"
                    name="date"
                    value={formValues.date}
                    onChange={handleChange}
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">Status</label>
                <select
                  name="status"
                  value={formValues.status}
                  onChange={handleChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-600 text-foreground mb-1.5">Notes</label>
                <textarea
                  name="notes"
                  rows={4}
                  value={formValues.notes}
                  onChange={handleChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="md:col-span-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeForm} className="btn-outline px-5 py-3 rounded-xl text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary px-5 py-3 rounded-xl text-sm disabled:opacity-60 disabled:cursor-not-allowed">
                  {submitting ? 'Saving...' : editingId ? 'Update Record' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
