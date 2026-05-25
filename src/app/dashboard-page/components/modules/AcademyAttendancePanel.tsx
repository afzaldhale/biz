'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CalendarCheck2, Check, MinusCircle, Search } from 'lucide-react';
import {
  AcademyAttendance,
  AcademyAttendanceStatus,
  AcademyCourse,
  AcademyEnrollment,
  AuthUser,
} from '@/types';
import {
  getAcademyAttendance,
  markAcademyAttendance,
} from '@/services/academyAttendanceService';
import { getAcademyCourses } from '@/services/academyCourseService';
import { getCourseEnrollments } from '@/services/academyEnrollmentService';
import RetryState from '@/components/ui/RetryState';
import { useSlowLoading } from '@/hooks/useSlowLoading';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

interface AcademyAttendancePanelProps {
  user: AuthUser;
  onNavigate: (navId: string) => void;
}

interface AttendanceDraft {
  studentId: string;
  studentName: string;
  status: AcademyAttendanceStatus;
  remarks: string;
}

const statusOptions: Array<{
  value: AcademyAttendanceStatus;
  label: string;
  className: string;
}> = [
  { value: 'present', label: 'Present', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'absent', label: 'Absent', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: 'late', label: 'Late', className: 'bg-amber-50 text-amber-700 border-amber-200' },
];

export default function AcademyAttendancePanel({ user }: AcademyAttendancePanelProps) {
  const { isOffline } = useNetworkStatus();
  const [courses, setCourses] = useState<AcademyCourse[]>([]);
  const [attendance, setAttendance] = useState<AcademyAttendance[]>([]);
  const [roster, setRoster] = useState<AcademyEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AcademyAttendanceStatus>('all');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [drafts, setDrafts] = useState<Record<string, AttendanceDraft>>({});
  const [highlightStudentId, setHighlightStudentId] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const debouncedSearch = useDebouncedValue(search, 250);
  const { showSlowMessage, showRetry } = useSlowLoading(loading);

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.allSettled([getAcademyCourses(user.id), getAcademyAttendance(user.id)])
      .then(([courseResult, attendanceResult]) => {
        if (!active) return;

        if (courseResult.status === 'fulfilled') {
          setCourses(courseResult.value.filter((course) => course.status === 'active'));
        } else {
          console.error('[academy-attendance] unable to load courses', courseResult.reason);
          setCourses([]);
        }

        if (attendanceResult.status === 'fulfilled') {
          setAttendance(attendanceResult.value);
        } else {
          console.error('[academy-attendance] unable to load attendance', attendanceResult.reason);
          setAttendance([]);
          toast.error('Unable to load attendance right now.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retryKey, user.id]);

  useEffect(() => {
    const selectedStudentId = window.sessionStorage.getItem('academy:selectedStudentId');
    if (!selectedStudentId) return;
    setHighlightStudentId(selectedStudentId);
    window.sessionStorage.removeItem('academy:selectedStudentId');
  }, []);

  useEffect(() => {
    if (!selectedCourseId) {
      setRoster([]);
      setDrafts({});
      return;
    }

    getCourseEnrollments(user.id, selectedCourseId)
      .then((data) => {
        const activeEnrollments = data.filter((item) => item.status === 'active');
        setRoster(activeEnrollments);
        setDrafts((current) => {
          const nextDrafts: Record<string, AttendanceDraft> = {};
          activeEnrollments.forEach((enrollment) => {
            nextDrafts[enrollment.studentId] =
              current[enrollment.studentId] ?? {
                studentId: enrollment.studentId,
                studentName: enrollment.studentName,
                status: 'present',
                remarks: '',
              };
          });
          return nextDrafts;
        });
      })
      .catch(() => {
        toast.error('Unable to load students for this course.');
      });
  }, [selectedCourseId, user.id]);

  const filteredAttendance = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return attendance.filter((record) => {
      const matchesCourse = !selectedCourseId || record.courseId === selectedCourseId;
      const matchesDate = !selectedDate || record.attendanceDate === selectedDate;
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      const matchesQuery =
        query.length === 0 ||
        [record.studentName, record.courseName, record.status, record.remarks]
          .join(' ')
          .toLowerCase()
          .includes(query);
      return matchesCourse && matchesDate && matchesStatus && matchesQuery;
    });
  }, [attendance, debouncedSearch, selectedCourseId, selectedDate, statusFilter]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.courseId === selectedCourseId) ?? null,
    [courses, selectedCourseId]
  );

  const handleDraftStatus = useCallback(
    (studentId: string, status: AcademyAttendanceStatus) => {
      setDrafts((current) => ({
        ...current,
        [studentId]: {
          ...current[studentId],
          status,
        },
      }));
    },
    []
  );

  const handleDraftRemarks = useCallback((studentId: string, remarks: string) => {
    setDrafts((current) => ({
      ...current,
      [studentId]: {
        ...current[studentId],
        remarks,
      },
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedCourse) {
      toast.error('Course required.');
      return;
    }
    if (isOffline) {
      toast.error('You are offline. Reconnect to save attendance.');
      return;
    }
    if (!selectedDate) {
      toast.error('Date required.');
      return;
    }

    const records = Object.values(drafts).map((draft) => ({
      student: {
        studentId: draft.studentId,
        studentName: draft.studentName,
      },
      status: draft.status,
      remarks: draft.remarks.trim(),
    }));

    if (records.length === 0) {
      toast.error('Select at least one student.');
      return;
    }

    setSaving(true);
    try {
      const createdIds = await markAcademyAttendance(user.id, {
        courseId: selectedCourse.courseId,
        courseName: selectedCourse.courseName,
        attendanceDate: selectedDate,
        markedBy: user.ownerName,
        records,
      });

      const nextAttendance = await getAcademyAttendance(user.id);
      setAttendance(nextAttendance);
      if (createdIds.length === 0) {
        toast.info('Attendance was already marked for these students on this date.');
      } else {
        toast.success('Attendance saved successfully.');
      }
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Unable to save attendance.');
    } finally {
      setSaving(false);
    }
  }, [drafts, isOffline, selectedCourse, selectedDate, user.id, user.ownerName]);

  return (
    <div className="max-w-screen-2xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-700 uppercase tracking-[0.24em] text-primary">
          Academy Attendance
        </p>
        <h1 className="mt-1 text-2xl font-700 text-foreground">Attendance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mark student attendance by course and review attendance history.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-card rounded-2xl border border-border p-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_220px_auto]">
            <select
              value={selectedCourseId}
              onChange={(event) => setSelectedCourseId(event.target.value)}
              className="rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.courseId}>
                  {course.courseName}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || isOffline || !selectedCourseId}
              className="btn-primary rounded-xl px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : isOffline ? 'Offline' : 'Save Attendance'}
            </button>
          </div>

          <div className="mt-5">
            {!selectedCourseId ? (
              <div className="rounded-2xl border border-dashed border-border px-5 py-12 text-center">
                <p className="text-sm font-600 text-foreground">
                  No attendance marked yet. Select a course and date to begin.
                </p>
              </div>
            ) : roster.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-5 py-12 text-center">
                <p className="text-sm font-600 text-foreground">
                  No active enrollments found for this course.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {roster.map((enrollment) => {
                  const draft = drafts[enrollment.studentId];
                  const isHighlighted = highlightStudentId === enrollment.studentId;
                  return (
                    <div
                      key={enrollment.id}
                      className={`rounded-2xl border p-4 transition ${
                        isHighlighted
                          ? 'border-primary bg-indigo-50/60'
                          : 'border-border bg-white'
                      }`}
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-sm font-700 text-foreground">
                            {enrollment.studentName}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Enrolled on {enrollment.enrollmentDate}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {statusOptions.map((option) => {
                            const active = draft?.status === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleDraftStatus(enrollment.studentId, option.value)}
                                className={`rounded-full border px-4 py-2 text-xs font-600 transition ${
                                  active
                                    ? option.className
                                    : 'border-border bg-white text-muted-foreground'
                                }`}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <textarea
                        rows={2}
                        value={draft?.remarks ?? ''}
                        onChange={(event) =>
                          handleDraftRemarks(enrollment.studentId, event.target.value)
                        }
                        placeholder="Optional remarks"
                        className="mt-4 w-full resize-none rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="glass-card rounded-2xl border border-border overflow-hidden">
          <div className="grid gap-4 border-b border-border p-5">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by student, course, status, or remark"
                className="w-full rounded-xl border border-border bg-input py-3 pl-11 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <select
                value={selectedCourseId}
                onChange={(event) => setSelectedCourseId(event.target.value)}
                className="rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.courseId}>
                    {course.courseName}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as 'all' | AcademyAttendanceStatus)
                }
                className="rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All statuses</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
              </select>
            </div>
          </div>

          {loading ? (
            showRetry ? (
              <div className="p-5">
                <RetryState onRetry={() => setRetryKey((current) => current + 1)} />
              </div>
            ) : (
              <div className="p-16 text-center text-muted-foreground">
                {showSlowMessage ? 'Network is slow. Trying to load your workspace.' : 'Loading attendance...'}
              </div>
            )
          ) : filteredAttendance.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <p className="text-sm font-600 text-foreground">
                No attendance marked yet. Select a course and date to begin.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/80 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Student</th>
                    <th className="px-5 py-4">Course</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {filteredAttendance.map((record) => (
                    <tr key={record.id}>
                      <td className="px-5 py-4 text-muted-foreground">
                        {record.attendanceDate}
                      </td>
                      <td className="px-5 py-4 font-600 text-foreground">
                        {record.studentName}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{record.courseName}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-600 ${
                            record.status === 'present'
                              ? 'badge-success'
                              : record.status === 'late'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {record.remarks || 'No remarks'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white/80 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-primary">
              <CalendarCheck2 size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Present
              </p>
              <p className="mt-1 text-xl font-700 text-foreground">
                {filteredAttendance.filter((item) => item.status === 'present').length}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-white/80 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <MinusCircle size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Late</p>
              <p className="mt-1 text-xl font-700 text-foreground">
                {filteredAttendance.filter((item) => item.status === 'late').length}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-white/80 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
              <Check size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Absent
              </p>
              <p className="mt-1 text-xl font-700 text-foreground">
                {filteredAttendance.filter((item) => item.status === 'absent').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
