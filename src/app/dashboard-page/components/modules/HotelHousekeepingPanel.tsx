'use client';

import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { AuthUser, HotelHousekeepingRecord } from '@/types';
import {
  addHotelHousekeepingTask,
  deleteHotelHousekeepingTask,
  getHotelHousekeepingTasks,
  updateHotelHousekeepingTask,
} from '@/services/hotelService';
import { handleAppError } from '@/utils/appErrorHandler';

const defaultTaskForm: Omit<HotelHousekeepingRecord, 'id'> = {
  taskTitle: '',
  roomNumber: '',
  assignedTo: '',
  status: 'pending',
  scheduledDate: new Date().toISOString().slice(0, 10),
  notes: '',
  createdAt: undefined,
};

const taskStatuses = ['pending', 'in-progress', 'completed'];

function formatDate(value: string) {
  return value ? new Date(value).toLocaleDateString('en-IN') : '—';
}

export default function HotelHousekeepingPanel({ user }: { user: AuthUser }) {
  const [tasks, setTasks] = useState<HotelHousekeepingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Omit<HotelHousekeepingRecord, 'id'>>(defaultTaskForm);
  const [submitting, setSubmitting] = useState(false);

  const debouncedSearchTerm = useDeferredValue(searchInput);

  useEffect(() => {
    let active = true;
    setLoading(true);

    async function loadTasks() {
      try {
        const data = await getHotelHousekeepingTasks(user.id);
        if (!active) return;
        setTasks(data.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)));
      } catch (error) {
        if (!active) return;
        handleAppError(error, 'Unable to load housekeeping tasks.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTasks();
    return () => {
      active = false;
    };
  }, [user.id]);

  const filteredTasks = useMemo(() => {
    const query = debouncedSearchTerm.trim().toLowerCase();
    if (!query) return tasks;

    return tasks.filter((task) =>
      [task.taskTitle, task.roomNumber, task.assignedTo, task.status, task.notes]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [debouncedSearchTerm, tasks]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / rowsPerPage));
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredTasks.slice(startIndex, startIndex + rowsPerPage);
  }, [currentPage, filteredTasks, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const openForm = useCallback((task?: HotelHousekeepingRecord) => {
    if (task) {
      setEditingId(task.id);
      setFormValues({
        taskTitle: task.taskTitle,
        roomNumber: task.roomNumber,
        assignedTo: task.assignedTo,
        status: task.status,
        scheduledDate: task.scheduledDate,
        notes: task.notes ?? '',
        createdAt: task.createdAt,
      });
    } else {
      setEditingId(null);
      setFormValues(defaultTaskForm);
    }
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setEditingId(null);
    setFormValues(defaultTaskForm);
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
          await updateHotelHousekeepingTask(user.id, editingId, formValues);
          setTasks((current) =>
            current.map((task) => (task.id === editingId ? { ...task, ...formValues } : task))
          );
          toast.success('Housekeeping task updated successfully.');
        } else {
          const newId = await addHotelHousekeepingTask(user.id, formValues);
          setTasks((current) => [{ id: newId, ...formValues }, ...current]);
          toast.success('Housekeeping task created successfully.');
        }
        closeForm();
      } catch (error) {
        handleAppError(error, 'Unable to save housekeeping task.');
      } finally {
        setSubmitting(false);
      }
    },
    [closeForm, editingId, formValues, user.id]
  );

  const handleDelete = useCallback(
    async (taskId: string) => {
      const confirmed = window.confirm('Delete this task permanently?');
      if (!confirmed) return;

      try {
        await deleteHotelHousekeepingTask(user.id, taskId);
        setTasks((current) => current.filter((task) => task.id !== taskId));
        toast.success('Housekeeping task removed successfully.');
      } catch (error) {
        handleAppError(error, 'Unable to delete this task.');
      }
    },
    [user.id]
  );

  const stats = useMemo(
    () => ({
      total: tasks.length,
      pending: tasks.filter((task) => task.status === 'pending').length,
      inProgress: tasks.filter((task) => task.status === 'in-progress').length,
      completed: tasks.filter((task) => task.status === 'completed').length,
    }),
    [tasks]
  );

  return (
    <div className="max-w-screen-2xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-700 tracking-[0.24em] text-primary uppercase">Housekeeping</p>
          <h1 className="text-2xl font-700 text-foreground mt-1">Housekeeping</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track room cleaning, maintenance, and assignment tasks for your operations team.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openForm()}
          className="btn-primary inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
        >
          <Plus size={16} />
          Add Task
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass-card rounded-2xl border border-border p-5">
          <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">Total Tasks</p>
          <p className="text-2xl font-700 text-foreground mt-2">{stats.total}</p>
        </div>
        <div className="glass-card rounded-2xl border border-border p-5">
          <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">Pending</p>
          <p className="text-2xl font-700 text-foreground mt-2">{stats.pending}</p>
        </div>
        <div className="glass-card rounded-2xl border border-border p-5">
          <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">In Progress</p>
          <p className="text-2xl font-700 text-foreground mt-2">{stats.inProgress}</p>
        </div>
        <div className="glass-card rounded-2xl border border-border p-5">
          <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">Completed</p>
          <p className="text-2xl font-700 text-foreground mt-2">{stats.completed}</p>
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
              placeholder="Search tasks by room, status, or assignee"
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
          <div className="p-16 text-center text-muted-foreground">Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm font-600 text-foreground">No housekeeping tasks found.</p>
            <p className="text-xs text-muted-foreground mt-1">Create a task to keep the team aligned.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/80 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-4">Task</th>
                  <th className="px-5 py-4">Room</th>
                  <th className="px-5 py-4">Assigned To</th>
                  <th className="px-5 py-4">Schedule</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {paginatedTasks.map((task) => (
                  <tr key={task.id} className="group hover:bg-primary/5">
                    <td className="px-5 py-4 font-600 text-foreground">{task.taskTitle}</td>
                    <td className="px-5 py-4 text-muted-foreground">{task.roomNumber || '—'}</td>
                    <td className="px-5 py-4 text-muted-foreground">{task.assignedTo || 'Unassigned'}</td>
                    <td className="px-5 py-4 text-muted-foreground">{formatDate(task.scheduledDate)}</td>
                    <td className="px-5 py-4 text-sm font-600 capitalize text-foreground">{task.status}</td>
                    <td className="px-5 py-4 space-x-2">
                      <button
                        type="button"
                        onClick={() => openForm(task)}
                        className="btn-outline px-3 py-2 rounded-xl text-xs"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(task.id)}
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

        {!loading && filteredTasks.length > 0 && (
          <div className="px-5 py-4 border-t border-border bg-white/80 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * rowsPerPage + 1}-
              {Math.min(currentPage * rowsPerPage, filteredTasks.length)} of {filteredTasks.length}
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
                <p className="text-sm text-muted-foreground">{editingId ? 'Edit' : 'New'} task</p>
                <h2 className="text-2xl font-700 text-foreground mt-1">
                  {editingId ? 'Update' : 'Create'} housekeeping task
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
                <label className="block text-sm font-600 text-foreground mb-1.5">Task Title</label>
                <input
                  required
                  name="taskTitle"
                  value={formValues.taskTitle}
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
                <label className="block text-sm font-600 text-foreground mb-1.5">Assigned To</label>
                <input
                  name="assignedTo"
                  value={formValues.assignedTo}
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
                  {taskStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">Scheduled Date</label>
                <input
                  required
                  type="date"
                  name="scheduledDate"
                  value={formValues.scheduledDate}
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
                  {submitting ? 'Saving...' : editingId ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
