'use client';

import React from 'react';
import { ArrowUpRight, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface PlanUsageCardProps {
  recordsUsed: number;
  recordLimit: number | null;
  usagePct: number;
}

export default function PlanUsageCard({
  recordsUsed,
  recordLimit,
  usagePct,
}: PlanUsageCardProps) {
  const isNearLimit = usagePct >= 80;
  const isAtLimit = usagePct >= 100;
  const barColor = isAtLimit ? 'var(--danger)' : isNearLimit ? 'var(--warning)' : 'var(--primary)';

  return (
    <div
      className={`glass-card rounded-2xl border p-5 ${isNearLimit ? 'border-warning/40' : 'border-border'}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-700 text-foreground">Record Usage</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Usage-based billing</p>
        </div>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: '#2563EB18' }}
        >
          <Zap size={16} style={{ color: '#2563EB' }} />
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Records used</span>
          <span className="font-tabular text-xs font-700 text-foreground">
            {recordsUsed} / {recordLimit ?? '∞'}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(usagePct, 100)}%`, backgroundColor: barColor }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-2xs text-muted-foreground">{usagePct}% used</span>
          {recordLimit && (
            <span className="text-2xs text-muted-foreground">
              {Math.max(0, recordLimit - recordsUsed)} remaining
            </span>
          )}
        </div>
      </div>

      {recordLimit && (
        <button
          onClick={() => toast.info('Open Subscription to increase record capacity.')}
          className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-600 transition-all ${
            isNearLimit ? 'btn-primary' : 'btn-outline'
          }`}
        >
          <ArrowUpRight size={13} />
          {isAtLimit
            ? 'Increase Capacity Now'
            : isNearLimit
              ? 'Increase Before Limit'
              : 'Increase Record Capacity'}
        </button>
      )}
    </div>
  );
}
