'use client';

import React, { useState } from 'react';
import { Business, PlanType, PLAN_PRICES } from '@/lib/mockData';
import { PlanBadge } from '@/components/admin/AdminBadge';
import { X, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';

interface BusinessPlanModalProps {
  business: Business;
  loading: boolean;
  onConfirm: (newPlan: PlanType) => void;
  onClose: () => void;
}

const PLAN_OPTIONS: { value: PlanType; price: number; limit: number; features: string[] }[] = [
  {
    value: 'basic',
    price: 499,
    limit: 50,
    features: ['50 records', 'Basic reports', 'Email support'],
  },
  {
    value: 'medium',
    price: 999,
    limit: 150,
    features: ['150 records', 'Advanced reports', 'Priority email'],
  },
  {
    value: 'advance',
    price: 1499,
    limit: 250,
    features: ['250 records', 'Full analytics', 'Chat support'],
  },
  {
    value: 'premium',
    price: 1999,
    limit: 500,
    features: ['500 records', 'Custom reports', 'Phone support'],
  },
  {
    value: 'pro',
    price: 2999,
    limit: 1000,
    features: ['1,000 records', 'API access', 'Dedicated support'],
  },
  {
    value: 'custom',
    price: 4999,
    limit: 9999,
    features: ['Unlimited records', 'Custom features', 'Account manager'],
  },
];

const PLAN_ORDER: PlanType[] = ['basic', 'medium', 'advance', 'premium', 'pro', 'custom'];

export default function BusinessPlanModal({
  business,
  loading,
  onConfirm,
  onClose,
}: BusinessPlanModalProps) {
  const [selected, setSelected] = useState<PlanType>(business.plan);

  const currentIdx = PLAN_ORDER.indexOf(business.plan);
  const selectedIdx = PLAN_ORDER.indexOf(selected);
  const isUpgrade = selectedIdx > currentIdx;
  const isDowngrade = selectedIdx < currentIdx;
  const unchanged = selected === business.plan;

  const priceDiff = PLAN_PRICES[selected] - PLAN_PRICES[business.plan];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-card-lg w-full max-w-lg fade-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <CreditCard size={16} className="text-primary" />
            </div>
            <div>
              <h3 className="text-base font-700 text-foreground">Change Subscription Plan</h3>
              <p className="text-xs text-muted-foreground">{business.businessName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-5 p-3 bg-muted/40 rounded-xl">
            <span className="text-xs text-muted-foreground">Current plan:</span>
            <PlanBadge plan={business.plan} />
            <span className="text-xs text-muted-foreground ml-auto font-600">
              ₹{PLAN_PRICES[business.plan].toLocaleString('en-IN')}/mo
            </span>
          </div>

          {/* Plan options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
            {PLAN_OPTIONS.map((opt) => {
              const isSelected = selected === opt.value;
              const isCurrent = business.plan === opt.value;
              return (
                <label
                  key={`plan-modal-${opt.value}`}
                  className={`flex flex-col gap-2 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border hover:border-border/80 hover:bg-muted/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={opt.value}
                    checked={isSelected}
                    onChange={() => setSelected(opt.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between">
                    <PlanBadge plan={opt.value} />
                    {isCurrent && (
                      <span className="text-[10px] font-700 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Current
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-base font-800 text-foreground text-tabular">
                      ₹{opt.price.toLocaleString('en-IN')}
                      <span className="text-xs font-400 text-muted-foreground">/mo</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {opt.limit === 9999 ? 'Unlimited' : opt.limit.toLocaleString('en-IN')} records
                    </p>
                  </div>
                  <ul className="space-y-0.5">
                    {opt.features.map((f) => (
                      <li
                        key={`feat-${opt.value}-${f}`}
                        className="text-[11px] text-muted-foreground flex items-center gap-1.5"
                      >
                        <span className="w-1 h-1 rounded-full bg-primary/40 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </label>
              );
            })}
          </div>

          {/* Change summary */}
          {!unchanged && (
            <div
              className={`flex items-center gap-3 p-3.5 rounded-xl border mb-5 ${
                isUpgrade ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
              }`}
            >
              {isUpgrade ? (
                <TrendingUp size={15} className="text-emerald-600 flex-shrink-0" />
              ) : (
                <TrendingDown size={15} className="text-amber-600 flex-shrink-0" />
              )}
              <div>
                <p
                  className={`text-xs font-700 ${isUpgrade ? 'text-emerald-700' : 'text-amber-700'}`}
                >
                  {isUpgrade ? 'Plan Upgrade' : 'Plan Downgrade'}
                </p>
                <p className={`text-[11px] ${isUpgrade ? 'text-emerald-600' : 'text-amber-600'}`}>
                  Price change: {priceDiff > 0 ? '+' : ''}₹{priceDiff.toLocaleString('en-IN')}/mo (
                  {PLAN_PRICES[business.plan].toLocaleString('en-IN')} →{' '}
                  {PLAN_PRICES[selected].toLocaleString('en-IN')})
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 text-sm font-600 text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(selected)}
              disabled={loading || unchanged}
              className="flex-1 py-2.5 text-sm font-700 btn-primary rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                `Apply ${isUpgrade ? 'Upgrade' : isDowngrade ? 'Downgrade' : 'Change'}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
