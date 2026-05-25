'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
}

function joinClasses(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={joinClasses(
        'relative overflow-hidden rounded-xl bg-slate-200/80',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite]',
        'before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)]',
        className
      )}
    />
  );
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="glass-card rounded-2xl border border-border p-5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-4 h-9 w-24" />
          <Skeleton className="mt-5 h-14 w-full rounded-2xl" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="border-b border-border p-5">
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
      <div className="p-5">
        <div className="space-y-4">
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
          </div>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="grid gap-4 border-t border-border pt-4"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: columns }).map((_, columnIndex) => (
                <Skeleton key={columnIndex} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index}>
          <Skeleton className="mb-2 h-4 w-28" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ))}
      <div className="md:col-span-2">
        <Skeleton className="mb-2 h-4 w-28" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function DashboardShellSkeletonBlock() {
  return (
    <div className="min-h-screen bg-muted/30 flex">
      <aside className="hidden lg:flex fixed top-0 left-0 h-full w-60 bg-white border-r border-border flex-col">
        <div className="h-14 border-b border-border px-4 flex items-center">
          <Skeleton className="h-7 w-32 rounded-lg" />
        </div>
        <div className="p-4 space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-4 w-20" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen lg:ml-60">
        <header className="h-14 bg-white border-b border-border px-4 md:px-6 flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <div className="flex items-center gap-3">
            <Skeleton className="hidden md:block h-9 w-52 rounded-xl" />
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6 xl:p-8">
          <div className="max-w-screen-2xl mx-auto space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-72" />
            </div>
            <CardSkeleton />
            <TableSkeleton rows={4} columns={3} />
          </div>
        </main>
      </div>
    </div>
  );
}
