'use client';

import React from 'react';
import { Plan } from '@/types';
import { ArrowUpRight, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface PlanUsageCardProps {
  plan: Plan | undefined;
  recordsUsed: number;
  recordLimit: number | null;
  usagePct: number;
}

export default function PlanUsageCard({ plan, recordsUsed, recordLimit, usagePct }: PlanUsageCardProps) {
  const isNearLimit = usagePct >= 80;
  const isAtLimit = usagePct >= 100;

  const barColor = isAtLimit
    ? 'var(--danger)'
    : isNearLimit
    ? 'var(--warning)'
    : 'var(--primary)';

  return (
    <div className={`glass-card rounded-2xl border p-5 ${isNearLimit ? 'border-warning/40' : 'border-border'}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-700 text-foreground">Plan Usage</h3>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">{plan?.name ?? 'Basic'} Plan</p>
        </div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${plan?.color ?? '#2563EB'}18` }}
        >
          <Zap size={16} style={{ color: plan?.color ?? '#2563EB' }} />
        </div>
      </div>

      {/* Usage bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">Records used</span>
          <span className="text-xs font-700 text-foreground font-tabular">
            {recordsUsed} / {recordLimit ?? '∞'}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(usagePct, 100)}%`, backgroundColor: barColor }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-2xs text-muted-foreground">{usagePct}% used</span>
          {recordLimit && (
            <span className="text-2xs text-muted-foreground">{Math.max(0, recordLimit - recordsUsed)} remaining</span>
          )}
        </div>
      </div>

      {/* Features included */}
      {plan && (
        <div className="space-y-1.5 mb-4">
          {plan.features.slice(0, 3).map((feature) => (
            <div key={`usage-feat-${feature}`} className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-muted-foreground/50 flex-shrink-0" />
              <span className="text-2xs text-muted-foreground">{feature}</span>
            </div>
          ))}
        </div>
      )}

      {/* Upgrade CTA */}
      {recordLimit && (
        <button
          onClick={() => toast.info('Redirecting to plan upgrade...')}
          className={`w-full py-2.5 rounded-xl text-xs font-600 flex items-center justify-center gap-1.5 transition-all ${
            isNearLimit ? 'btn-primary' : 'btn-outline'
          }`}
        >
          <ArrowUpRight size={13} />
          {isAtLimit ? 'Upgrade Now — Limit Reached' : isNearLimit ? 'Upgrade Before Limit' : 'Upgrade Plan'}
        </button>
      )}
    </div>
  );
}