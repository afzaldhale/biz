'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { handleAppError } from '@/utils/appErrorHandler';
import { useBusiness } from '@/context/BusinessContext';
import { upgradeRecordLimit } from '@/services/subscriptionService';
import {
  formatSubscriptionDate,
  getDaysRemaining,
  getRecordLabelByBusinessType,
} from '@/utils/subscription';
import { formatINR } from '@/utils/pricing';
import { calculateMonthlyPrice } from '@/utils/subscription';

const CAPACITY_OPTIONS = [50, 100, 250, 500, 1000];
const BUSINESS_TYPE_LABELS: Record<string, string> = {
  academy: 'Academy / Coaching',
  gym: 'Gym',
  hotel: 'Hotel',
  clinic: 'Clinic',
  restaurant: 'Restaurant',
  'service-center': 'Service Center',
  salon: 'Salon',
  custom: 'Custom Business',
};

function getUsageColor(usagePercent: number) {
  if (usagePercent >= 100) return 'bg-rose-500';
  if (usagePercent >= 90) return 'bg-orange-500';
  if (usagePercent >= 70) return 'bg-amber-500';
  return 'bg-emerald-500';
}

interface SubscriptionPanelProps {
  onUpgradeComplete?: () => void;
}

export default function SubscriptionPanel({ onUpgradeComplete }: SubscriptionPanelProps) {
  const {
    business,
    businessLoading,
    refreshBusiness,
    recordLimit,
    currentUsage,
    remainingRecords,
    monthlyPrice,
    nextBillingDate,
  } = useBusiness();
  const [selectedLimit, setSelectedLimit] = useState<number>(recordLimit ?? 50);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (recordLimit) {
      setSelectedLimit(recordLimit);
    }
  }, [recordLimit]);

  const recordLabel = getRecordLabelByBusinessType(business?.businessType ?? 'custom');
  const businessTypeLabel =
    BUSINESS_TYPE_LABELS[business?.businessType ?? 'custom'] ?? 'Business';
  const usagePercent = useMemo(() => {
    if (!recordLimit || recordLimit <= 0) return 0;
    return Math.min(100, Math.round((currentUsage / recordLimit) * 100));
  }, [currentUsage, recordLimit]);
  const daysRemaining = getDaysRemaining(nextBillingDate);
  const upgradeOptions = CAPACITY_OPTIONS.filter((option) => option >= Math.max(currentUsage, 50));

  const handleUpgrade = async () => {
    if (!business || !recordLimit) return;
    if (selectedLimit < currentUsage) {
      toast.error('You cannot select a limit below your current usage.');
      return;
    }

    setSaving(true);
    try {
      await upgradeRecordLimit(business.businessId, selectedLimit);
      await refreshBusiness();
      setConfirmOpen(false);
      toast.success('Subscription upgraded successfully.');
      onUpgradeComplete?.();
    } catch (error) {
      handleAppError(error, 'Unable to upgrade subscription.');
    } finally {
      setSaving(false);
    }
  };

  if (businessLoading) {
    return <div className="rounded-[28px] border border-border bg-white p-8 shadow-sm">Loading subscription...</div>;
  }

  if (!business) {
    return (
      <div className="rounded-[28px] border border-border bg-white p-8 shadow-sm">
        Subscription details are not available.
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-700 uppercase tracking-[0.22em] text-primary">Subscription</p>
        <h1 className="mt-1 text-2xl font-700 text-foreground">Usage-based subscription</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review your current capacity, billing cycle, and upgrade options.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <section className="rounded-[28px] border border-border bg-white p-6 shadow-sm">
          <p className="text-xs font-700 uppercase tracking-[0.18em] text-primary">
            Current subscription
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <h2 className="text-xl font-700 text-foreground">Usage-based subscription</h2>
              <p className="mt-1 text-sm text-muted-foreground">{businessTypeLabel}</p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
              <p className="mt-2 text-lg font-700 capitalize text-foreground">
                {business.subscriptionStatus ?? 'active'}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Record capacity</p>
              <p className="mt-2 text-lg font-700 text-foreground">
                {recordLimit} {recordLabel}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Current usage</p>
              <p className="mt-2 text-lg font-700 text-foreground">
                {currentUsage} {recordLabel}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Remaining</p>
              <p className="mt-2 text-lg font-700 text-foreground">
                {remainingRecords} {recordLabel}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Monthly price</p>
              <p className="mt-2 text-lg font-700 text-foreground">{formatINR(monthlyPrice)}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-border bg-white p-6 shadow-sm">
          <p className="text-xs font-700 uppercase tracking-[0.18em] text-primary">
            Usage progress
          </p>
          <p className="mt-4 text-sm font-600 text-foreground">
            {currentUsage} / {recordLimit} {recordLabel} used
          </p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${getUsageColor(usagePercent)}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {usagePercent >= 100
              ? 'Upgrade required'
              : `${remainingRecords} ${recordLabel} remaining in your current capacity.`}
          </p>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-[28px] border border-border bg-white p-6 shadow-sm">
          <p className="text-xs font-700 uppercase tracking-[0.18em] text-primary">Billing cycle</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Activated on</p>
              <p className="mt-2 text-base font-700 text-foreground">
                {formatSubscriptionDate(business.subscriptionStartDate)}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Current period start</p>
              <p className="mt-2 text-base font-700 text-foreground">
                {formatSubscriptionDate(business.currentPeriodStart)}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Next payment date</p>
              <p className="mt-2 text-base font-700 text-foreground">
                {formatSubscriptionDate(business.nextBillingDate)}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Days remaining</p>
              <p className="mt-2 text-base font-700 text-foreground">
                {daysRemaining === null ? 'Not available' : `${daysRemaining} days`}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Billing cycle: Monthly</p>
        </section>

        <section className="rounded-[28px] border border-border bg-white p-6 shadow-sm">
          <p className="text-xs font-700 uppercase tracking-[0.18em] text-primary">Upgrade capacity</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {upgradeOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSelectedLimit(option)}
                className={`rounded-2xl border p-4 text-left transition ${
                  selectedLimit === option
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-white hover:bg-muted/30'
                }`}
              >
                <p className="text-sm font-700 text-foreground">{option} records</p>
                <p className="mt-2 text-base font-700 text-foreground">
                  {formatINR(option === recordLimit ? monthlyPrice : calculateMonthlyPrice(option))}
                </p>
              </button>
            ))}
            <button
              type="button"
              onClick={() => toast.info('Contact Sales for custom record capacity.')}
              className="rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-left transition hover:bg-muted/30"
            >
              <p className="text-sm font-700 text-foreground">Custom</p>
              <p className="mt-2 text-sm text-muted-foreground">Contact Sales for Custom</p>
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={selectedLimit === recordLimit}
              className="btn-primary rounded-xl px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {`Upgrade to ${selectedLimit}`}
            </button>
            <button
              type="button"
              onClick={() => toast.info('Contact Sales for custom record capacity.')}
              className="btn-outline rounded-xl px-4 py-2.5 text-sm"
            >
              Contact Sales for Custom
            </button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Your monthly price is based on selected record capacity. You can upgrade anytime when your business grows.
          </p>
        </section>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[28px] border border-border bg-white shadow-card">
            <div className="border-b border-border px-6 py-5">
              <p className="text-xs font-700 uppercase tracking-[0.22em] text-primary">
                Confirm upgrade
              </p>
              <h2 className="mt-1 text-xl font-700 text-foreground">Upgrade record capacity</h2>
            </div>
            <div className="space-y-5 px-6 py-6">
              <p className="text-sm text-muted-foreground">
                You are upgrading your record capacity from {recordLimit} to {selectedLimit}. Your
                updated monthly price will apply from your next billing cycle.
              </p>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setConfirmOpen(false)} className="btn-outline rounded-xl px-4 py-2.5 text-sm">
                  Cancel
                </button>
                <button type="button" onClick={handleUpgrade} disabled={saving} className="btn-primary rounded-xl px-4 py-2.5 text-sm disabled:opacity-60">
                  {saving ? 'Updating...' : 'Confirm Upgrade'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
