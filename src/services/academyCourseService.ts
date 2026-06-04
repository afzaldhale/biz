import { addDoc, deleteDoc, getDocs, orderBy, query, setDoc, updateDoc } from 'firebase/firestore';
import { AcademyCourse } from '@/types';
import {
  academyCollection,
  academyDoc,
  firestoreTimestamp,
  getFirestoreDb,
  mapSnapshot,
  normalizeDateValue,
} from './academyShared';

export interface AcademyCourseInput {
  courseName: string;
  duration: string;
  fees: number;
  description: string;
  status: AcademyCourse['status'];
}

function normalizeCourse(data: Record<string, unknown>, id: string): AcademyCourse {
  return {
    id,
    courseId: String(data.courseId ?? id),
    courseName: String(data.courseName ?? ''),
    duration: String(data.duration ?? ''),
    fees: Number(data.fees ?? 0),
    description: String(data.description ?? ''),
    status: (data.status as AcademyCourse['status']) ?? 'active',
    createdAt: normalizeDateValue(data.createdAt),
    updatedAt: normalizeDateValue(data.updatedAt),
  };
}

export async function getAcademyCourses(businessId: string) {
  const snapshot = await getDocs(
    query(academyCollection(businessId, 'courses'), orderBy('createdAt', 'desc'))
  );
  return snapshot.docs.map((doc) => mapSnapshot<AcademyCourse>(doc, normalizeCourse));
}

export async function createAcademyCourse(businessId: string, input: AcademyCourseInput) {
  const collectionRef = academyCollection(businessId, 'courses');
  const docRef = await addDoc(collectionRef, {
    courseName: input.courseName.trim(),
    duration: input.duration.trim(),
    fees: Number(input.fees) || 0,
    description: input.description.trim(),
    status: input.status,
    createdAt: firestoreTimestamp(),
    updatedAt: firestoreTimestamp(),
  });

  await setDoc(
    docRef,
    {
      courseId: docRef.id,
    },
    { merge: true }
  );
  return docRef.id;
}

export async function updateAcademyCourse(
  businessId: string,
  courseId: string,
  input: AcademyCourseInput
) {
  await updateDoc(academyDoc(businessId, 'courses', courseId), {
    courseName: input.courseName.trim(),
    duration: input.duration.trim(),
    fees: Number(input.fees) || 0,
    description: input.description.trim(),
    status: input.status,
    updatedAt: firestoreTimestamp(),
  });
}

export async function deleteAcademyCourse(businessId: string, courseId: string) {
  await deleteDoc(academyDoc(businessId, 'courses', courseId));
}

export async function getCourseEnrollmentCounts(businessId: string) {
  const snapshot = await getDocs(academyCollection(businessId, 'enrollments'));
  const counts = new Map<string, number>();

  snapshot.docs.forEach((enrollmentDoc) => {
    const data = enrollmentDoc.data();
    if ((data.status as string) === 'cancelled') {
      return;
    }
    const courseId = String(data.courseId ?? '');
    counts.set(courseId, (counts.get(courseId) ?? 0) + 1);
  });

  return counts;
}
