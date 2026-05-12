import { readCachedStorage, writeCachedStorage } from './storageCache';

interface CourseRecord {
  id: string;
  createdAt?: string;
  [key: string]: unknown;
}

const COURSES_PREFIX = 'bizmanage_courses';

function getStorageKey(businessId: string) {
  return `${COURSES_PREFIX}:${businessId}`;
}

function readCourses(businessId: string): CourseRecord[] {
  return readCachedStorage<CourseRecord[]>(getStorageKey(businessId), []);
}

export async function addCourse(businessId: string, course: CourseRecord) {
  const created = { ...course, createdAt: course.createdAt ?? new Date().toISOString() };
  writeCachedStorage(getStorageKey(businessId), [created, ...readCourses(businessId)]);
  return created.id;
}

export async function updateCourse(businessId: string, courseId: string, course: CourseRecord) {
  writeCachedStorage(
    getStorageKey(businessId),
    readCourses(businessId).map((item) => (item.id === courseId ? { ...item, ...course } : item)),
  );
}

export async function deleteCourse(businessId: string, courseId: string) {
  writeCachedStorage(
    getStorageKey(businessId),
    readCourses(businessId).filter((item) => item.id !== courseId),
  );
}

export async function getCourses(businessId: string) {
  return readCourses(businessId);
}

export async function getCourseById(businessId: string, courseId: string) {
  return readCourses(businessId).find((course) => course.id === courseId) ?? null;
}
