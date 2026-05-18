import React from 'react';
import { BusinessStatus, PlanType } from '@/lib/mockData';

interface StatusBadgeProps {
  status: BusinessStatus;
}

interface PlanBadgeProps {
  plan: PlanType;
}

const STATUS_LABELS: Record<BusinessStatus, string> = {
  active: 'Active',
  pending_verification: 'Pending',
  suspended: 'Suspended',
  cancelled: 'Cancelled',
};

const PLAN_LABELS: Record<PlanType, string> = {
  basic: 'Basic',
  medium: 'Medium',
  advance: 'Advance',
  premium: 'Premium',
  pro: 'Pro',
  custom: 'Custom',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const classMap: Record<BusinessStatus, string> = {
    active: 'status-active',
    pending_verification: 'status-pending',
    suspended: 'status-suspended',
    cancelled: 'status-cancelled',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-700 ${classMap[status]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          status === 'active'
            ? 'bg-emerald-500'
            : status === 'pending_verification'
              ? 'bg-amber-500'
              : status === 'suspended'
                ? 'bg-red-500'
                : 'bg-gray-400'
        }`}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PlanBadge({ plan }: PlanBadgeProps) {
  const classMap: Record<PlanType, string> = {
    basic: 'plan-basic',
    medium: 'plan-medium',
    advance: 'plan-advance',
    premium: 'plan-premium',
    pro: 'plan-pro',
    custom: 'plan-custom',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-700 ${classMap[plan]}`}
    >
      {PLAN_LABELS[plan]}
    </span>
  );
}

interface TicketStatusBadgeProps {
  status: 'open' | 'in_progress' | 'resolved';
}

export function TicketStatusBadge({ status }: TicketStatusBadgeProps) {
  const classMap = {
    open: 'ticket-open',
    in_progress: 'ticket-in_progress',
    resolved: 'ticket-resolved',
  };
  const labels = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved' };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-700 ${classMap[status]}`}
    >
      {labels[status]}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high';
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const classMap = {
    low: 'bg-gray-100 text-gray-600 border border-gray-200',
    medium: 'bg-blue-50 text-blue-600 border border-blue-200',
    high: 'bg-red-50 text-red-600 border border-red-200',
  };
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-700 ${classMap[priority]}`}
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}
