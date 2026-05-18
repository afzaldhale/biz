/**
 * Internal pricing constants and calculations.
 *
 * IMPORTANT:
 * - INTERNAL_PRICE_PER_RECORD is for backend calculations only.
 * - Do NOT display this value in public UI.
 * - Public UI shows only: final calculated price, "usage-based pricing", "minimum 50 records".
 */

export const INTERNAL_PRICE_PER_RECORD = 9;
export const MIN_RECORDS = 50;
export const MAX_UI_INPUT = 50000;
export const SLIDER_MAX = 5000;

export function calculateMonthlyPrice(records: number): number {
  const billableRecords = Math.max(records, MIN_RECORDS);
  return billableRecords * INTERNAL_PRICE_PER_RECORD;
}

export function calculateYearlyPrice(records: number): number {
  return calculateMonthlyPrice(records) * 12;
}

export function getBillableRecords(records: number): number {
  return Math.max(records, MIN_RECORDS);
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatINRWithDecimals(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Category-specific record labels for UI display
 */
export const recordLabels: Record<string, string> = {
  academy: 'students',
  gym: 'members',
  hotel: 'guests/bookings',
  clinic: 'patients',
  restaurant: 'customers/orders',
  'service-center': 'customers/tickets',
  salon: 'clients',
  custom: 'records',
};

export function getRecordLabel(businessType: string): string {
  return recordLabels[businessType] || 'records';
}

/**
 * Safely parse user input to record count
 */
export function parseRecordCount(input: string | number): number {
  let num = typeof input === 'string' ? parseInt(input, 10) : input;
  if (Number.isNaN(num) || num < 0) return 0;
  if (num > MAX_UI_INPUT) return MAX_UI_INPUT;
  return Math.floor(num);
}
