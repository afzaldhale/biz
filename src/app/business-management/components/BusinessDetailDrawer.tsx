'use client';

import React, { useEffect } from 'react';
import { Business, PLAN_PRICES, PLAN_LIMITS } from '@/lib/mockData';
import { StatusBadge, PlanBadge } from '@/components/admin/AdminBadge';
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

interface BusinessDetailDrawerProps {
  business: Business;
  onClose: () => void;
  onChangeStatus: () => void;
  onChangePlan: () => void;
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
  onClose,
  onChangeStatus,
  onChangePlan,
}: BusinessDetailDrawerProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const usagePct = biz.usageLimit > 0 ? Math.round((biz.usageCount / biz.usageLimit) * 100) : 0;
  const planPrice = PLAN_PRICES[biz.plan];
  const planLimit = PLAN_LIMITS[biz.plan];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-foreground/15 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-card border-l border-border shadow-card-lg slide-in-right overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-800 text-base flex-shrink-0">
              {biz.businessName.charAt(0)}
            </div>
            <div>
              <h2 className="text-base font-800 text-foreground leading-tight">
                {biz.businessName}
              </h2>
              <p className="text-xs text-muted-foreground">{biz.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
            aria-label="Close business detail panel"
          >
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status & Plan badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={biz.status} />
            <PlanBadge plan={biz.plan} />
            {biz.emailVerified ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-600 text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <CheckCircle2 size={11} />
                Email Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-600 text-red-500 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                <XCircle size={11} />
                Email Not Verified
              </span>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex gap-2">
            <button
              onClick={onChangeStatus}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-600 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"
            >
              <RefreshCw size={14} />
              Change Status
            </button>
            <button
              onClick={onChangePlan}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-600 text-primary bg-primary/8 border border-primary/20 rounded-xl hover:bg-primary/15 transition-colors"
            >
              <CreditCard size={14} />
              Change Plan
            </button>
          </div>

          {/* Business Info */}
          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 bg-muted/40 border-b border-border">
              <p className="text-xs font-700 text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Building2 size={13} />
                Business Profile
              </p>
            </div>
            <div className="p-4 space-y-3">
              {[
                {
                  id: 'detail-name',
                  icon: Building2,
                  label: 'Business Name',
                  value: biz.businessName,
                },
                {
                  id: 'detail-industry',
                  icon: Activity,
                  label: 'Industry',
                  value: INDUSTRY_LABELS[biz.industry] ?? biz.industry,
                },
                { id: 'detail-city', icon: MapPin, label: 'City', value: biz.city },
                { id: 'detail-created', icon: Calendar, label: 'Registered', value: biz.createdAt },
                {
                  id: 'detail-lastactive',
                  icon: Clock,
                  label: 'Last Active',
                  value: biz.lastActive,
                },
              ].map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <item.icon size={13} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground font-600 uppercase tracking-wide">
                      {item.label}
                    </p>
                    <p className="text-sm font-600 text-foreground">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Owner Info */}
          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 bg-muted/40 border-b border-border">
              <p className="text-xs font-700 text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <User size={13} />
                Owner Information
              </p>
            </div>
            <div className="p-4 space-y-3">
              {[
                { id: 'owner-name', icon: User, label: 'Full Name', value: biz.ownerName },
                { id: 'owner-email', icon: Mail, label: 'Email Address', value: biz.email },
                { id: 'owner-phone', icon: Phone, label: 'Phone Number', value: biz.phone },
              ].map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <item.icon size={13} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground font-600 uppercase tracking-wide">
                      {item.label}
                    </p>
                    <p className="text-sm font-600 text-foreground truncate">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subscription Info */}
          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 bg-muted/40 border-b border-border">
              <p className="text-xs font-700 text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <CreditCard size={13} />
                Subscription Details
              </p>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  {
                    id: 'sub-plan',
                    label: 'Current Plan',
                    value: biz.plan.charAt(0).toUpperCase() + biz.plan.slice(1),
                  },
                  {
                    id: 'sub-price',
                    label: 'Monthly Price',
                    value: `₹${planPrice.toLocaleString('en-IN')}/mo`,
                  },
                  {
                    id: 'sub-limit',
                    label: 'Usage Limit',
                    value: planLimit === 9999 ? 'Unlimited' : planLimit.toLocaleString('en-IN'),
                  },
                  { id: 'sub-status', label: 'Payment Status', value: 'Placeholder' },
                ].map((item) => (
                  <div key={item.id} className="bg-muted/40 rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground font-600 uppercase tracking-wide mb-1">
                      {item.label}
                    </p>
                    <p className="text-sm font-700 text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Usage bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-600 text-foreground">Current Usage</p>
                  <span
                    className={`text-xs font-700 text-tabular ${usagePct >= 85 ? 'text-red-500' : 'text-muted-foreground'}`}
                  >
                    {biz.usageCount} / {planLimit === 9999 ? '∞' : planLimit} ({usagePct}%)
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${usagePct >= 85 ? 'bg-red-400' : 'usage-bar-fill'}`}
                    style={{ width: `${Math.min(usagePct, 100)}%` }}
                  />
                </div>
                {usagePct >= 85 && (
                  <p className="text-[11px] text-red-500 mt-1.5 font-500">
                    ⚠️ Usage is at {usagePct}% — consider recommending a plan upgrade
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Admin note */}
          <div className="rounded-2xl border border-border p-4">
            <p className="text-xs font-700 text-muted-foreground uppercase tracking-wide mb-2">
              Admin Note
            </p>
            <textarea
              placeholder="Add an internal note about this business (not visible to customer)..."
              className="w-full text-sm text-foreground bg-muted/40 border border-border rounded-xl px-3 py-2.5 resize-none
                         focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50
                         placeholder:text-muted-foreground transition-all"
              rows={3}
            />
            {/* BACKEND INTEGRATION POINT: Save admin note to businesses/{id}/adminNotes in Firestore */}
            <button className="mt-2 text-xs font-600 text-primary hover:underline">
              Save note
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
