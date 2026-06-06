'use client';

import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { AuthUser, HotelGuestRecord } from '@/types';
import {
  addHotelGuest,
  deleteHotelGuest,
  getHotelGuests,
  updateHotelGuest,
} from '@/services/hotelGuestsService';
import { handleAppError } from '@/utils/appErrorHandler';

const defaultGuestForm: Omit<HotelGuestRecord, 'id'> = {
  guestId: '',
  customerName: '',
  age: 0,
  aadhaarNumber: '',
  vehicleNumber: '',
  address: '',
  checkInDateTime: new Date().toISOString().slice(0, 16),
  createdAt: undefined,
  updatedAt: undefined,
};

function formatDateTime(value: string) {
  return value ? new Date(value).toLocaleString('en-IN', { hour12: false }) : '—';
}

export default function HotelGuestsPanel({ user }: { user: AuthUser }) {
  const [guests, setGuests] = useState<HotelGuestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Omit<HotelGuestRecord, 'id'>>(defaultGuestForm);
  const [submitting, setSubmitting] = useState(false);

  const debouncedSearchTerm = useDeferredValue(searchInput);

  useEffect(() => {
    let active = true;
    setLoading(true);

    async function loadGuests() {
      try {
        const data = await getHotelGuests(user.id);
        if (!active) return;
        setGuests(data.sort((a, b) => a.customerName.localeCompare(b.customerName)));
      } catch (error) {
        if (!active) return;
        handleAppError(error, 'Unable to load guests.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadGuests();
    return () => {
      active = false;
    };
  }, [user.id]);

  const filteredGuests = useMemo(() => {
    const query = debouncedSearchTerm.trim().toLowerCase();
    if (!query) return guests;

    return guests.filter((guest) =>
      [
        guest.customerName,
        String(guest.age),
        guest.aadhaarNumber,
        guest.vehicleNumber,
        guest.address,
        guest.checkInDateTime,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [debouncedSearchTerm, guests]);

  const totalPages = Math.max(1, Math.ceil(filteredGuests.length / rowsPerPage));
  const paginatedGuests = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredGuests.slice(startIndex, startIndex + rowsPerPage);
  }, [currentPage, filteredGuests, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const openForm = useCallback((guest?: HotelGuestRecord) => {
    if (guest) {
      setEditingId(guest.id);
      setFormValues({
        guestId: guest.guestId,
        customerName: guest.customerName,
        age: guest.age,
        aadhaarNumber: guest.aadhaarNumber,
        vehicleNumber: guest.vehicleNumber ?? '',
        address: guest.address,
        checkInDateTime: guest.checkInDateTime,
        createdAt: guest.createdAt,
        updatedAt: guest.updatedAt,
      });
    } else {
      setEditingId(null);
      setFormValues(defaultGuestForm);
    }
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setEditingId(null);
    setFormValues(defaultGuestForm);
    setFormOpen(false);
  }, []);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = event.target;
      setFormValues((current) => ({
        ...current,
        [name]: value,
      }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmitting(true);

      try {
        if (editingId) {
          await updateHotelGuest(user.id, editingId, formValues);
          setGuests((current) =>
            current.map((guest) => (guest.id === editingId ? { ...guest, ...formValues } : guest))
          );
          toast.success('Guest updated successfully.');
        } else {
          const newId = await addHotelGuest(user.id, formValues);
          setGuests((current) => [{ id: newId, ...formValues }, ...current]);
          toast.success('Guest added successfully.');
        }
        closeForm();
      } catch (error) {
        handleAppError(error, 'Unable to save guest details.');
      } finally {
        setSubmitting(false);
      }
    },
    [closeForm, editingId, formValues, user.id]
  );

  const handleDelete = useCallback(
    async (guestId: string) => {
      const confirmed = window.confirm('Delete this guest record permanently?');
      if (!confirmed) return;

      try {
        await deleteHotelGuest(user.id, guestId);
        setGuests((current) => current.filter((guest) => guest.id !== guestId));
        toast.success('Guest removed successfully.');
      } catch (error) {
        handleAppError(error, 'Unable to delete this guest.');
      }
    },
    [user.id]
  );

  const stats = useMemo(
    () => ({
      total: guests.length,
      today: guests.filter(
        (guest) => guest.checkInDateTime.slice(0, 10) === new Date().toISOString().slice(0, 10)
      ).length,
      withVehicle: guests.filter((guest) => guest.vehicleNumber).length,
      addressesOnFile: guests.filter((guest) => guest.address).length,
    }),
    [guests]
  );

  return (
    <div className="max-w-screen-2xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-700 tracking-[0.24em] text-primary uppercase">Guests</p>
          <h1 className="text-2xl font-700 text-foreground mt-1">Guests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Register guests with Aadhaar, vehicle, address, and check-in timestamp information.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openForm()}
          className="btn-primary inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
        >
          <Plus size={16} />
          Add Guest
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass-card rounded-2xl border border-border p-5">
          <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">
            Total Guests
          </p>
          <p className="text-2xl font-700 text-foreground mt-2">{stats.total}</p>
        </div>
        <div className="glass-card rounded-2xl border border-border p-5">
          <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">Today</p>
          <p className="text-2xl font-700 text-foreground mt-2">{stats.today}</p>
        </div>
        <div className="glass-card rounded-2xl border border-border p-5">
          <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">With Vehicle</p>
          <p className="text-2xl font-700 text-foreground mt-2">{stats.withVehicle}</p>
        </div>
        <div className="glass-card rounded-2xl border border-border p-5">
          <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">Addresses</p>
          <p className="text-2xl font-700 text-foreground mt-2">{stats.addressesOnFile}</p>
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
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search guests by name, Aadhaar, vehicle, or address"
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
          <div className="p-16 text-center text-muted-foreground">Loading guests...</div>
        ) : filteredGuests.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm font-600 text-foreground">No guests found.</p>
            <p className="text-xs text-muted-foreground mt-1">Add a guest record to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/80 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                        <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Age</th>
                  <th className="px-5 py-4">Aadhaar</th>
                  <th className="px-5 py-4">Vehicle</th>
                  <th className="px-5 py-4">Address</th>
                  <th className="px-5 py-4">Date & Time</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {paginatedGuests.map((guest) => (
                  <tr key={guest.id} className="group hover:bg-primary/5">
                    <td className="px-5 py-4 font-600 text-foreground">{guest.customerName}</td>
                    <td className="px-5 py-4 text-muted-foreground">{guest.age}</td>
                    <td className="px-5 py-4 text-muted-foreground">{guest.aadhaarNumber}</td>
                    <td className="px-5 py-4 text-muted-foreground">{guest.vehicleNumber || '—'}</td>
                    <td className="px-5 py-4 text-muted-foreground">{guest.address || '—'}</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDateTime(guest.checkInDateTime)}
                    </td>
                    <td className="px-5 py-4 space-x-2">
                      <button
                        type="button"
                        onClick={() => openForm(guest)}
                        className="btn-outline px-3 py-2 rounded-xl text-xs"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(guest.id)}
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

        {!loading && filteredGuests.length > 0 && (
          <div className="px-5 py-4 border-t border-border bg-white/80 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * rowsPerPage + 1}-
              {Math.min(currentPage * rowsPerPage, filteredGuests.length)} of{' '}
              {filteredGuests.length}
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
              <span className="text-xs font-600 text-foreground px-3 py-2 rounded-lg bg-muted">
                {currentPage} / {totalPages}
              </span>
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
                <p className="text-sm text-muted-foreground">{editingId ? 'Edit' : 'New'} guest</p>
                <h2 className="text-2xl font-700 text-foreground mt-1">
                  {editingId ? 'Update' : 'Create'} guest record
                </h2>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                <label className="block text-sm font-600 text-foreground mb-1.5">Customer Name *</label>
                <input
                  required
                  name="customerName"
                  value={formValues.customerName}
                  onChange={handleChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">Age *</label>
                <input
                  required
                  type="number"
                  name="age"
                  min={0}
                  value={formValues.age}
                  onChange={handleChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">Aadhaar Number *</label>
                <input
                  required
                  name="aadhaarNumber"
                  value={formValues.aadhaarNumber}
                  onChange={handleChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">Vehicle Number</label>
                <input
                  name="vehicleNumber"
                  value={formValues.vehicleNumber}
                  onChange={handleChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-600 text-foreground mb-1.5">Address *</label>
                <textarea
                  required
                  name="address"
                  rows={3}
                  value={formValues.address}
                  onChange={handleChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-600 text-foreground mb-1.5">Date & Time *</label>
                <input
                  required
                  type="datetime-local"
                  name="checkInDateTime"
                  value={formValues.checkInDateTime}
                  onChange={handleChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="md:col-span-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  className="btn-outline px-5 py-3 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary px-5 py-3 rounded-xl text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Guest' : 'Create Guest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
