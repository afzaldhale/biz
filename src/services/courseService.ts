import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';

interface CourseRecord {
  id: string;
  createdAt?: string;
  [key: string]: unknown;
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

export async function addCourse(businessId: string, course: CourseRecord) {
  const docRef = await addDoc(collection(getFirestoreDb(), `businesses/${businessId}/courses`), {
    ...course,
    createdAt: course.createdAt ?? new Date().toISOString(),
  });
  return docRef.id;
}

export async function updateCourse(businessId: string, courseId: string, course: CourseRecord) {
  await updateDoc(doc(getFirestoreDb(), `businesses/${businessId}/courses`, courseId), course);
}

export async function deleteCourse(businessId: string, courseId: string) {
  await deleteDoc(doc(getFirestoreDb(), `businesses/${businessId}/courses`, courseId));
}

export async function getCourses(businessId: string) {
  const snapshot = await getDocs(collection(getFirestoreDb(), `businesses/${businessId}/courses`));
  return snapshot.docs.map((courseDoc) => ({ id: courseDoc.id, ...courseDoc.data() }));
}

export async function getCourseById(businessId: string, courseId: string) {
  const courseDoc = await getDoc(doc(getFirestoreDb(), `businesses/${businessId}/courses`, courseId));
  return courseDoc.exists() ? { id: courseDoc.id, ...courseDoc.data() } : null;
}
