'use client';

import React from 'react';

interface UpgradeRequiredModalProps {
  open: boolean;
  currentUsage: number;
  recordLimit: number;
  suggestions?: number[];
  onUpgrade: () => void;
  onClose: () => void;
}

export default function UpgradeRequiredModal({
  open,
  currentUsage,
  recordLimit,
  suggestions = [100, 250, 500],
  onUpgrade,
  onClose,
}: UpgradeRequiredModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[28px] border border-border bg-white shadow-card">
        <div className="border-b border-border px-6 py-5">
          <p className="text-xs font-700 uppercase tracking-[0.22em] text-primary">
            Record limit reached
          </p>
          <h2 className="mt-1 text-xl font-700 text-foreground">
            Upgrade your record capacity
          </h2>
        </div>

        <div className="space-y-5 px-6 py-6">
          <p className="text-sm text-muted-foreground">
            You have used all available records in your current subscription. Upgrade your record
            capacity to continue adding more.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Current usage</p>
              <p className="mt-2 text-2xl font-700 text-foreground">{currentUsage}</p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Current limit</p>
              <p className="mt-2 text-2xl font-700 text-foreground">{recordLimit}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-700 uppercase tracking-[0.18em] text-muted-foreground">
              Suggested upgrades
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions
                .filter((value) => value > recordLimit)
                .map((value) => (
                  <span
                    key={value}
                    className="rounded-full border border-border bg-white px-3 py-1.5 text-sm font-600 text-foreground"
                  >
                    {value} records
                  </span>
                ))}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn-outline rounded-xl px-4 py-2.5 text-sm">
              Cancel
            </button>
            <button type="button" onClick={onUpgrade} className="btn-outline rounded-xl px-4 py-2.5 text-sm">
              Contact Sales
            </button>
            <button type="button" onClick={onUpgrade} className="btn-primary rounded-xl px-4 py-2.5 text-sm">
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
