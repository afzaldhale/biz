import { getSubscriptionOverview, SubscriptionLimitError } from '@/services/subscriptionService';
import { canAddRecord as canAddRecordToPlan } from '@/utils/subscription';

const MAIN_RECORD_COLLECTIONS = new Set([
  'students',
  'gymMembers',
  'patients',
  'customers',
  'guests',
  'bookings',
  'tickets',
  'records',
]);

export async function canAddRecord(businessId: string, collectionName: string) {
  if (!MAIN_RECORD_COLLECTIONS.has(collectionName)) {
    return true;
  }

  const business = await getSubscriptionOverview(businessId);
  const recordLimit = business.recordLimit ?? business.planLimit ?? 0;
  const currentUsage = business.currentUsage ?? 0;

  if (!canAddRecordToPlan(recordLimit, currentUsage)) {
    throw new SubscriptionLimitError(currentUsage, recordLimit);
  }

  return true;
}
