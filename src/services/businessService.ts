import { BusinessProfile } from '@/types';
import { readCachedStorage, writeCachedStorage } from './storageCache';

const BUSINESSES_KEY = 'bizmanage_businesses';

function readBusinesses(): Record<string, BusinessProfile> {
  return readCachedStorage<Record<string, BusinessProfile>>(BUSINESSES_KEY, {});
}

export async function getBusinessProfile(businessId: string) {
  const businesses = readBusinesses();
  return businesses[businessId] ?? null;
}

export async function saveBusinessProfile(profile: BusinessProfile) {
  const businesses = readBusinesses();
  const nextBusinesses = {
    ...businesses,
    [profile.businessId]: profile,
  };

  writeCachedStorage(BUSINESSES_KEY, nextBusinesses);
  return profile;
}

export async function updateBusinessUsage(businessId: string, usage: number) {
  const businesses = readBusinesses();
  const current = businesses[businessId];

  if (!current) {
    return;
  }

  businesses[businessId] = {
    ...current,
    currentUsage: usage,
    updatedAt: new Date().toISOString(),
  };

  writeCachedStorage(BUSINESSES_KEY, businesses);
}
