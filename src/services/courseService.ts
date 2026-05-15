import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { canAddRecord } from '@/utils/planLimits';
import { decrementBusinessUsage, safeIncrementBusinessUsage } from '@/services/businessService';

export interface CourseRecord {
  id: string;
  title: string;
  instructor: string;
  category: string;
  duration: string;
  fee: number;
  notes?: string;
  createdAt?: string;
}

function ensureFirebaseConfigured() {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase environment variables are missing. Please configure NEXT_PUBLIC_FIREBASE_* values.');
  }
}

function getFirestoreDb() {
  ensureFirebaseConfigured();
  return db!;
}

export async function addCourse(businessId: string, course: Omit<CourseRecord, 'id'>) {
  const docRef = await addDoc(collection(getFirestoreDb(), `businesses/${businessId}/courses`), {
    ...course,
    createdAt: course.createdAt ?? new Date().toISOString(),
  });
  await safeIncrementBusinessUsage(businessId);
  return docRef.id;
}

export async function updateCourse(businessId: string, courseId: string, course: Omit<CourseRecord, 'id'>) {
  await updateDoc(doc(getFirestoreDb(), `businesses/${businessId}/courses`, courseId), course);
}

export async function deleteCourse(businessId: string, courseId: string) {
  await deleteDoc(doc(getFirestoreDb(), `businesses/${businessId}/courses`, courseId));
  await decrementBusinessUsage(businessId);
}

export async function getCourses(businessId: string): Promise<CourseRecord[]> {
  const snapshot = await getDocs(collection(getFirestoreDb(), `businesses/${businessId}/courses`));
  return snapshot.docs.map((courseDoc) => ({
    id: courseDoc.id,
    ...(courseDoc.data() as Omit<CourseRecord, 'id'>),
  }));
}

export async function getCourseById(businessId: string, courseId: string) {
  const courseDoc = await getDoc(doc(getFirestoreDb(), `businesses/${businessId}/courses`, courseId));
  return courseDoc.exists() ? { id: courseDoc.id, ...courseDoc.data() } : null;
}
