'use client';

import React from 'react';
import { Business } from '@/lib/mockData';
import { StatusBadge, PlanBadge } from '@/components/admin/AdminBadge';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Eye,
  RefreshCw,
  CreditCard,
  PauseCircle,
  Trash2,
  Building2,
  CheckSquare,
  Square,
} from 'lucide-react';
import type { SortField, SortDir } from './BusinessManagementContent';
import Icon from '@/components/ui/AppIcon';

interface BusinessTableProps {
  businesses: Business[];
  allBusinesses: Business[];
  selectedIds: Set<string>;
  onSelectIds: (ids: Set<string>) => void;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  onViewDetail: (biz: Business) => void;
  onChangeStatus: (biz: Business) => void;
  onChangePlan: (biz: Business) => void;
  onSuspend: (biz: Business) => void;
  onDelete: (biz: Business) => void;
}

function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
}) {
  if (field !== sortField) return <ChevronsUpDown size={13} className="text-muted-foreground/50" />;
  return sortDir === 'asc' ? (
    <ChevronUp size={13} className="text-primary" />
  ) : (
    <ChevronDown size={13} className="text-primary" />
  );
}

const INDUSTRY_LABELS: Record<string, string> = {
  restaurant: 'Restaurant',
  retail: 'Retail',
  education: 'Education',
  salon: 'Salon',
  gym: 'Gym',
  healthcare: 'Healthcare',
  real_estate: 'Real Estate',
  logistics: 'Logistics',
  ecommerce: 'E-commerce',
  consulting: 'Consulting',
};

export default function BusinessTable({
  businesses,
  allBusinesses,
  selectedIds,
  onSelectIds,
  sortField,
  sortDir,
  onSort,
  onViewDetail,
  onChangeStatus,
  onChangePlan,
  onSuspend,
  onDelete,
}: BusinessTableProps) {
  const allPageIds = businesses.map((b) => b.id);
  const allSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));
  const someSelected = allPageIds.some((id) => selectedIds.has(id)) && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      const next = new Set(selectedIds);
      allPageIds.forEach((id) => next.delete(id));
      onSelectIds(next);
    } else {
      const next = new Set(selectedIds);
      allPageIds.forEach((id) => next.add(id));
      onSelectIds(next);
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectIds(next);
  };

  if (businesses.length === 0) {
    return (
      <AdminEmptyState
        icon={Building2}
        title="No businesses found"
        description="No businesses match your current search and filter criteria. Try adjusting your filters or search terms."
        action={{ label: 'Clear all filters', onClick: () => {} }}
      />
    );
  }

  const SortableHeader = ({
    field,
    label,
    className = '',
  }: {
    field: SortField;
    label: string;
    className?: string;
  }) => (
    <th
      className={`text-left px-4 py-3.5 text-[11px] font-700 text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground transition-colors ${className}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1.5">
        {label}
        <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
      </div>
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-4 py-3.5 w-10">
              <button
                onClick={toggleAll}
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Select all businesses on this page"
              >
                {allSelected ? (
                  <CheckSquare size={16} className="text-primary" />
                ) : someSelected ? (
                  <CheckSquare size={16} className="text-primary/50" />
                ) : (
                  <Square size={16} />
                )}
              </button>
            </th>
            <SortableHeader field="businessName" label="Business" className="pl-2" />
            <th className="text-left px-4 py-3.5 text-[11px] font-700 text-muted-foreground uppercase tracking-wide">
              Owner
            </th>
            <th className="text-left px-4 py-3.5 text-[11px] font-700 text-muted-foreground uppercase tracking-wide hidden xl:table-cell">
              Industry
            </th>
            <SortableHeader field="plan" label="Plan" />
            <SortableHeader field="status" label="Status" />
            <th className="text-left px-4 py-3.5 text-[11px] font-700 text-muted-foreground uppercase tracking-wide">
              Usage
            </th>
            <SortableHeader field="createdAt" label="Created" className="hidden lg:table-cell" />
            <th className="text-right px-4 py-3.5 text-[11px] font-700 text-muted-foreground uppercase tracking-wide">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {businesses.map((biz) => {
            const usagePct =
              biz.usageLimit > 0 ? Math.round((biz.usageCount / biz.usageLimit) * 100) : 0;
            const usageHigh = usagePct >= 85;
            const selected = selectedIds.has(biz.id);

            return (
              <tr
                key={biz.id}
                className={`border-b border-border/40 last:border-0 row-hover transition-colors ${selected ? 'bg-primary/4' : ''}`}
              >
                {/* Checkbox */}
                <td className="px-4 py-4">
                  <button
                    onClick={() => toggleOne(biz.id)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    aria-label={`Select ${biz.businessName}`}
                  >
                    {selected ? (
                      <CheckSquare size={16} className="text-primary" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </td>

                {/* Business name */}
                <td className="px-2 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center text-white text-xs font-800 flex-shrink-0">
                      {biz.businessName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-700 text-foreground truncate max-w-[160px]">
                        {biz.businessName}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                        {biz.email}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Owner */}
                <td className="px-4 py-4">
                  <p className="text-sm text-foreground font-500">{biz.ownerName}</p>
                  <p className="text-[11px] text-muted-foreground">{biz.phone}</p>
                </td>

                {/* Industry */}
                <td className="px-4 py-4 hidden xl:table-cell">
                  <span className="text-xs font-500 text-muted-foreground bg-muted px-2.5 py-1 rounded-lg border border-border">
                    {INDUSTRY_LABELS[biz.industry] ?? biz.industry}
                  </span>
                </td>

                {/* Plan */}
                <td className="px-4 py-4">
                  <PlanBadge plan={biz.plan} />
                </td>

                {/* Status */}
                <td className="px-4 py-4">
                  <StatusBadge status={biz.status} />
                </td>

                {/* Usage */}
                <td className="px-4 py-4">
                  <div className="min-w-[80px]">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-700 text-tabular ${usageHigh ? 'text-red-500' : 'text-foreground'}`}
                      >
                        {biz.usageCount}
                        <span className="text-muted-foreground font-400">
                          /{biz.usageLimit === 9999 ? '∞' : biz.usageLimit}
                        </span>
                      </span>
                      <span
                        className={`text-[10px] font-600 ${usageHigh ? 'text-red-500' : 'text-muted-foreground'}`}
                      >
                        {usagePct}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${usageHigh ? 'bg-red-400' : 'usage-bar-fill'}`}
                        style={{ width: `${Math.min(usagePct, 100)}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* Created date */}
                <td className="px-4 py-4 hidden lg:table-cell">
                  <span className="text-xs text-muted-foreground font-500">{biz.createdAt}</span>
                </td>

                {/* Actions */}
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ActionButton
                      icon={Eye}
                      label="View details"
                      onClick={() => onViewDetail(biz)}
                      color="text-primary"
                    />
                    <ActionButton
                      icon={RefreshCw}
                      label="Change status"
                      onClick={() => onChangeStatus(biz)}
                      color="text-amber-600"
                    />
                    <ActionButton
                      icon={CreditCard}
                      label="Change plan"
                      onClick={() => onChangePlan(biz)}
                      color="text-blue-600"
                    />
                    {biz.status !== 'suspended' && (
                      <ActionButton
                        icon={PauseCircle}
                        label="Suspend business — this will block all users immediately"
                        onClick={() => onSuspend(biz)}
                        color="text-orange-500"
                      />
                    )}
                    <ActionButton
                      icon={Trash2}
                      label="Archive business — this cannot be undone"
                      onClick={() => onDelete(biz)}
                      color="text-red-500"
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Make actions always visible via CSS trick — row needs group class */}
      <style jsx>{`
        tbody tr {
          position: relative;
        }
        tbody tr td:last-child > div {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  color: string;
}

function ActionButton({ icon: Icon, label, onClick, color }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`p-1.5 rounded-lg hover:bg-muted transition-all duration-150 active:scale-95 ${color}`}
    >
      <Icon size={14} />
    </button>
  );
}
