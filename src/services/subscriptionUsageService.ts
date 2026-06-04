import { doc, serverTimestamp } from 'firebase/firestore';
import { getFirestoreDb } from '@/services/academyShared';
import {
  normalizeSubscriptionBusinessData,
  calculateRemainingRecords,
} from '@/utils/subscription';
import { SubscriptionLimitError } from '@/services/subscriptionService';

export async function incrementUsageInTransaction(transaction: any, businessId: string, delta = 1) {
  const businessRef = doc(getFirestoreDb(), 'businesses', businessId);
  const snapshot = await transaction.get(businessRef);
  if (!snapshot.exists()) throw new Error('Business profile not found.');

  const business = normalizeSubscriptionBusinessData(snapshot.data() as any);
  const currentUsage = business?.currentUsage ?? 0;
  const recordLimit = business?.recordLimit ?? business?.planLimit ?? 0;

  if (currentUsage + delta > recordLimit) {
    throw new SubscriptionLimitError(currentUsage, recordLimit);
  }

  const nextUsage = currentUsage + delta;
  transaction.update(businessRef, {
    currentUsage: nextUsage,
    remainingRecords: calculateRemainingRecords(recordLimit, nextUsage),
    updatedAt: serverTimestamp(),
  });
}

export async function decrementUsageInTransaction(transaction: any, businessId: string, delta = 1) {
  const businessRef = doc(getFirestoreDb(), 'businesses', businessId);
  const snapshot = await transaction.get(businessRef);
  if (!snapshot.exists()) throw new Error('Business profile not found.');

  const business = normalizeSubscriptionBusinessData(snapshot.data() as any);
  const currentUsage = Math.max(0, business?.currentUsage ?? 0);
  const recordLimit = business?.recordLimit ?? business?.planLimit ?? 0;
  const nextUsage = Math.max(0, currentUsage - delta);

  transaction.update(businessRef, {
    currentUsage: nextUsage,
    remainingRecords: calculateRemainingRecords(recordLimit, nextUsage),
    updatedAt: serverTimestamp(),
  });
}

export default {
  incrementUsageInTransaction,
  decrementUsageInTransaction,
};
