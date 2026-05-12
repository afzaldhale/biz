import { readCachedStorage, writeCachedStorage } from './storageCache';

interface FeeRecord {
  id: string;
  createdAt?: string;
  [key: string]: unknown;
}

const FEES_PREFIX = 'bizmanage_fees';

function getStorageKey(businessId: string) {
  return `${FEES_PREFIX}:${businessId}`;
}

function readFees(businessId: string): FeeRecord[] {
  return readCachedStorage<FeeRecord[]>(getStorageKey(businessId), []);
}

export async function addFee(businessId: string, fee: FeeRecord) {
  const created = { ...fee, createdAt: fee.createdAt ?? new Date().toISOString() };
  writeCachedStorage(getStorageKey(businessId), [created, ...readFees(businessId)]);
  return created.id;
}

export async function getFees(businessId: string) {
  return readFees(businessId);
}

export async function getFeeById(businessId: string, feeId: string) {
  return readFees(businessId).find((fee) => fee.id === feeId) ?? null;
}
