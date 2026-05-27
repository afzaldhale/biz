'use client';

import React, { useState } from 'react';
import { Business } from '@/lib/mockData';
import { X, CreditCard, TrendingUp } from 'lucide-react';
import { calculateMonthlyPrice } from '@/utils/subscription';
import { formatINR } from '@/utils/pricing';

interface BusinessPlanModalProps {
  business: Business;
  canManageSubscription: boolean;
  loading: boolean;
  onConfirm: (newLimit: number) => void;
  onClose: () => void;
}

const LIMIT_OPTIONS = [50, 100, 250, 500, 1000];

export default function BusinessPlanModal({
  business,
  canManageSubscription,
  loading,
  onConfirm,
  onClose,
}: BusinessPlanModalProps) {
  const currentLimit = business.recordLimit ?? business.usageLimit ?? 50;
  const [selected, setSelected] = useState<number>(currentLimit);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card shadow-card-lg">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2">
              <CreditCard size={16} className="text-primary" />
            </div>
            <div>
              <h3 className="text-base font-700 text-foreground">Update Record Limit</h3>
              <p className="text-xs text-muted-foreground">{business.businessName}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-muted">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="p-6">
          {!canManageSubscription && (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Only super admins can manually edit subscription limits.
            </div>
          )}

          <div className="mb-5 rounded-xl bg-muted/40 p-3">
            <span className="text-xs text-muted-foreground">Current capacity:</span>
            <span className="ml-2 text-sm font-700 text-foreground">{currentLimit} records</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {LIMIT_OPTIONS.map((option) => (
              <label
                key={option}
                className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                  selected === option
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border hover:bg-muted/30'
                }`}
              >
                <input
                  type="radio"
                  name="record-limit"
                  checked={selected === option}
                  onChange={() => setSelected(option)}
                  className="sr-only"
                />
                <p className="text-base font-800 text-foreground">{option} records</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatINR(calculateMonthlyPrice(option))}/mo
                </p>
              </label>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
            <div className="flex items-start gap-3">
              <TrendingUp size={15} className="mt-0.5 text-emerald-600" />
              <div>
                <p className="text-xs font-700 text-emerald-700">Upgrade summary</p>
                <p className="text-[11px] text-emerald-600">
                  Next monthly price: {formatINR(calculateMonthlyPrice(selected))}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl bg-muted py-2.5 text-sm font-600 text-foreground transition-colors hover:bg-muted/80 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(selected)}
              disabled={loading || !canManageSubscription || selected < (business.currentUsage ?? business.usageCount)}
              className="btn-primary flex-1 rounded-xl py-2.5 text-sm font-700 disabled:opacity-60"
            >
              {loading ? 'Updating...' : 'Save Limit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
