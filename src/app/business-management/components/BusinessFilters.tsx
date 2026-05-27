'use client';

import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { BusinessStatus, CapacityTier } from '@/lib/mockData';

interface BusinessFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: BusinessStatus | 'all';
  onStatusChange: (v: string) => void;
  planFilter: CapacityTier | 'all';
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

const CAPACITY_OPTIONS: { value: CapacityTier | 'all'; label: string }[] = [
  { value: 'all', label: 'All Capacities' },
  { value: 'basic', label: '50 records' },
  { value: 'medium', label: '100-150 records' },
  { value: 'advance', label: '250 records' },
  { value: 'premium', label: '500 records' },
  { value: 'pro', label: '1000 records' },
  { value: 'custom', label: 'Custom capacity' },
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
    <div className="border-b border-border px-6 py-4">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search by business name, owner, email, city..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl border border-border bg-muted/40 py-2.5 pl-9 pr-4 text-sm placeholder:text-muted-foreground transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 transition-colors hover:bg-muted"
            >
              <X size={13} className="text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <SlidersHorizontal size={13} />
            <span className="font-600">Filter:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className={`cursor-pointer rounded-xl border px-3 py-2.5 text-xs transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 ${
              statusFilter !== 'all'
                ? 'border-primary/40 bg-primary/5 font-600 text-primary'
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
            className={`cursor-pointer rounded-xl border px-3 py-2.5 text-xs transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 ${
              planFilter !== 'all'
                ? 'border-primary/40 bg-primary/5 font-600 text-primary'
                : 'border-border bg-muted/40 text-foreground'
            }`}
          >
            {CAPACITY_OPTIONS.map((opt) => (
              <option key={`capacity-opt-${opt.value}`} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={industryFilter}
            onChange={(e) => onIndustryChange(e.target.value)}
            className={`cursor-pointer rounded-xl border px-3 py-2.5 text-xs transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 ${
              industryFilter !== 'all'
                ? 'border-primary/40 bg-primary/5 font-600 text-primary'
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
              className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2.5 text-xs font-600 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <X size={12} />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {(hasActiveFilters || selectedCount > 0) && (
        <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
          <p className="text-xs text-muted-foreground">
            {hasActiveFilters && (
              <span>
                Showing <span className="font-700 text-foreground">{totalFiltered}</span> results
              </span>
            )}
          </p>
          {selectedCount > 0 && (
            <div className="slide-up flex items-center gap-2">
              <span className="rounded-lg border border-primary/20 bg-primary/8 px-2.5 py-1 text-xs font-600 text-primary">
                {selectedCount} selected
              </span>
              <button className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-600 text-amber-600 transition-colors hover:bg-amber-100">
                Bulk Suspend
              </button>
              <button className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-600 text-red-500 transition-colors hover:bg-red-100">
                Bulk Archive
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
