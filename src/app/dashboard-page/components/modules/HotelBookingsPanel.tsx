'use client';

import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { AuthUser, HotelBookingRecord } from '@/types';
import {
  addHotelBooking,
  deleteHotelBooking,
  getHotelBookings,
  updateHotelBooking,
} from '@/services/hotelService';
import { handleAppError } from '@/utils/appErrorHandler';

const defaultBookingForm: Omit<HotelBookingRecord, 'id'> = {
  bookingId: '',
  guestName: '',
  roomNumber: '',
  checkInDate: new Date().toISOString().slice(0, 10),
  checkOutDate: new Date().toISOString().slice(0, 10),
  amount: 0,
  status: 'confirmed',
  notes: '',
  createdAt: undefined,
};

const bookingStatuses = ['confirmed', 'checked-in', 'checked-out', 'cancelled'];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string) {
  return value ? new Date(value).toLocaleDateString('en-IN') : '—';
}

export default function HotelBookingsPanel({ user }: { user: AuthUser }) {
  const [bookings, setBookings] = useState<HotelBookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Omit<HotelBookingRecord, 'id'>>(defaultBookingForm);
  const [submitting, setSubmitting] = useState(false);

  const debouncedSearchTerm = useDeferredValue(searchInput);

  useEffect(() => {
    let active = true;
    setLoading(true);

    async function loadBookings() {
      try {
        const data = await getHotelBookings(user.id);
        if (!active) return;
        setBookings(data.sort((a, b) => a.checkInDate.localeCompare(b.checkInDate)));
      } catch (error) {
        if (!active) return;
        handleAppError(error, 'Unable to load bookings.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBookings();
    return () => {
      active = false;
    };
  }, [user.id]);

  const filteredBookings = useMemo(() => {
    const query = debouncedSearchTerm.trim().toLowerCase();
    if (!query) return bookings;

    return bookings.filter((booking) =>
      [booking.guestName, booking.roomNumber, booking.status, booking.notes]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [debouncedSearchTerm, bookings]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / rowsPerPage));
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredBookings.slice(startIndex, startIndex + rowsPerPage);
  }, [currentPage, filteredBookings, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const openForm = useCallback((booking?: HotelBookingRecord) => {
    if (booking) {
      setEditingId(booking.id);
      setFormValues({
        bookingId: booking.bookingId,
        guestName: booking.guestName,
        roomNumber: booking.roomNumber,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        amount: booking.amount,
        status: booking.status,
        notes: booking.notes ?? '',
        createdAt: booking.createdAt,
      });
    } else {
      setEditingId(null);
      setFormValues(defaultBookingForm);
    }
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setEditingId(null);
    setFormValues(defaultBookingForm);
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
    []
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmitting(true);

      try {
        if (editingId) {
          await updateHotelBooking(user.id, editingId, formValues);
          setBookings((current) =>
            current.map((booking) =>
              booking.id === editingId ? { ...booking, ...formValues } : booking
            )
          );
          toast.success('Booking updated successfully.');
        } else {
          const newId = await addHotelBooking(user.id, formValues);
          setBookings((current) => [{ id: newId, ...formValues }, ...current]);
          toast.success('Booking created successfully.');
        }
        closeForm();
      } catch (error) {
        handleAppError(error, 'Unable to save booking.');
      } finally {
        setSubmitting(false);
      }
    },
    [closeForm, editingId, formValues, user.id]
  );

  const handleDelete = useCallback(
    async (bookingId: string) => {
      const confirmed = window.confirm('Delete this booking permanently?');
      if (!confirmed) return;

      try {
        await deleteHotelBooking(user.id, bookingId);
        setBookings((current) => current.filter((booking) => booking.id !== bookingId));
        toast.success('Booking deleted successfully.');
      } catch (error) {
        handleAppError(error, 'Unable to delete this booking.');
      }
    },
    [user.id]
  );

  const stats = useMemo(
    () => ({
      total: bookings.length,
      confirmed: bookings.filter((booking) => booking.status === 'confirmed').length,
      checkedIn: bookings.filter((booking) => booking.status === 'checked-in').length,
      cancelled: bookings.filter((booking) => booking.status === 'cancelled').length,
    }),
    [bookings]
  );

  return (
    <div className="max-w-screen-2xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-700 tracking-[0.24em] text-primary uppercase">Bookings</p>
          <h1 className="text-2xl font-700 text-foreground mt-1">Bookings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create, update, and track guest reservations across rooms and dates.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openForm()}
          className="btn-primary inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
        >
          <Plus size={16} />
          Add Booking
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass-card rounded-2xl border border-border p-5">
          <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">
            Total Bookings
          </p>
          <p className="text-2xl font-700 text-foreground mt-2">{stats.total}</p>
        </div>
        <div className="glass-card rounded-2xl border border-border p-5">
          <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">
            Confirmed
          </p>
          <p className="text-2xl font-700 text-foreground mt-2">{stats.confirmed}</p>
        </div>
        <div className="glass-card rounded-2xl border border-border p-5">
          <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">
            Checked In
          </p>
          <p className="text-2xl font-700 text-foreground mt-2">{stats.checkedIn}</p>
        </div>
        <div className="glass-card rounded-2xl border border-border p-5">
          <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">
            Cancelled
          </p>
          <p className="text-2xl font-700 text-foreground mt-2">{stats.cancelled}</p>
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
              placeholder="Search bookings by guest, room, or status"
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
          <div className="p-16 text-center text-muted-foreground">Loading bookings...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm font-600 text-foreground">No bookings found.</p>
            <p className="text-xs text-muted-foreground mt-1">Add a booking to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/80 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-4">Guest</th>
                  <th className="px-5 py-4">Room</th>
                  <th className="px-5 py-4">Check-In</th>
                  <th className="px-5 py-4">Check-Out</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {paginatedBookings.map((booking) => (
                  <tr key={booking.id} className="group hover:bg-primary/5">
                    <td className="px-5 py-4 font-600 text-foreground">{booking.guestName}</td>
                    <td className="px-5 py-4 text-muted-foreground">{booking.roomNumber || '—'}</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDate(booking.checkInDate)}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDate(booking.checkOutDate)}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatCurrency(booking.amount)}
                    </td>
                    <td className="px-5 py-4 text-sm font-600 capitalize text-foreground">
                      {booking.status}
                    </td>
                    <td className="px-5 py-4 space-x-2">
                      <button
                        type="button"
                        onClick={() => openForm(booking)}
                        className="btn-outline px-3 py-2 rounded-xl text-xs"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(booking.id)}
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

        {!loading && filteredBookings.length > 0 && (
          <div className="px-5 py-4 border-t border-border bg-white/80 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * rowsPerPage + 1}-
              {Math.min(currentPage * rowsPerPage, filteredBookings.length)} of{' '}
              {filteredBookings.length}
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
                <p className="text-sm text-muted-foreground">
                  {editingId ? 'Edit' : 'New'} booking
                </p>
                <h2 className="text-2xl font-700 text-foreground mt-1">
                  {editingId ? 'Update' : 'Create'} booking
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
                <label className="block text-sm font-600 text-foreground mb-1.5">Guest Name</label>
                <input
                  required
                  name="guestName"
                  value={formValues.guestName}
                  onChange={handleChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">Room Number</label>
                <input
                  name="roomNumber"
                  value={formValues.roomNumber}
                  onChange={handleChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

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

              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">Status</label>
                <select
                  name="status"
                  value={formValues.status}
                  onChange={handleChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {bookingStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">Check-In</label>
                <input
                  required
                  type="date"
                  name="checkInDate"
                  value={formValues.checkInDate}
                  onChange={handleChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">Check-Out</label>
                <input
                  required
                  type="date"
                  name="checkOutDate"
                  value={formValues.checkOutDate}
                  onChange={handleChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
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
                  {submitting ? 'Saving...' : editingId ? 'Update Booking' : 'Create Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
