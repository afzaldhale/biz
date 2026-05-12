const cache = new Map<string, unknown>();
const STORAGE_SYNC_EVENT = 'bizmanage-storage-sync';

function isBrowser() {
  return typeof window !== 'undefined';
}

function emitStorageChange(key: string) {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new CustomEvent(STORAGE_SYNC_EVENT, { detail: { key } }));
}

export function readCachedStorage<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }

  if (cache.has(key)) {
    return cache.get(key) as T;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    cache.set(key, fallback);
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as T;
    cache.set(key, parsed);
    return parsed;
  } catch {
    cache.set(key, fallback);
    return fallback;
  }
}

export function writeCachedStorage<T>(key: string, value: T) {
  if (!isBrowser()) {
    return;
  }

  cache.set(key, value);
  window.localStorage.setItem(key, JSON.stringify(value));
  emitStorageChange(key);
}

export function removeCachedStorage(key: string) {
  if (!isBrowser()) {
    return;
  }

  cache.delete(key);
  window.localStorage.removeItem(key);
  emitStorageChange(key);
}

export function subscribeToStorageKey(key: string, callback: () => void) {
  if (!isBrowser()) {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === key) {
      cache.delete(key);
      callback();
    }
  };

  const handleCustomEvent = (event: Event) => {
    const customEvent = event as CustomEvent<{ key?: string }>;
    if (customEvent.detail?.key === key) {
      callback();
    }
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(STORAGE_SYNC_EVENT, handleCustomEvent);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(STORAGE_SYNC_EVENT, handleCustomEvent);
  };
}
