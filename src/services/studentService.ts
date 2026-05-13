import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { StudentRecord } from '@/types';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { canAddRecord } from '@/utils/planLimits';

function ensureFirebaseConfigured() {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase environment variables are missing. Please configure NEXT_PUBLIC_FIREBASE_* values.');
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

  return docRef.id;
}

export async function updateStudent(businessId: string, studentId: string, student: StudentRecord) {
  await updateDoc(doc(getFirestoreDb(), `businesses/${businessId}/students`, studentId), {
    ...student,
  });
}

export async function deleteStudent(businessId: string, studentId: string) {
  await deleteDoc(doc(getFirestoreDb(), `businesses/${businessId}/students`, studentId));
}

export async function getStudents(businessId: string): Promise<StudentRecord[]> {
  const snapshot = await getDocs(collection(getFirestoreDb(), `businesses/${businessId}/students`));
  return snapshot.docs.map((studentDoc) => ({
    id: studentDoc.id,
    ...(studentDoc.data() as Omit<StudentRecord, 'id'>),
  }));
}

export async function getStudentById(businessId: string, studentId: string) {
  const studentDoc = await getDoc(doc(getFirestoreDb(), `businesses/${businessId}/students`, studentId));
  return studentDoc.exists()
    ? ({ id: studentDoc.id, ...(studentDoc.data() as Omit<StudentRecord, 'id'>) } as StudentRecord)
    : null;
}
