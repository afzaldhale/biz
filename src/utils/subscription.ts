import { BusinessProfile, BusinessType, SubscriptionStatus } from '@/types';
import {
  MIN_RECORDS,
  calculateMonthlyPrice as calculateInternalMonthlyPrice,
} from '@/utils/pricing';

const RECORD_LABELS: Record<BusinessType, string> = {
  academy: 'students',
  gym: 'members',
  hotel: 'guests/bookings',
  clinic: 'patients',
  restaurant: 'customers/orders',
  'service-center': 'customers/tickets',
  salon: 'clients',
  custom: 'records',
};

function clampToPositiveInteger(value: unknown, fallback = 0) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }

  return Math.max(0, Math.floor(value));
}

function normalizeDateInput(value: unknown, fallback?: string) {
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (fallback) {
    const parsed = new Date(fallback);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
}

export function getRecordLabelByBusinessType(businessType?: string | null) {
  if (!businessType) return 'records';
  return RECORD_LABELS[businessType as BusinessType] ?? 'records';
}

export function calculateRemainingRecords(
  recordLimit?: number | null,
  currentUsage?: number | null
) {
  const safeLimit = clampToPositiveInteger(recordLimit, 0);
  const safeUsage = clampToPositiveInteger(currentUsage, 0);
  return Math.max(0, safeLimit - safeUsage);
}

export function canAddRecord(recordLimit?: number | null, currentUsage?: number | null) {
  const safeLimit = clampToPositiveInteger(recordLimit, 0);
  const safeUsage = clampToPositiveInteger(currentUsage, 0);
  return safeUsage < safeLimit;
}

export function calculateNextBillingDate(startDate: Date | string) {
  const start = startDate instanceof Date ? new Date(startDate) : new Date(startDate);
  if (Number.isNaN(start.getTime())) {
    return '';
  }

  const billingDay = start.getDate();
  const year = start.getFullYear();
  const month = start.getMonth();
  const lastDayOfTargetMonth = new Date(year, month + 2, 0).getDate();
  const targetDay = Math.min(billingDay, lastDayOfTargetMonth);

  return new Date(
    start.getFullYear(),
    start.getMonth() + 1,
    targetDay,
    start.getHours(),
    start.getMinutes(),
    start.getSeconds(),
    start.getMilliseconds()
  ).toISOString();
}

export function calculateMonthlyPrice(records: number) {
  return calculateInternalMonthlyPrice(clampToPositiveInteger(records, MIN_RECORDS));
}

export function normalizeSubscriptionBusinessData(
  business: BusinessProfile | null
): BusinessProfile | null {
  if (!business) return null;

  const createdAt = normalizeDateInput(business.createdAt);
  const subscriptionStartDate = normalizeDateInput(
    business.subscriptionStartDate,
    business.createdAt
  );
  const currentUsage = clampToPositiveInteger(business.currentUsage, 0);
  const rawRecordLimit = clampToPositiveInteger(
    business.recordLimit ?? business.planLimit ?? business.estimatedRecords ?? MIN_RECORDS,
    MIN_RECORDS
  );
  const safeRecordLimit = Math.max(rawRecordLimit, currentUsage);
  const estimatedRecords = Math.max(
    clampToPositiveInteger(business.estimatedRecords, safeRecordLimit),
    safeRecordLimit
  );
  const billableRecords = Math.max(
    clampToPositiveInteger(business.billableRecords, estimatedRecords),
    estimatedRecords,
    MIN_RECORDS
  );
  const monthlyPrice =
    typeof business.monthlyPrice === 'number' && business.monthlyPrice > 0
      ? business.monthlyPrice
      : calculateMonthlyPrice(billableRecords);
  const currentPeriodStart = normalizeDateInput(business.currentPeriodStart, subscriptionStartDate);
  const nextBillingDate = normalizeDateInput(
    business.nextBillingDate,
    calculateNextBillingDate(subscriptionStartDate)
  );

  return {
    ...business,
    pricingModel: business.pricingModel ?? 'per_record',
    selectedPlan: business.selectedPlan ?? 'usage_based',
    planLimit: safeRecordLimit,
    recordLimit: safeRecordLimit,
    currentUsage,
    remainingRecords: calculateRemainingRecords(safeRecordLimit, currentUsage),
    minimumRecords: Math.max(
      clampToPositiveInteger(business.minimumRecords, MIN_RECORDS),
      MIN_RECORDS
    ),
    estimatedRecords,
    billableRecords,
    monthlyPrice,
    billingCycle: business.billingCycle ?? 'monthly',
    subscriptionStatus: getSubscriptionStatus(business.subscriptionStatus),
    subscriptionStartDate,
    currentPeriodStart,
    nextBillingDate,
    lastPaymentDate: business.lastPaymentDate ? normalizeDateInput(business.lastPaymentDate) : null,
    createdAt,
    updatedAt: normalizeDateInput(business.updatedAt, business.createdAt),
  };
}

export function getSubscriptionStatus(subscription?: string | null): SubscriptionStatus {
  if (
    subscription === 'active' ||
    subscription === 'past_due' ||
    subscription === 'paused' ||
    subscription === 'cancelled'
  ) {
    return subscription;
  }

  return 'active';
}

export function formatSubscriptionDate(date?: string | null) {
  if (!date) return 'Not available';

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return 'Not available';
  }

  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getDaysRemaining(nextBillingDate?: string | null) {
  if (!nextBillingDate) return null;

  const next = new Date(nextBillingDate);
  if (Number.isNaN(next.getTime())) return null;

  const diff = next.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
