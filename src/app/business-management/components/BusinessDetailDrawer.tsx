'use client';

import React, { useEffect } from 'react';
import { Business, CAPACITY_LIMITS, CAPACITY_PRICES } from '@/lib/mockData';
import { StatusBadge } from '@/components/admin/AdminBadge';
import {
  X,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  CreditCard,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface BusinessDetailDrawerProps {
  business: Business;
  canManageSubscription: boolean;
  onClose: () => void;
  onChangeStatus: () => void;
  onChangePlan: () => void;
  onSyncUsage: () => void;
}

const INDUSTRY_LABELS: Record<string, string> = {
  restaurant: 'Restaurant',
  retail: 'Retail',
  education: 'Education',
  salon: 'Salon',
  gym: 'Gym / Wellness',
  healthcare: 'Healthcare',
  real_estate: 'Real Estate',
  logistics: 'Logistics',
  ecommerce: 'E-commerce',
  consulting: 'Consulting',
};

export default function BusinessDetailDrawer({
  business: biz,
  canManageSubscription,
  onClose,
  onChangeStatus,
  onChangePlan,
  onSyncUsage,
}: BusinessDetailDrawerProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const capacityLimit = biz.recordLimit ?? biz.usageLimit ?? CAPACITY_LIMITS[biz.capacityTier];
  const usageCount = biz.currentUsage ?? biz.usageCount;
  const usagePct = capacityLimit > 0 ? Math.round((usageCount / capacityLimit) * 100) : 0;
  const monthlyPriceDisplay = biz.monthlyPrice ?? CAPACITY_PRICES[biz.capacityTier];
  const businessItems: Array<{ label: string; value: string; icon: LucideIcon }> = [
    { label: 'Business Name', value: biz.businessName, icon: Building2 },
    { label: 'Industry', value: INDUSTRY_LABELS[biz.industry] ?? biz.industry, icon: Activity },
    { label: 'City', value: biz.city, icon: MapPin },
    { label: 'Registered', value: biz.createdAt, icon: Calendar },
    { label: 'Last Active', value: biz.lastActive, icon: Clock },
  ];
  const ownerItems: Array<{ label: string; value: string; icon: LucideIcon }> = [
    { label: 'Full Name', value: biz.ownerName, icon: User },
    { label: 'Email Address', value: biz.email, icon: Mail },
    { label: 'Phone Number', value: biz.phone, icon: Phone },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-foreground/15 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto border-l border-border bg-card shadow-card-lg sm:w-[480px]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-base font-800 text-white">
              {biz.businessName.charAt(0)}
            </div>
            <div>
              <h2 className="text-base font-800 leading-tight text-foreground">{biz.businessName}</h2>
              <p className="text-xs text-muted-foreground">{biz.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 transition-colors hover:bg-muted"
            aria-label="Close business detail panel"
          >
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={biz.status} />
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/8 px-2.5 py-1 text-[11px] font-700 text-primary">
              Record-based
            </span>
            {biz.emailVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-600 text-emerald-600">
                <CheckCircle2 size={11} />
                Email Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-600 text-red-500">
                <XCircle size={11} />
                Email Not Verified
              </span>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <button
              onClick={onChangeStatus}
              className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-sm font-600 text-amber-700 transition-colors hover:bg-amber-100"
            >
              <RefreshCw size={14} />
              Change Status
            </button>
            <button
              onClick={onChangePlan}
              disabled={!canManageSubscription}
              className="flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/8 py-2.5 text-sm font-600 text-primary transition-colors hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CreditCard size={14} />
              Change Capacity
            </button>
            <button
              onClick={onSyncUsage}
              className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-sm font-600 text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              <RefreshCw size={14} />
              Sync Usage
            </button>
          </div>

          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="border-b border-border bg-muted/40 px-4 py-3">
              <p className="flex items-center gap-2 text-xs font-700 uppercase tracking-wide text-muted-foreground">
                <Building2 size={13} />
                Business Profile
              </p>
            </div>
            <div className="space-y-3 p-4">
              {businessItems.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                    <item.icon size={13} className="text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-600 uppercase tracking-wide text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="text-sm font-600 text-foreground">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="border-b border-border bg-muted/40 px-4 py-3">
              <p className="flex items-center gap-2 text-xs font-700 uppercase tracking-wide text-muted-foreground">
                <User size={13} />
                Owner Information
              </p>
            </div>
            <div className="space-y-3 p-4">
              {ownerItems.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                    <item.icon size={13} className="text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-600 uppercase tracking-wide text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="truncate text-sm font-600 text-foreground">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="border-b border-border bg-muted/40 px-4 py-3">
              <p className="flex items-center gap-2 text-xs font-700 uppercase tracking-wide text-muted-foreground">
                <CreditCard size={13} />
                Subscription Details
              </p>
            </div>
            <div className="p-4">
              <div className="mb-4 grid grid-cols-2 gap-3">
                {[
                  ['Billing Model', 'Per-record subscription'],
                  ['Monthly Price', `₹${monthlyPriceDisplay.toLocaleString('en-IN')}/mo`],
                  ['Record Limit', capacityLimit === 9999 ? 'Unlimited' : capacityLimit.toLocaleString('en-IN')],
                  ['Current Usage', usageCount.toLocaleString('en-IN')],
                  ['Remaining', (biz.remainingRecords ?? Math.max(0, capacityLimit - usageCount)).toLocaleString('en-IN')],
                  ['Subscription Status', biz.subscriptionStatus ?? 'active'],
                  [
                    'Next Billing',
                    biz.nextBillingDate ? new Date(biz.nextBillingDate).toLocaleDateString('en-IN') : 'Not set',
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-muted/40 p-3">
                    <p className="mb-1 text-[10px] font-600 uppercase tracking-wide text-muted-foreground">
                      {label}
                    </p>
                    <p className="text-sm font-700 text-foreground">{value}</p>
                  </div>
                ))}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-600 text-foreground">Usage progress</p>
                  <span className={`text-xs font-700 ${usagePct >= 85 ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {usageCount} / {capacityLimit === 9999 ? '∞' : capacityLimit} ({usagePct}%)
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${usagePct >= 85 ? 'bg-red-400' : 'usage-bar-fill'}`}
                    style={{ width: `${Math.min(usagePct, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border p-4">
            <p className="mb-2 text-xs font-700 uppercase tracking-wide text-muted-foreground">
              Admin Note
            </p>
            <textarea
              placeholder="Add an internal note about this business (not visible to customer)..."
              className="w-full resize-none rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              rows={3}
            />
            <button className="mt-2 text-xs font-600 text-primary hover:underline">Save note</button>
          </div>
        </div>
      </div>
    </>
  );
}
