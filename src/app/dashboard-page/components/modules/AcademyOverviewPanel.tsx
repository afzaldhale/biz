'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  IndianRupee,
  Receipt,
  Users,
} from 'lucide-react';
import { AuthUser } from '@/types';
import { getAcademyOverviewData } from '@/services/academyDashboardService';
import RetryState from '@/components/ui/RetryState';
import { CardSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { useSlowLoading } from '@/hooks/useSlowLoading';

interface AcademyOverviewPanelProps {
  user: AuthUser;
  onNavigate: (navId: string) => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AcademyOverviewPanel({ user, onNavigate }: AcademyOverviewPanelProps) {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof getAcademyOverviewData>> | null>(
    null
  );
  const [warning, setWarning] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const { showSlowMessage, showRetry } = useSlowLoading(loading);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setWarning(null);

    getAcademyOverviewData(user.id)
      .then((data) => {
        if (!active) return;
        setOverview(data);
        setWarning(data.warningMessage);
      })
      .catch((caught) => {
        if (!active) return;
        console.error('[academy-overview] unable to load dashboard', caught);
        setOverview({
          summary: {
            totalStudents: 0,
            activeCourses: 0,
            feesCollected: 0,
            pendingFees: 0,
            todayAttendanceCount: 0,
            todayPresentCount: 0,
            todayAbsentCount: 0,
            todayLateCount: 0,
          },
          recentStudents: [],
          recentPayments: [],
          todayAttendance: [],
          warningMessage: 'Dashboard insights are being prepared. Please try again shortly.',
        });
        setWarning('Dashboard insights are being prepared. Please try again shortly.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retryKey, user.id]);

  const cards = useMemo(() => {
    const summary = overview?.summary;
    return [
      {
        label: 'Total Students',
        value: summary?.totalStudents ?? 0,
        icon: Users,
        accent: 'bg-violet-50 text-violet-600',
      },
      {
        label: 'Active Courses',
        value: summary?.activeCourses ?? 0,
        icon: BookOpen,
        accent: 'bg-sky-50 text-sky-600',
      },
      {
        label: 'Fees Collected',
        value: formatCurrency(summary?.feesCollected ?? 0),
        icon: IndianRupee,
        accent: 'bg-emerald-50 text-emerald-600',
      },
      {
        label: 'Pending Fees',
        value: formatCurrency(summary?.pendingFees ?? 0),
        icon: Receipt,
        accent: 'bg-amber-50 text-amber-600',
      },
    ];
  }, [overview]);

  if (loading) {
    if (showRetry) {
      return <RetryState onRetry={() => setRetryKey((current) => current + 1)} />;
    }

    return (
      <div className="max-w-screen-2xl mx-auto space-y-6">
        {showSlowMessage && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Network is slow. Trying to load your workspace.
          </div>
        )}
        <CardSkeleton />
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <Skeleton className="h-80 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-700 uppercase tracking-[0.24em] text-primary">
            Academy Overview
          </p>
          <h1 className="mt-1 text-2xl font-700 text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Admissions, fee collection, and daily attendance for {user.businessName}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onNavigate('nav-students')}
            className="btn-outline rounded-xl px-4 py-2.5 text-sm"
          >
            Manage Students
          </button>
          <button
            type="button"
            onClick={() => onNavigate('nav-fees')}
            className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm"
          >
            Collect Fee
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {warning && (
        <div className="glass-card rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {warning}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="glass-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-700 uppercase tracking-wide text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-2 text-2xl font-700 text-foreground">{card.value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.accent}`}>
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="glass-card rounded-2xl border border-border p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-700 text-foreground">Recent Students</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Latest admissions added to your academy.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('nav-students')}
              className="text-xs font-600 text-primary"
            >
              View all
            </button>
          </div>

          {overview?.recentStudents.length ? (
            <div className="space-y-3">
              {overview.recentStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between rounded-2xl border border-border bg-white/75 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-600 text-foreground">{student.studentName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {student.admissionId} · {student.parentName}
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-600 text-muted-foreground">
                    {student.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border px-5 py-12 text-center">
              <p className="text-sm font-600 text-foreground">
                No students yet. Add your first student to start managing admissions.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="glass-card rounded-2xl border border-border p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                <CalendarDays size={20} />
              </div>
              <div>
                <p className="text-sm font-700 text-foreground">Today Attendance</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Present, absent, and late status for today.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-2xl bg-muted/60 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Present</p>
                <p className="mt-1 text-xl font-700 text-foreground">
                  {overview?.summary.todayPresentCount ?? 0}
                </p>
              </div>
              <div className="rounded-2xl bg-muted/60 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Absent</p>
                <p className="mt-1 text-xl font-700 text-foreground">
                  {overview?.summary.todayAbsentCount ?? 0}
                </p>
              </div>
              <div className="rounded-2xl bg-muted/60 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Late</p>
                <p className="mt-1 text-xl font-700 text-foreground">
                  {overview?.summary.todayLateCount ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-border p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-700 text-foreground">Recent Payments</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Latest receipts generated from fee collection.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('nav-receipts')}
                className="text-xs font-600 text-primary"
              >
                View all
              </button>
            </div>
            {overview?.recentPayments.length ? (
              <div className="space-y-3">
                {overview.recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-2xl border border-border bg-white/75 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-600 text-foreground">{payment.studentName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{payment.courseName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-700 text-foreground">
                        {formatCurrency(payment.paidAmount)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{payment.paymentDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border px-5 py-10 text-center">
                <p className="text-sm font-600 text-foreground">
                  No fee records yet. Add a payment to generate receipts.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
