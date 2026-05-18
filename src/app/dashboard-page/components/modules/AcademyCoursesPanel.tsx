'use client';

import React, { useCallback, useEffect, useMemo, useState, useDeferredValue } from 'react';
import { toast } from 'sonner';
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { AuthUser, CourseRecord } from '@/types';
import { addCourse, deleteCourse, getCourses, updateCourse } from '@/services/courseService';

interface AcademyCoursesPanelProps {
  user: AuthUser;
  onNavigate: (navId: string) => void;
}

const emptyCourse: Omit<CourseRecord, 'id'> = {
  title: '',
  instructor: '',
  category: '',
  duration: '',
  fee: 0,
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

export default function AcademyCoursesPanel({ user, onNavigate }: AcademyCoursesPanelProps) {
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Omit<CourseRecord, 'id'>>(emptyCourse);
  const [submitting, setSubmitting] = useState(false);

  const debouncedSearchTerm = useDebouncedValue(searchInput, 250);
  const deferredSearchTerm = useDeferredValue(debouncedSearchTerm);

  useEffect(() => {
    let active = true;
    setLoading(true);

    async function loadCourses() {
      try {
        const data = await getCourses(user.id);
        if (!active) return;
        setCourses(data as CourseRecord[]);
      } catch {
        if (!active) return;
        toast.error('Unable to load courses right now.');
        setCourses([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCourses();
    return () => {
      active = false;
    };
  }, [user.id]);

  const filteredCourses = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase();
    if (!query) return courses;
    return courses.filter((course) =>
      [course.title, course.category, course.instructor, course.duration, course.notes]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [courses, deferredSearchTerm]);

  const totals = useMemo(
    () => ({
      courses: courses.length,
      totalFee: courses.reduce((sum, course) => sum + (course.fee ?? 0), 0),
      categories: Array.from(new Set(courses.map((course) => course.category).filter(Boolean))),
    }),
    [courses]
  );

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / rowsPerPage));
  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredCourses.slice(startIndex, startIndex + rowsPerPage);
  }, [currentPage, filteredCourses, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchTerm, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const openForm = useCallback((course?: CourseRecord) => {
    if (course) {
      setEditingCourseId(course.id);
      setFormValues({
        title: course.title,
        category: course.category,
        instructor: course.instructor,
        duration: course.duration,
        fee: course.fee,
        notes: course.notes ?? '',
        createdAt: course.createdAt,
      });
    } else {
      setEditingCourseId(null);
      setFormValues(emptyCourse);
    }
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setEditingCourseId(null);
    setFormValues(emptyCourse);
    setFormOpen(false);
  }, []);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = event.target;
      setFormValues((current) => ({
        ...current,
        [name]: name === 'fee' ? Number(value) : value,
      }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmitting(true);

      const nextCourse: Omit<CourseRecord, 'id'> = {
        title: formValues.title.trim(),
        category: formValues.category.trim(),
        instructor: formValues.instructor.trim(),
        duration: formValues.duration.trim(),
        fee: formValues.fee,
        notes: formValues.notes?.trim() ?? '',
        createdAt: formValues.createdAt,
      };

      try {
        if (editingCourseId) {
          await updateCourse(user.id, editingCourseId, nextCourse);
          setCourses((current) =>
            current.map((course) =>
              course.id === editingCourseId ? { ...course, ...nextCourse } : course
            )
          );
          toast.success('Course updated successfully.');
        } else {
          const newId = await addCourse(user.id, nextCourse);
          setCourses((current) => [{ id: newId, ...nextCourse }, ...current]);
          toast.success('Course added successfully.');
        }
        closeForm();
      } catch {
        toast.error('Unable to save course right now. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [closeForm, editingCourseId, formValues, user.id]
  );

  const handleDelete = useCallback(
    async (courseId: string) => {
      const confirmed = window.confirm('Delete this course?');
      if (!confirmed) return;

      try {
        await deleteCourse(user.id, courseId);
        setCourses((current) => current.filter((course) => course.id !== courseId));
        toast.success('Course deleted successfully.');
      } catch {
        toast.error('Unable to delete course right now.');
      }
    },
    [user.id]
  );

  return (
    <div className="max-w-screen-2xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-700 tracking-[0.24em] text-primary uppercase">
            Academy Courses
          </p>
          <h1 className="text-2xl font-700 text-foreground mt-1">Courses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage course offerings, fees, and instructor details for your academy.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onNavigate('nav-students')}
            className="btn-outline px-4 py-2.5 rounded-xl text-sm"
          >
            Back to Students
          </button>
          <button
            type="button"
            onClick={() => openForm()}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
          >
            <Plus size={16} /> Add Course
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass-card rounded-2xl border border-border p-5">
          <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">
            Total Courses
          </p>
          <p className="text-2xl font-700 text-foreground mt-2">{totals.courses}</p>
        </div>
        <div className="glass-card rounded-2xl border border-border p-5">
          <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">
            Pending Offerings
          </p>
          <p className="text-2xl font-700 text-foreground mt-2">
            {courses.filter((course) => !course.duration).length}
          </p>
        </div>
        <div className="glass-card rounded-2xl border border-border p-5">
          <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">
            Average Fee
          </p>
          <p className="text-2xl font-700 text-foreground mt-2">
            {totals.courses ? formatCurrency(Math.round(totals.totalFee / totals.courses)) : '₹0'}
          </p>
        </div>
        <div className="glass-card rounded-2xl border border-border p-5">
          <p className="text-xs font-700 tracking-wide text-muted-foreground uppercase">
            Categories
          </p>
          <p className="text-2xl font-700 text-foreground mt-2">{totals.categories.length}</p>
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
              placeholder="Search courses by name, category, instructor, or duration"
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
          <div className="p-16 text-center text-muted-foreground">Loading courses...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm font-600 text-foreground">No courses found.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add a new course to build your curriculum.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/80 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-4">Course</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Instructor</th>
                  <th className="px-5 py-4">Duration</th>
                  <th className="px-5 py-4">Fee</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {paginatedCourses.map((course) => (
                  <tr key={course.id}>
                    <td className="px-5 py-4 font-600 text-foreground">{course.title}</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {course.category || 'General'}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{course.instructor || '—'}</td>
                    <td className="px-5 py-4 text-muted-foreground">{course.duration || 'TBD'}</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatCurrency(course.fee)}
                    </td>
                    <td className="px-5 py-4 space-x-2">
                      <button
                        type="button"
                        onClick={() => openForm(course)}
                        className="btn-outline px-3 py-2 rounded-xl text-xs"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(course.id)}
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

        {!loading && filteredCourses.length > 0 && (
          <div className="px-5 py-4 border-t border-border bg-white/80 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * rowsPerPage + 1}-
              {Math.min(currentPage * rowsPerPage, filteredCourses.length)} of{' '}
              {filteredCourses.length} courses
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
                  {editingCourseId ? 'Edit' : 'New'} Course
                </p>
                <h2 className="text-2xl font-700 text-foreground mt-1">
                  {editingCourseId ? 'Update' : 'Create'} course
                </h2>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-600 text-foreground mb-1.5">Course Name</label>
                <input
                  name="title"
                  required
                  value={formValues.title}
                  onChange={handleChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">Category</label>
                <input
                  name="category"
                  value={formValues.category}
                  onChange={handleChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">Instructor</label>
                <input
                  name="instructor"
                  value={formValues.instructor}
                  onChange={handleChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">Duration</label>
                <input
                  name="duration"
                  value={formValues.duration}
                  onChange={handleChange}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. 3 months / 5 weeks"
                />
              </div>
              <div>
                <label className="block text-sm font-600 text-foreground mb-1.5">Fee</label>
                <input
                  name="fee"
                  type="number"
                  min="0"
                  value={formValues.fee}
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
                  {submitting ? 'Saving...' : editingCourseId ? 'Update Course' : 'Add Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
