'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { handleAppError } from '@/utils/appErrorHandler';
import { BookOpen, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { AuthUser, AcademyCourse } from '@/types';
import {
  AcademyCourseInput,
  createAcademyCourse,
  deleteAcademyCourse,
  getAcademyCourses,
  getCourseEnrollmentCounts,
  updateAcademyCourse,
} from '@/services/academyCourseService';

interface AcademyCoursesPanelProps {
  user: AuthUser;
  onNavigate: (navId: string) => void;
}

const emptyCourse: AcademyCourseInput = {
  courseName: '',
  duration: '',
  fees: 0,
  description: '',
  status: 'active',
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AcademyCoursesPanel({ user }: AcademyCoursesPanelProps) {
  const [courses, setCourses] = useState<AcademyCourse[]>([]);
  const [enrollmentCounts, setEnrollmentCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AcademyCourse['status']>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<AcademyCourse | null>(null);
  const [form, setForm] = useState<AcademyCourseInput>(emptyCourse);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([getAcademyCourses(user.id), getCourseEnrollmentCounts(user.id)])
      .then(([courseData, counts]) => {
        if (!active) return;
        setCourses(courseData);
        setEnrollmentCounts(counts);
      })
      .catch(() => {
        if (!active) return;
        toast.error('Unable to load courses right now.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user.id]);

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
      const matchesQuery =
        query.length === 0 ||
        [course.courseName, course.duration, course.description]
          .join(' ')
          .toLowerCase()
          .includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [courses, search, statusFilter]);

  const openCreateModal = useCallback(() => {
    setEditingCourse(null);
    setForm(emptyCourse);
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((course: AcademyCourse) => {
    setEditingCourse(course);
    setForm({
      courseName: course.courseName,
      duration: course.duration,
      fees: course.fees,
      description: course.description,
      status: course.status,
    });
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setEditingCourse(null);
    setForm(emptyCourse);
    setIsModalOpen(false);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSaving(true);

      try {
        if (editingCourse) {
          await updateAcademyCourse(user.id, editingCourse.id, form);
          setCourses((current) =>
            current.map((course) =>
              course.id === editingCourse.id ? { ...course, ...form } : course
            )
          );
          toast.success('Course updated successfully.');
        } else {
          const courseId = await createAcademyCourse(user.id, form);
          setCourses((current) => [
            {
              id: courseId,
              courseId,
              ...form,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            ...current,
          ]);
          toast.success('Course created successfully.');
        }
        closeModal();
      } catch (caught) {
        handleAppError(caught, 'Unable to save course.');
      } finally {
        setSaving(false);
      }
    },
    [closeModal, editingCourse, form, user.id]
  );

  const handleDelete = useCallback(
    async (course: AcademyCourse) => {
      const enrolledCount = enrollmentCounts.get(course.courseId) ?? 0;
      if (enrolledCount > 0) {
        toast.error('This course has enrolled students. Mark inactive instead.');
        return;
      }

      const confirmed = window.confirm(`Delete ${course.courseName}?`);
      if (!confirmed) return;

      try {
        await deleteAcademyCourse(user.id, course.id);
        setCourses((current) => current.filter((item) => item.id !== course.id));
        toast.success('Course deleted successfully.');
      } catch {
        toast.error('Unable to delete course right now.');
      }
    },
    [enrollmentCounts, user.id]
  );

  return (
    <div className="max-w-screen-2xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-700 uppercase tracking-[0.24em] text-primary">
            Academy Courses
          </p>
          <h1 className="mt-1 text-2xl font-700 text-foreground">Courses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage active course offerings, fees, and enrollment availability.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm"
        >
          <Plus size={16} />
          Add Course
        </button>
      </div>

      <div className="glass-card rounded-2xl border border-border overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search courses by name, duration, or description"
              className="w-full rounded-xl border border-border bg-input py-3 pl-11 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as 'all' | AcademyCourse['status'])
            }
            className="rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {loading ? (
          <div className="p-16 text-center text-muted-foreground">Loading courses...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm font-600 text-foreground">
              No courses yet. Add your first course to start managing enrollments.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/80 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-4">Course Name</th>
                  <th className="px-5 py-4">Duration</th>
                  <th className="px-5 py-4">Fees</th>
                  <th className="px-5 py-4">Active Students</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {filteredCourses.map((course) => (
                  <tr key={course.id}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-primary">
                          <BookOpen size={18} />
                        </div>
                        <div>
                          <p className="font-600 text-foreground">{course.courseName}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {course.description || 'No description added'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{course.duration}</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatCurrency(course.fees)}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {enrollmentCounts.get(course.courseId) ?? 0}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-600 ${course.status === 'active' ? 'badge-success' : 'badge-neutral'}`}
                      >
                        {course.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(course)}
                          className="btn-outline rounded-xl px-3 py-2 text-xs"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(course)}
                          className="rounded-xl border border-danger/25 bg-danger/5 px-3 py-2 text-xs text-danger transition hover:bg-danger/10"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-[28px] border border-border bg-white shadow-card">
            <div className="border-b border-border px-6 py-5">
              <p className="text-xs font-700 uppercase tracking-[0.22em] text-primary">
                {editingCourse ? 'Edit Course' : 'New Course'}
              </p>
              <h2 className="mt-1 text-xl font-700 text-foreground">
                {editingCourse ? 'Update course details' : 'Create a course'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-4 p-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-600 text-foreground">Course Name</label>
                <input
                  required
                  value={form.courseName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, courseName: event.target.value }))
                  }
                  className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-600 text-foreground">Duration</label>
                <input
                  required
                  value={form.duration}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, duration: event.target.value }))
                  }
                  className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-600 text-foreground">Fees</label>
                <input
                  required
                  min="0"
                  type="number"
                  value={form.fees}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, fees: Number(event.target.value) }))
                  }
                  className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-600 text-foreground">Description</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                  className="w-full resize-none rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-600 text-foreground">Status</label>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as AcademyCourse['status'],
                    }))
                  }
                  className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
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
                  disabled={saving}
                  className="btn-primary rounded-xl px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingCourse ? 'Update Course' : 'Add Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
