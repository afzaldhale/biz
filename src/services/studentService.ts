import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getCountFromServer,
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
import { StudentRecord } from '@/types';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { canAddRecord } from '@/utils/planLimits';
import { decrementBusinessUsage, safeIncrementBusinessUsage } from '@/services/businessService';

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

export async function addStudent(businessId: string, student: StudentRecord) {
  await canAddRecord(businessId, 'students');
  const firestore = getFirestoreDb();

  const docRef = await addDoc(collection(firestore, `businesses/${businessId}/students`), {
    ...student,
    createdAt: student.createdAt ?? new Date().toISOString(),
  });

  await safeIncrementBusinessUsage(businessId);
  return docRef.id;
}

export async function updateStudent(businessId: string, studentId: string, student: StudentRecord) {
  await updateDoc(doc(getFirestoreDb(), `businesses/${businessId}/students`, studentId), {
    ...student,
  });
}

export async function deleteStudent(businessId: string, studentId: string) {
  await deleteDoc(doc(getFirestoreDb(), `businesses/${businessId}/students`, studentId));
  await decrementBusinessUsage(businessId);
}

export interface PaginationOptions {
  pageSize?: number;
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
}

export interface PaginatedResult<T> {
  data: T[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

function getStudentQuery(
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
    collection(getFirestoreDb(), `businesses/${businessId}/students`),
    ...queryConstraints
  );
}

export async function getStudentsCount(businessId: string) {
  const snapshot = await getCountFromServer(
    query(collection(getFirestoreDb(), `businesses/${businessId}/students`))
  );
  return snapshot.data().count;
}

export async function getStudents(businessId: string): Promise<StudentRecord[]>;
export async function getStudents(
  businessId: string,
  options: PaginationOptions
): Promise<PaginatedResult<StudentRecord>>;
export async function getStudents(
  businessId: string,
  options?: PaginationOptions
): Promise<StudentRecord[] | PaginatedResult<StudentRecord>> {
  if (options) {
    const pageSize = options.pageSize ?? 25;
    const studentsQuery = getStudentQuery(businessId, pageSize, options.lastDoc ?? undefined);
    const snapshot = await getDocs(studentsQuery);
    const data = snapshot.docs.map((studentDoc) => ({
      id: studentDoc.id,
      ...(studentDoc.data() as Omit<StudentRecord, 'id'>),
    }));
    return {
      data,
      lastDoc: snapshot.docs.at(-1) ?? null,
      hasMore: data.length === pageSize,
    };
  }

  const studentsQuery = query(
    collection(getFirestoreDb(), `businesses/${businessId}/students`),
    orderBy('createdAt', 'desc'),
    orderBy('__name__', 'desc')
  );
  const snapshot = await getDocs(studentsQuery);
  return snapshot.docs.map((studentDoc) => ({
    id: studentDoc.id,
    ...(studentDoc.data() as Omit<StudentRecord, 'id'>),
  }));
}

export async function getStudentById(businessId: string, studentId: string) {
  const studentDoc = await getDoc(
    doc(getFirestoreDb(), `businesses/${businessId}/students`, studentId)
  );
  return studentDoc.exists()
    ? ({ id: studentDoc.id, ...(studentDoc.data() as Omit<StudentRecord, 'id'>) } as StudentRecord)
    : null;
}
