import { StudentRecord } from '@/types';
import { canAddRecord } from '@/utils/planLimits';
import { readCachedStorage, writeCachedStorage } from './storageCache';

const STUDENTS_PREFIX = 'bizmanage_students';

function getStorageKey(businessId: string) {
  return `${STUDENTS_PREFIX}:${businessId}`;
}

function readStudents(businessId: string): StudentRecord[] {
  return readCachedStorage<StudentRecord[]>(getStorageKey(businessId), []);
}

export async function addStudent(businessId: string, student: StudentRecord) {
  await canAddRecord(businessId, 'students');
  const students = readStudents(businessId);
  const created = {
    ...student,
    createdAt: student.createdAt ?? new Date().toISOString(),
  };

  writeCachedStorage(getStorageKey(businessId), [created, ...students]);
  return created.id;
}

export async function updateStudent(businessId: string, studentId: string, student: StudentRecord) {
  const students = readStudents(businessId).map((item) =>
    item.id === studentId ? { ...item, ...student } : item,
  );
  writeCachedStorage(getStorageKey(businessId), students);
}

export async function deleteStudent(businessId: string, studentId: string) {
  const students = readStudents(businessId).filter((item) => item.id !== studentId);
  writeCachedStorage(getStorageKey(businessId), students);
}

export async function getStudents(businessId: string): Promise<StudentRecord[]> {
  return readStudents(businessId);
}

export async function getStudentById(businessId: string, studentId: string) {
  return readStudents(businessId).find((student) => student.id === studentId) ?? null;
}
