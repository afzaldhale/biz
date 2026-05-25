import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  writeBatch,
  limit,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { ActivityItem } from '@/types';

const ACTIVITY_CACHE_TTL_MS = 30_000;
const activityCache = new Map<string, { expiresAt: number; value: ActivityItem[] }>();

function ensureFirebaseConfigured() {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase is not configured. Please set NEXT_PUBLIC_FIREBASE_* environment variables.'
    );
  }
}

function getFirestoreDb() {
  ensureFirebaseConfigured();
  return db!;
}

function formatTime(value: unknown) {
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export async function getRecentActivities(
  businessId: string,
  limitCount = 5
): Promise<ActivityItem[]> {
  const cacheKey = `${businessId}:${limitCount}`;
  const cached = activityCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const firestore = getFirestoreDb();
  const activitiesRef = collection(firestore, 'businesses', businessId, 'activities');
  const activitiesQuery = query(activitiesRef, orderBy('createdAt', 'desc'), limit(limitCount));
  const snapshot = await getDocs(activitiesQuery);

  const value = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      action: String(data.type ?? data.action ?? 'Update'),
      entity: String(data.module ?? data.entity ?? 'Record'),
      entityName: String(data.title ?? data.description ?? 'Activity'),
      time: formatTime(data.createdAt ?? data.updatedAt ?? new Date().toISOString()),
      status: String(data.status ?? 'completed') as ActivityItem['status'],
      amount: data.amount != null ? `₹${Number(data.amount).toLocaleString('en-IN')}` : undefined,
      createdAt:
        typeof data.createdAt === 'string'
          ? data.createdAt
          : (data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString()),
    };
  });

  activityCache.set(cacheKey, {
    value,
    expiresAt: Date.now() + ACTIVITY_CACHE_TTL_MS,
  });

  return value;
}

export async function createSupportTicket(
  businessId: string,
  payload: {
    subject: string;
    category: string;
    message: string;
    createdBy: string;
  }
) {
  const firestore = getFirestoreDb();
  const ticketRef = doc(collection(firestore, 'businesses', businessId, 'supportTickets'));
  const activityRef = doc(collection(firestore, 'businesses', businessId, 'activities'));
  const now = new Date().toISOString();
  const batch = writeBatch(firestore);

  batch.set(ticketRef, {
    ticketId: ticketRef.id,
    subject: payload.subject,
    category: payload.category,
    message: payload.message,
    status: 'open',
    createdBy: payload.createdBy,
    createdAt: now,
    updatedAt: now,
  });

  batch.set(activityRef, {
    type: 'Support Ticket',
    title: payload.subject,
    description: payload.message,
    module: 'Support',
    status: 'active',
    createdBy: payload.createdBy,
    createdAt: now,
  });

  await batch.commit();
  return ticketRef.id;
}
