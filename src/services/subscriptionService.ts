import {
  collection,
  doc,
  getCountFromServer,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { BusinessProfile, BusinessType } from '@/types';
import { getBusinessById } from '@/services/businessService';
import { getFirestoreDb } from '@/services/academyShared';
import {
  calculateMonthlyPrice,
  calculateRemainingRecords,
  canAddRecord,
  normalizeSubscriptionBusinessData,
} from '@/utils/subscription';

export class SubscriptionLimitError extends Error {
  code = 'subscription/record-limit-reached' as const;
  currentUsage: number;
  recordLimit: number;

  constructor(currentUsage: number, recordLimit: number) {
    super('You have used all available records in your current subscription. Upgrade to continue.');
    this.currentUsage = currentUsage;
    this.recordLimit = recordLimit;
  }
}

function ensureBusiness(subscription: BusinessProfile | null) {
  if (!subscription) {
    throw new Error('Business subscription not found.');
  }

  return subscription;
}

function getMainCollectionName(businessType: BusinessType) {
  if (businessType === 'academy') return 'students';
  if (businessType === 'gym') return 'gymMembers';
  return null;
}

export async function getSubscriptionOverview(businessId: string) {
  const business = ensureBusiness(await getBusinessById(businessId));
  return ensureBusiness(normalizeSubscriptionBusinessData(business));
}

export async function upgradeRecordLimit(businessId: string, newLimit: number) {
  const firestore = getFirestoreDb();
  const businessRef = doc(firestore, 'businesses', businessId);

  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(businessRef);
    if (!snapshot.exists()) {
      throw new Error('Business not found.');
    }

    const business = ensureBusiness(
      normalizeSubscriptionBusinessData(snapshot.data() as BusinessProfile)
    );
    const safeLimit = Math.max(0, Math.floor(newLimit));

    if (safeLimit < business.currentUsage!) {
      throw new Error('You cannot select a limit below your current usage.');
    }

    if (safeLimit === business.recordLimit) {
      return;
    }

    transaction.update(businessRef, {
      planLimit: safeLimit,
      recordLimit: safeLimit,
      estimatedRecords: safeLimit,
      billableRecords: safeLimit,
      monthlyPrice: calculateMonthlyPrice(safeLimit),
      remainingRecords: calculateRemainingRecords(safeLimit, business.currentUsage),
      updatedAt: serverTimestamp(),
    });
  });

  return getSubscriptionOverview(businessId);
}

export async function enforceRecordLimitBeforeCreate(businessId: string) {
  const business = await getSubscriptionOverview(businessId);
  const recordLimit = business.recordLimit ?? business.planLimit ?? 0;
  const currentUsage = business.currentUsage ?? 0;

  if (!canAddRecord(recordLimit, currentUsage)) {
    throw new SubscriptionLimitError(currentUsage, recordLimit);
  }

  return business;
}

export async function incrementUsageOnCreate(businessId: string) {
  const firestore = getFirestoreDb();
  const businessRef = doc(firestore, 'businesses', businessId);

  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(businessRef);
    if (!snapshot.exists()) {
      throw new Error('Business not found.');
    }

    const business = ensureBusiness(
      normalizeSubscriptionBusinessData(snapshot.data() as BusinessProfile)
    );
    const currentUsage = business.currentUsage ?? 0;
    const recordLimit = business.recordLimit ?? business.planLimit ?? 0;

    if (!canAddRecord(recordLimit, currentUsage)) {
      throw new SubscriptionLimitError(currentUsage, recordLimit);
    }

    const nextUsage = currentUsage + 1;

    transaction.update(businessRef, {
      currentUsage: nextUsage,
      remainingRecords: calculateRemainingRecords(recordLimit, nextUsage),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function decrementUsageOnDeactivate(businessId: string) {
  const firestore = getFirestoreDb();
  const businessRef = doc(firestore, 'businesses', businessId);

  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(businessRef);
    if (!snapshot.exists()) {
      throw new Error('Business not found.');
    }

    const business = ensureBusiness(
      normalizeSubscriptionBusinessData(snapshot.data() as BusinessProfile)
    );
    const currentUsage = Math.max(0, business.currentUsage ?? 0);
    const recordLimit = business.recordLimit ?? business.planLimit ?? 0;
    const nextUsage = Math.max(0, currentUsage - 1);

    transaction.update(businessRef, {
      currentUsage: nextUsage,
      remainingRecords: calculateRemainingRecords(recordLimit, nextUsage),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function syncBusinessUsage(businessId: string, businessType: BusinessType) {
  const firestore = getFirestoreDb();
  const business = await getSubscriptionOverview(businessId);
  const collectionName = getMainCollectionName(businessType);

  let currentUsage = 0;

  if (businessType === 'academy') {
    const activeStudents = await getCountFromServer(
      query(collection(firestore, 'businesses', businessId, 'students'), where('status', '==', 'active'))
    );
    currentUsage = activeStudents.data().count;
  } else if (businessType === 'gym') {
    const activeMembers = await getCountFromServer(
      query(collection(firestore, 'businesses', businessId, 'gymMembers'), where('status', '==', 'active'))
    );
    currentUsage = activeMembers.data().count;
  } else if (collectionName) {
    const snapshot = await getDocs(collection(firestore, 'businesses', businessId, collectionName));
    currentUsage = snapshot.size;
  }

  const recordLimit = business.recordLimit ?? business.planLimit ?? currentUsage;

  await updateDoc(doc(firestore, 'businesses', businessId), {
    currentUsage,
    remainingRecords: calculateRemainingRecords(recordLimit, currentUsage),
    updatedAt: serverTimestamp(),
  });

  return getSubscriptionOverview(businessId);
}
