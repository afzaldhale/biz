'use client';

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import {
  HotelBookingRecord,
  HotelGuestRecord,
  HotelHousekeepingRecord,
  HotelRoomRecord,
} from '@/types';
import { canAddRecord } from '@/utils/planLimits';
import { removeUndefinedFields } from '@/utils/removeUndefinedFields';
import { decrementBusinessUsage, safeIncrementBusinessUsage } from '@/services/businessService';
import { incrementUsageInTransaction, decrementUsageInTransaction } from '@/services/subscriptionUsageService';

function ensureFirebaseConfigured() {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase environment variables are missing. Please configure NEXT_PUBLIC_FIREBASE_* values.'
    );
  }
}

function getFirestoreDb() {
  ensureFirebaseConfigured();
  return db!;
}

function hotelCollection(businessId: string, collectionName: string) {
  if (!businessId?.trim()) {
    throw new Error('Business ID is required.');
  }

  return collection(getFirestoreDb(), 'businesses', businessId, collectionName);
}

function hotelDocument(businessId: string, collectionName: string, documentId: string) {
  if (!documentId?.trim()) {
    throw new Error('Document ID is required.');
  }

  return doc(getFirestoreDb(), 'businesses', businessId, collectionName, documentId);
}

function normalizeRoom(
  room: HotelRoomRecord | Omit<HotelRoomRecord, 'id'>,
  documentId: string,
  createdAt: string,
  updatedAt: string
) {
  return removeUndefinedFields({
    roomNumber: String(room.roomNumber ?? '').trim(),
    roomType: String(room.roomType ?? 'Standard'),
    ratePerNight: Number(room.ratePerNight ?? 0),
    status: String(room.status ?? 'available'),
    notes: room.notes?.trim() || undefined,
    createdAt,
    updatedAt,
    roomId: documentId,
  });
}

function normalizeGuest(
  guest: HotelGuestRecord | Omit<HotelGuestRecord, 'id'>,
  documentId: string,
  createdAt: string,
  updatedAt: string
) {
  return removeUndefinedFields({
    guestId: documentId,
    fullName: String(guest.fullName ?? ''),
    phone: String(guest.phone ?? ''),
    email: String(guest.email ?? ''),
    roomNumber: String(guest.roomNumber ?? ''),
    checkInDate: String(guest.checkInDate ?? ''),
    checkOutDate: String(guest.checkOutDate ?? ''),
    status: String(guest.status ?? 'reserved'),
    notes: guest.notes?.trim() || undefined,
    createdAt,
    updatedAt,
  });
}

function normalizeBooking(
  booking: HotelBookingRecord | Omit<HotelBookingRecord, 'id'>,
  documentId: string,
  createdAt: string,
  updatedAt: string
) {
  return removeUndefinedFields({
    bookingId: documentId,
    guestName: String(booking.guestName ?? ''),
    roomNumber: String(booking.roomNumber ?? ''),
    checkInDate: String(booking.checkInDate ?? ''),
    checkOutDate: String(booking.checkOutDate ?? ''),
    amount: Number(booking.amount ?? 0),
    status: String(booking.status ?? 'confirmed'),
    notes: booking.notes?.trim() || undefined,
    createdAt,
    updatedAt,
  });
}

function normalizeHousekeeping(
  task: HotelHousekeepingRecord | Omit<HotelHousekeepingRecord, 'id'>,
  documentId: string,
  createdAt: string,
  updatedAt: string
) {
  return removeUndefinedFields({
    taskTitle: String(task.taskTitle ?? ''),
    roomNumber: String(task.roomNumber ?? ''),
    assignedTo: String(task.assignedTo ?? ''),
    status: String(task.status ?? 'pending'),
    scheduledDate: String(task.scheduledDate ?? ''),
    notes: task.notes?.trim() || undefined,
    createdAt,
    updatedAt,
  });
}

function shouldCountGuestStatus(status: string) {
  return status === 'reserved' || status === 'checked-in';
}

function shouldCountBookingStatus(status: string) {
  return status === 'confirmed' || status === 'checked-in';
}

async function loadCollection<T>(businessId: string, collectionName: string) {
  const snapshot = await getDocs(
    query(hotelCollection(businessId, collectionName), orderBy('createdAt', 'desc'), limit(200))
  );
  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...(docSnapshot.data() as Omit<T, 'id'>),
  })) as T[];
}

export async function getHotelRooms(businessId: string) {
  return loadCollection<HotelRoomRecord>(businessId, 'rooms');
}

export async function getHotelGuests(businessId: string) {
  return loadCollection<HotelGuestRecord>(businessId, 'guests');
}

export async function getHotelBookings(businessId: string) {
  return loadCollection<HotelBookingRecord>(businessId, 'bookings');
}

export async function getHotelHousekeepingTasks(businessId: string) {
  return loadCollection<HotelHousekeepingRecord>(businessId, 'housekeeping');
}

export async function addHotelRoom(businessId: string, room: Omit<HotelRoomRecord, 'id'>) {
  const now = new Date().toISOString();
  const roomRef = doc(hotelCollection(businessId, 'rooms'));
  await setDoc(roomRef, normalizeRoom(room, roomRef.id, room.createdAt ?? now, now));
  return roomRef.id;
}

export async function updateHotelRoom(
  businessId: string,
  roomId: string,
  room: Omit<HotelRoomRecord, 'id'>
) {
  const roomRef = hotelDocument(businessId, 'rooms', roomId);
  const existing = await getDoc(roomRef);
  const createdAt = existing.exists()
    ? String(existing.data().createdAt ?? new Date().toISOString())
    : new Date().toISOString();
  await updateDoc(roomRef, normalizeRoom(room, roomId, createdAt, new Date().toISOString()));
}

export async function deleteHotelRoom(businessId: string, roomId: string) {
  await deleteDoc(hotelDocument(businessId, 'rooms', roomId));
}

export async function addHotelGuest(businessId: string, guest: Omit<HotelGuestRecord, 'id'>) {
  const shouldCount = shouldCountGuestStatus(guest.status ?? 'reserved');
  const now = new Date().toISOString();
  const guestRef = doc(hotelCollection(businessId, 'guests'));

  if (shouldCount) {
    const firestore = getFirestoreDb();
    await runTransaction(firestore, async (transaction) => {
      await incrementUsageInTransaction(transaction, businessId, 1);
      transaction.set(guestRef, {
        ...normalizeGuest(guest, guestRef.id, guest.createdAt ?? now, now),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  } else {
    await setDoc(guestRef, normalizeGuest(guest, guestRef.id, guest.createdAt ?? now, now));
  }

  return guestRef.id;
}

export async function updateHotelGuest(
  businessId: string,
  guestId: string,
  guest: Omit<HotelGuestRecord, 'id'>
) {
  const guestRef = hotelDocument(businessId, 'guests', guestId);
  const existing = await getDoc(guestRef);
  const previousStatus = existing.exists()
    ? String(existing.data().status ?? 'checked-out')
    : 'checked-out';
  const nextStatus = guest.status ?? 'reserved';
  const previouslyCounted = shouldCountGuestStatus(previousStatus);
  const nextCounted = shouldCountGuestStatus(nextStatus);

  if (!previouslyCounted && nextCounted) {
    const firestore = getFirestoreDb();
    await runTransaction(firestore, async (transaction) => {
      await incrementUsageInTransaction(transaction, businessId, 1);
      transaction.update(guestRef, {
        ...normalizeGuest(guest, guestId, createdAt, new Date().toISOString()),
        updatedAt: serverTimestamp(),
      });
    });
    return;
  }

  if (previouslyCounted && !nextCounted) {
    const firestore = getFirestoreDb();
    await runTransaction(firestore, async (transaction) => {
      await decrementUsageInTransaction(transaction, businessId, 1);
      transaction.update(guestRef, {
        ...normalizeGuest(guest, guestId, createdAt, new Date().toISOString()),
        updatedAt: serverTimestamp(),
      });
    });
    return;
  }

  const createdAt = existing.exists()
    ? String(existing.data().createdAt ?? new Date().toISOString())
    : new Date().toISOString();
  await updateDoc(guestRef, normalizeGuest(guest, guestId, createdAt, new Date().toISOString()));
}

export async function deleteHotelGuest(businessId: string, guestId: string) {
  const guestRef = hotelDocument(businessId, 'guests', guestId);
  const firestore = getFirestoreDb();
  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(guestRef);
    if (!snapshot.exists()) return;
    const status = String(snapshot.data().status ?? 'checked-out');
    if (shouldCountGuestStatus(status)) {
      await decrementUsageInTransaction(transaction, businessId, 1);
    }
    transaction.delete(guestRef);
  });
}

export async function addHotelBooking(businessId: string, booking: Omit<HotelBookingRecord, 'id'>) {
  const shouldCount = shouldCountBookingStatus(booking.status ?? 'confirmed');
  const now = new Date().toISOString();
  const bookingRef = doc(hotelCollection(businessId, 'bookings'));

  if (shouldCount) {
    const firestore = getFirestoreDb();
    await runTransaction(firestore, async (transaction) => {
      await incrementUsageInTransaction(transaction, businessId, 1);
      transaction.set(bookingRef, {
        ...normalizeBooking(booking, bookingRef.id, booking.createdAt ?? now, now),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  } else {
    await setDoc(bookingRef, normalizeBooking(booking, bookingRef.id, booking.createdAt ?? now, now));
  }

  return bookingRef.id;
}

export async function updateHotelBooking(
  businessId: string,
  bookingId: string,
  booking: Omit<HotelBookingRecord, 'id'>
) {
  const bookingRef = hotelDocument(businessId, 'bookings', bookingId);
  const existing = await getDoc(bookingRef);
  const previousStatus = existing.exists()
    ? String(existing.data().status ?? 'cancelled')
    : 'cancelled';
  const nextStatus = booking.status ?? 'confirmed';
  const previouslyCounted = shouldCountBookingStatus(previousStatus);
  const nextCounted = shouldCountBookingStatus(nextStatus);

  if (!previouslyCounted && nextCounted) {
    const firestore = getFirestoreDb();
    await runTransaction(firestore, async (transaction) => {
      await incrementUsageInTransaction(transaction, businessId, 1);
      transaction.update(bookingRef, {
        ...normalizeBooking(booking, bookingId, createdAt, new Date().toISOString()),
        updatedAt: serverTimestamp(),
      });
    });
    return;
  }

  if (previouslyCounted && !nextCounted) {
    const firestore = getFirestoreDb();
    await runTransaction(firestore, async (transaction) => {
      await decrementUsageInTransaction(transaction, businessId, 1);
      transaction.update(bookingRef, {
        ...normalizeBooking(booking, bookingId, createdAt, new Date().toISOString()),
        updatedAt: serverTimestamp(),
      });
    });
    return;
  }

  const createdAt = existing.exists()
    ? String(existing.data().createdAt ?? new Date().toISOString())
    : new Date().toISOString();
  await updateDoc(
    bookingRef,
    normalizeBooking(booking, bookingId, createdAt, new Date().toISOString())
  );
}

export async function deleteHotelBooking(businessId: string, bookingId: string) {
  const bookingRef = hotelDocument(businessId, 'bookings', bookingId);
  const firestore = getFirestoreDb();
  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(bookingRef);
    if (!snapshot.exists()) return;
    const status = String(snapshot.data().status ?? 'cancelled');
    if (shouldCountBookingStatus(status)) {
      await decrementUsageInTransaction(transaction, businessId, 1);
    }
    transaction.delete(bookingRef);
  });
}

export async function addHotelHousekeepingTask(
  businessId: string,
  task: Omit<HotelHousekeepingRecord, 'id'>
) {
  const now = new Date().toISOString();
  const taskRef = doc(hotelCollection(businessId, 'housekeeping'));
  await setDoc(taskRef, normalizeHousekeeping(task, taskRef.id, task.createdAt ?? now, now));
  return taskRef.id;
}

export async function updateHotelHousekeepingTask(
  businessId: string,
  taskId: string,
  task: Omit<HotelHousekeepingRecord, 'id'>
) {
  const taskRef = hotelDocument(businessId, 'housekeeping', taskId);
  const existing = await getDoc(taskRef);
  const createdAt = existing.exists()
    ? String(existing.data().createdAt ?? new Date().toISOString())
    : new Date().toISOString();
  await updateDoc(
    taskRef,
    normalizeHousekeeping(task, taskId, createdAt, new Date().toISOString())
  );
}

export async function deleteHotelHousekeepingTask(businessId: string, taskId: string) {
  await deleteDoc(hotelDocument(businessId, 'housekeeping', taskId));
}
