interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cacheMemoryStore: Record<string, CacheEntry<any>> = {};
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 Minutes TTL

/**
 * Invalidate in-memory and localStorage cache (specific key or all)
 */
export function invalidateAppCache(key?: string): void {
  if (key) {
    delete cacheMemoryStore[key];
    try {
      localStorage.removeItem(`stadium_cache_${key}`);
    } catch {}
  } else {
    Object.keys(cacheMemoryStore).forEach((k) => delete cacheMemoryStore[k]);
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('stadium_cache_')) {
          localStorage.removeItem(k);
        }
      });
    } catch {}
  }
}

export function getFromCache<T>(key: string, ttlMs: number = DEFAULT_CACHE_TTL_MS): T | null {
  const now = Date.now();

  // 1. In-Memory Cache
  if (cacheMemoryStore[key]) {
    const entry = cacheMemoryStore[key];
    if (now - entry.timestamp < ttlMs) {
      return entry.data as T;
    }
  }

  // 2. LocalStorage Cache (Instant 0ms on tab revisit)
  try {
    const raw = localStorage.getItem(`stadium_cache_${key}`);
    if (raw) {
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (now - entry.timestamp < ttlMs) {
        cacheMemoryStore[key] = entry;
        return entry.data;
      }
    }
  } catch {}

  return null;
}

export function saveToCache<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = { data, timestamp: Date.now() };
  cacheMemoryStore[key] = entry;
  try {
    localStorage.setItem(`stadium_cache_${key}`, JSON.stringify(entry));
  } catch {}
}
