import { collection, doc, getDocs, orderBy, query, setDoc, updateDoc } from 'firebase/firestore';
import { BusinessProfile } from '@/types';
import { getFirestoreDb } from '@/services/academyShared';
import { syncBusinessUsage } from '@/services/subscriptionService';
import {
  calculateMonthlyPrice,
  normalizeSubscriptionBusinessData,
} from '@/utils/subscription';
import { Business, BusinessStatus, PlanType } from '@/lib/mockData';

const INDUSTRY_MAP: Record<string, Business['industry']> = {
  academy: 'education',
  gym: 'gym',
  hotel: 'consulting',
  clinic: 'healthcare',
  restaurant: 'restaurant',
  'service-center': 'consulting',
  salon: 'salon',
  custom: 'consulting',
};

function mapBusinessToAdminRow(profile: BusinessProfile): Business {
  const normalized = normalizeSubscriptionBusinessData(profile)!;
  const recordLimit = normalized.recordLimit ?? normalized.planLimit ?? 0;

  return {
    id: normalized.businessId,
    businessId: normalized.businessId,
    ownerId: normalized.ownerId,
    businessName: normalized.businessName,
    ownerName: normalized.ownerName,
    email: normalized.email,
    phone: normalized.phone,
    industry: INDUSTRY_MAP[normalized.businessType] ?? 'consulting',
    businessType: normalized.businessType,
    plan: 'custom' as PlanType,
    status: normalized.status as BusinessStatus,
    createdAt: normalized.createdAt,
    usageCount: normalized.currentUsage ?? 0,
    usageLimit: recordLimit,
    recordLimit,
    currentUsage: normalized.currentUsage ?? 0,
    remainingRecords: normalized.remainingRecords ?? 0,
    monthlyPrice: normalized.monthlyPrice ?? 0,
    subscriptionStatus: normalized.subscriptionStatus ?? 'active',
    nextBillingDate: normalized.nextBillingDate ?? null,
    city: normalized.address ?? 'Not set',
    emailVerified: true,
    lastActive: normalized.updatedAt,
  };
}

export async function getAdminBusinesses() {
  const snapshot = await getDocs(
    query(collection(getFirestoreDb(), 'businesses'), orderBy('updatedAt', 'desc'))
  );

  return snapshot.docs
    .map((businessDoc) => mapBusinessToAdminRow(businessDoc.data() as BusinessProfile))
    .filter(Boolean);
}

export async function adminUpdateBusinessStatus(businessId: string, status: BusinessStatus) {
  await updateDoc(doc(getFirestoreDb(), 'businesses', businessId), {
    status,
    updatedAt: new Date().toISOString(),
  });
}

export async function adminUpdateBusinessRecordLimit(businessId: string, recordLimit: number) {
  await setDoc(
    doc(getFirestoreDb(), 'businesses', businessId),
    {
      planLimit: recordLimit,
      recordLimit,
      estimatedRecords: recordLimit,
      billableRecords: recordLimit,
      monthlyPrice: calculateMonthlyPrice(recordLimit),
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function adminSyncBusinessUsage(businessId: string, businessType: string) {
  return syncBusinessUsage(businessId, businessType as BusinessProfile['businessType']);
}
