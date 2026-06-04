'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { removeUndefinedFields } from '@/utils/removeUndefinedFields';
import {
  incrementUsageInTransaction,
  decrementUsageInTransaction,
} from '@/services/subscriptionUsageService';

function ensureFirebaseConfigured() {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured');
  }
}

function getFirestoreDb() {
  ensureFirebaseConfigured();
  return db!;
}

function guestsCollection(businessId: string) {
  if (!businessId?.trim()) throw new Error('Business ID is required');
  return collection(getFirestoreDb(), 'businesses', businessId, 'hotelGuests');
}

function guestDocument(businessId: string, guestId: string) {
  if (!guestId?.trim()) throw new Error('Guest ID is required');
  return doc(getFirestoreDb(), 'businesses', businessId, 'hotelGuests', guestId);
}

function normalizeGuest(guest: any, documentId: string, createdAt: string, updatedAt: string) {
  return removeUndefinedFields({
    guestId: documentId,
    customerName: String(guest.customerName ?? '').trim(),
    age: Number(guest.age ?? 0),
    aadhaarNumber: String(guest.aadhaarNumber ?? '').trim(),
    vehicleNumber: guest.vehicleNumber?.trim() || undefined,
    address: String(guest.address ?? '').trim(),
    checkInDateTime: String(guest.checkInDateTime ?? ''),
    checkOutDateTime: guest.checkOutDateTime ?? null,
    createdAt,
    updatedAt,
  });
}

async function loadGuests(businessId: string) {
  const snapshot = await getDocs(
    query(guestsCollection(businessId), orderBy('createdAt', 'desc'), limit(1000))
  );
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export async function getHotelGuests(businessId: string) {
  return loadGuests(businessId);
}

export async function addHotelGuest(businessId: string, guest: any) {
  // Aadhaar validation must be enforced by caller, double-check here
  const aadhaar = String(guest.aadhaarNumber ?? '').trim();
  if (!/^[0-9]{12}$/.test(aadhaar)) {
    throw new Error('INVALID_AADHAAR');
  }

  // Prevent duplicate Aadhaar within same business
  const dupQuery = query(
    guestsCollection(businessId),
    where('aadhaarNumber', '==', aadhaar),
    limit(1)
  );
  const dupSnap = await getDocs(dupQuery);
  if (!dupSnap.empty) {
    throw new Error('DUPLICATE_AADHAAR');
  }

  const firestore = getFirestoreDb();
  const guestRef = doc(guestsCollection(businessId));

  await runTransaction(firestore, async (transaction) => {
    await incrementUsageInTransaction(transaction, businessId, 1);

    transaction.set(
      guestRef,
      removeUndefinedFields({
        guestId: guestRef.id,
        customerName: String(guest.customerName ?? '').trim(),
        age: Number(guest.age ?? 0),
        aadhaarNumber: String(guest.aadhaarNumber ?? '').trim(),
        vehicleNumber: guest.vehicleNumber?.trim() || undefined,
        address: String(guest.address ?? '').trim(),
        checkInDateTime: String(guest.checkInDateTime ?? ''),
        checkOutDateTime: guest.checkOutDateTime ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  return guestRef.id;
}

export async function updateHotelGuest(businessId: string, guestId: string, guest: any) {
  const aadhaar = String(guest.aadhaarNumber ?? '').trim();
  if (!/^[0-9]{12}$/.test(aadhaar)) {
    throw new Error('INVALID_AADHAAR');
  }

  // Check duplicate aadhaar on other documents
  const dupQuery = query(
    guestsCollection(businessId),
    where('aadhaarNumber', '==', aadhaar),
    limit(2)
  );
  const dupSnap = await getDocs(dupQuery);
  if (!dupSnap.empty) {
    const duplicates = dupSnap.docs.filter((d) => d.id !== guestId);
    if (duplicates.length > 0) throw new Error('DUPLICATE_AADHAAR');
  }

  const guestRef = guestDocument(businessId, guestId);
  const existing = await getDoc(guestRef);
  const createdAt = existing.exists()
    ? String(existing.data().createdAt ?? new Date().toISOString())
    : new Date().toISOString();
  await updateDoc(guestRef, normalizeGuest(guest, guestId, createdAt, new Date().toISOString()));
}

export async function deleteHotelGuest(businessId: string, guestId: string) {
  const firestore = getFirestoreDb();
  const guestRef = guestDocument(businessId, guestId);

  await runTransaction(firestore, async (transaction) => {
    const guestSnapshot = await transaction.get(guestRef);
    if (!guestSnapshot.exists()) return;

    await decrementUsageInTransaction(transaction, businessId, 1);
    transaction.delete(guestRef);
  });
}
