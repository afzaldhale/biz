export function removeUndefinedFields<T extends Record<string, unknown>>(obj: T) {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as T;
}
