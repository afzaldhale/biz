'use client';

import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { AuthUser, HotelRoomRecord } from '@/types';
import {
  addHotelRoom,
  deleteHotelRoom,
  getHotelRooms,
  updateHotelRoom,
} from '@/services/hotelService';
import { handleAppError } from '@/utils/appErrorHandler';

const defaultRoomForm: Omit<HotelRoomRecord, 'id'> = {
  roomNumber: '',
  roomType: 'Standard',
  status: 'available',
  ratePerNight: 0,
  notes: '',
  createdAt: undefined,
};

const roomTypes = ['Standard', 'Deluxe', 'Suite', 'Family', 'Presidential'];
const roomStatuses = ['available', 'occupied', 'maintenance'];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function HotelRoomsPanel({ user }: { user: AuthUser }) {
  const [rooms, setRooms] = useState<HotelRoomRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Omit<HotelRoomRecord, 'id'>>(defaultRoomForm);
  const [submitting, setSubmitting] = useState(false);

  const debouncedSearchTerm = useDeferredValue(searchInput);

  useEffect(() => {
    let active = true;
    setLoading(true);

    async function loadRooms() {
      try {
        const data = await getHotelRooms(user.id);
        if (!active) return;
        setRooms(data.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber)));
      } catch (error) {
        if (!active) return;
        handleAppError(error, 'Unable to load rooms.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRooms();
    return () => {
      active = false;
    };
  }, [user.id]);

  const filteredRooms = useMemo(() => {
    const query = debouncedSearchTerm.trim().toLowerCase();
    if (!query) return rooms;
    return rooms.filter((room) =>
      [room.roomNumber, room.roomType, room.status, room.notes]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [debouncedSearchTerm, rooms]);

  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / rowsPerPage));
  const paginatedRooms = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredRooms.slice(startIndex, startIndex + rowsPerPage);
  }, [currentPage, filteredRooms, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const openForm = useCallback((room?: HotelRoomRecord) => {
    if (room) {
      setEditingId(room.id);
      setFormValues({
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        status: room.status,
        ratePerNight: room.ratePerNight,
        notes: room.notes ?? '',
        createdAt: room.createdAt,
      });
    } else {
      setEditingId(null);
      setFormValues(defaultRoomForm);
    }
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setEditingId(null);
    setFormValues(defaultRoomForm);
    setFormOpen(false);
  }, []);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = event.target;
      setFormValues((current) => ({
        ...current,
        [name]: name === 'ratePerNight' ? Number(value) : value,
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
          await updateHotelRoom(user.id, editingId, formValues);
          setRooms((current) =>
            current.map((room) => (room.id === editingId ? { ...room, ...formValues } : room))
          );
          toast.success('Room updated successfully.');
        } else {
          const newId = await addHotelRoom(user.id, formValues);
          setRooms((current) => [{ id: newId, ...formValues }, ...current]);
          toast.success('Room added successfully.');
        }
        closeForm();
      } catch (error) {
        handleAppError(error, 'Unable to save room information.');
      } finally {
        setSubmitting(false);
      }
    },
    [closeForm, editingId, formValues, user.id]
  );

  const handleDelete = useCallback(
    async (roomId: string) => {
      const confirmed = window.confirm('Delete this room permanently?');
      if (!confirmed) return;

      try {
        await deleteHotelRoom(user.id, roomId);
        setRooms((current) => current.filter((room) => room.id !== roomId));
        toast.success('Room removed successfully.');
      } catch (error) {
        handleAppError(error, 'Unable to delete this room.');
      }
    },
    [user.id]
  );

  const stats = useMemo(
    () => ({
      total: rooms.length,
      available: rooms.filter((room) => room.status === 'available').length,
      occupied: rooms.filter((room) => room.status === 'occupied').length,
      maintenance: rooms.filter((room) => room.status === 'maintenance').length,
    }),
    [rooms]
  );

  return (
    <div className="max-w-screen-2xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-700 tracking-[0.24em] text-primary uppercase">Rooms</p>
          <h1 className="text-2xl font-700 text-foreground mt-1">Rooms</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage room inventory, occupancy status, and nightly rates for your hotel.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openForm()}
          className="btn-primary inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
        >
          <Plus size={16} />
          Add Room
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass-card rounded-2xl border border-border p-5">
          <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">
            Total Rooms
          </p>
          <p className="text-2xl font-700 text-foreground mt-2">{stats.total}</p>
        </div>
        <div className="glass-card rounded-2xl border border-border p-5">
          <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">
            Available
          </p>
          <p className="text-2xl font-700 text-foreground mt-2">{stats.available}</p>
        </div>
        <div className="glass-card rounded-2xl border border-border p-5">
          <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">Occupied</p>
          <p className="text-2xl font-700 text-foreground mt-2">{stats.occupied}</p>
        </div>
        <div className="glass-card rounded-2xl border border-border p-5">
          <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">
            Maintenance
          </p>
          <p className="text-2xl font-700 text-foreground mt-2">{stats.maintenance}</p>
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
              placeholder="Search rooms by number, type, or status"
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
          <div className="p-16 text-center text-muted-foreground">Loading rooms...</div>
        ) : filteredRooms.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm font-600 text-foreground">No rooms found.</p>
            <p className="text-xs text-muted-foreground mt-1">Add a room to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/80 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-4">Room</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Rate</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {paginatedRooms.map((room) => (
                  <tr key={room.id} className="group hover:bg-primary/5">
                    <td className="px-5 py-4 font-600 text-foreground">{room.roomNumber}</td>
                    <td className="px-5 py-4 text-muted-foreground">{room.roomType}</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatCurrency(room.ratePerNight)}
                    </td>
                    <td className="px-5 py-4 text-sm font-600 capitalize text-foreground">
                      {room.status}
                    </td>
                    <td className="px-5 py-4 space-x-2">
                      <button
                        type="button"
                        onClick={() => openForm(room)}
                        className="btn-outline px-3 py-2 rounded-xl text-xs"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(room.id)}
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

        {!loading && filteredRooms.length > 0 && (
          <div className="px-5 py-4 border-t border-border bg-white/80 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * rowsPerPage + 1}-
              {Math.min(currentPage * rowsPerPage, filteredRooms.length)} of {filteredRooms.length}
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
                <p className="text-sm text-muted-foreground">{editingId ? 'Edit' : 'New'} room</p>
                <h2 className="text-2xl font-700 text-foreground mt-1">
                  {editingId ? 'Update' : 'Create'} room record
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
                <label className="block text-sm font-600 text-foreground mb-1.5">Room Number</label>
                <input
                  required
                  name="roomNumber"
                  value={formValues.roomNumber}
                  onChange={handleChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">Room Type</label>
                <select
                  name="roomType"
                  value={formValues.roomType}
                  onChange={handleChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {roomTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">Status</label>
                <select
                  name="status"
                  value={formValues.status}
                  onChange={handleChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {roomStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">
                  Rate per Night
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  name="ratePerNight"
                  value={formValues.ratePerNight}
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
                  {submitting ? 'Saving...' : editingId ? 'Update Room' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
