import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  QueryConstraint,
  QueryDocumentSnapshot,
  startAfter,
  updateDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { canAddRecord } from '@/utils/planLimits';
import { decrementBusinessUsage, safeIncrementBusinessUsage } from '@/services/businessService';

export interface PaginationOptions {
  pageSize?: number;
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
}

export interface PaginatedResult<T> {
  data: T[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

function getCoursesQuery(
  businessId: string,
  pageSize: number,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
) {
  const queryConstraints: QueryConstraint[] = [
    orderBy('createdAt', 'desc'),
    orderBy('__name__', 'desc'),
    limit(pageSize),
  ];

  if (lastDoc) {
    queryConstraints.push(startAfter(lastDoc));
  }

  return query(
    collection(getFirestoreDb(), `businesses/${businessId}/courses`),
    ...queryConstraints
  );
}

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
    throw new Error(
      'Firebase environment variables are missing. Please configure NEXT_PUBLIC_FIREBASE_* values.'
    );
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

export async function updateCourse(
  businessId: string,
  courseId: string,
  course: Omit<CourseRecord, 'id'>
) {
  await updateDoc(doc(getFirestoreDb(), `businesses/${businessId}/courses`, courseId), course);
}

export async function deleteCourse(businessId: string, courseId: string) {
  await deleteDoc(doc(getFirestoreDb(), `businesses/${businessId}/courses`, courseId));
  await decrementBusinessUsage(businessId);
}

export async function getCourses(businessId: string): Promise<CourseRecord[]>;
export async function getCourses(
  businessId: string,
  options: PaginationOptions
): Promise<PaginatedResult<CourseRecord>>;
export async function getCourses(
  businessId: string,
  options?: PaginationOptions
): Promise<CourseRecord[] | PaginatedResult<CourseRecord>> {
  if (options) {
    const pageSize = options.pageSize ?? 25;
    const coursesQuery = getCoursesQuery(businessId, pageSize, options.lastDoc ?? undefined);
    const snapshot = await getDocs(coursesQuery);
    const data = snapshot.docs.map((courseDoc) => ({
      id: courseDoc.id,
      ...(courseDoc.data() as Omit<CourseRecord, 'id'>),
    }));
    return {
      data,
      lastDoc: snapshot.docs.at(-1) ?? null,
      hasMore: data.length === pageSize,
    };
  }

  const snapshot = await getDocs(collection(getFirestoreDb(), `businesses/${businessId}/courses`));
  return snapshot.docs.map((courseDoc) => ({
    id: courseDoc.id,
    ...(courseDoc.data() as Omit<CourseRecord, 'id'>),
  }));
}

export async function getCourseById(businessId: string, courseId: string) {
  const courseDoc = await getDoc(
    doc(getFirestoreDb(), `businesses/${businessId}/courses`, courseId)
  );
  return courseDoc.exists() ? { id: courseDoc.id, ...courseDoc.data() } : null;
}
