'use client';

import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { BusinessStatus, PlanType } from '@/lib/mockData';

interface BusinessFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: BusinessStatus | 'all';
  onStatusChange: (v: string) => void;
  planFilter: PlanType | 'all';
  onPlanChange: (v: string) => void;
  industryFilter: string;
  onIndustryChange: (v: string) => void;
  totalFiltered: number;
  selectedCount: number;
  onClearFilters: () => void;
}

const STATUS_OPTIONS: { value: BusinessStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending_verification', label: 'Pending Verification' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PLAN_OPTIONS: { value: PlanType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Plans' },
  { value: 'basic', label: 'Basic — ₹499/mo' },
  { value: 'medium', label: 'Medium — ₹999/mo' },
  { value: 'advance', label: 'Advance — ₹1,499/mo' },
  { value: 'premium', label: 'Premium — ₹1,999/mo' },
  { value: 'pro', label: 'Pro — ₹2,999/mo' },
  { value: 'custom', label: 'Custom' },
];

const INDUSTRY_OPTIONS = [
  { value: 'all', label: 'All Industries' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'retail', label: 'Retail' },
  { value: 'education', label: 'Education' },
  { value: 'salon', label: 'Salon' },
  { value: 'gym', label: 'Gym / Wellness' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'consulting', label: 'Consulting' },
];

export default function BusinessFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  planFilter,
  onPlanChange,
  industryFilter,
  onIndustryChange,
  totalFiltered,
  selectedCount,
  onClearFilters,
}: BusinessFiltersProps) {
  const hasActiveFilters =
    search !== '' || statusFilter !== 'all' || planFilter !== 'all' || industryFilter !== 'all';

  return (
    <div className="px-6 py-4 border-b border-border">
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search by business name, owner, email, city..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-muted/40 border border-border rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50
                       placeholder:text-muted-foreground transition-all"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted transition-colors"
            >
              <X size={13} className="text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <SlidersHorizontal size={13} />
            <span className="font-600">Filter:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className={`text-xs border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer
              ${
                statusFilter !== 'all'
                  ? 'border-primary/40 bg-primary/5 text-primary font-600'
                  : 'border-border bg-muted/40 text-foreground'
              }`}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={`status-opt-${opt.value}`} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={planFilter}
            onChange={(e) => onPlanChange(e.target.value)}
            className={`text-xs border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer
              ${
                planFilter !== 'all'
                  ? 'border-primary/40 bg-primary/5 text-primary font-600'
                  : 'border-border bg-muted/40 text-foreground'
              }`}
          >
            {PLAN_OPTIONS.map((opt) => (
              <option key={`plan-opt-${opt.value}`} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={industryFilter}
            onChange={(e) => onIndustryChange(e.target.value)}
            className={`text-xs border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer
              ${
                industryFilter !== 'all'
                  ? 'border-primary/40 bg-primary/5 text-primary font-600'
                  : 'border-border bg-muted/40 text-foreground'
              }`}
          >
            {INDUSTRY_OPTIONS.map((opt) => (
              <option key={`ind-opt-${opt.value}`} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1.5 text-xs font-600 text-red-500 hover:text-red-600 px-3 py-2.5 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
            >
              <X size={12} />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Active filter summary + bulk action */}
      {(hasActiveFilters || selectedCount > 0) && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            {hasActiveFilters && (
              <span>
                Showing <span className="font-700 text-foreground">{totalFiltered}</span> results
              </span>
            )}
          </p>
          {selectedCount > 0 && (
            <div className="flex items-center gap-2 slide-up">
              <span className="text-xs font-600 text-primary bg-primary/8 px-2.5 py-1 rounded-lg border border-primary/20">
                {selectedCount} selected
              </span>
              <button className="text-xs font-600 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors">
                Bulk Suspend
              </button>
              <button className="text-xs font-600 text-red-500 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200 hover:bg-red-100 transition-colors">
                Bulk Archive
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
