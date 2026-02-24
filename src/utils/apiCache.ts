import { UTILITY_ERRORS } from '@/utils/errorMessages';

interface CachedResponse {
  data: unknown;
  timestamp: number;
  etag?: string;
}

class ClientCache {
  private readonly cache = new Map<string, CachedResponse>();
  private readonly maxAge = 30000; // 30 seconds
  private readonly maxEntries = 50; // LRU eviction threshold

  set(key: string, data: unknown, etag?: string): void {
    // If key already exists, delete first so re-insertion moves it to the end (most recent)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest entries if at capacity
    while (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey === undefined) {
        break;
      }
      this.cache.delete(oldestKey);
    }

    const entry: CachedResponse = {
      data,
      timestamp: Date.now(),
      ...(etag ? { etag } : {}),
    };
    this.cache.set(key, entry);
  }

  get(key: string): unknown {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used) for LRU ordering
    this.cache.delete(key);
    this.cache.set(key, item);

    return item.data;
  }

  getETag(key: string): string | null {
    const item = this.cache.get(key);
    return item?.etag || null;
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

export const clientCache = new ClientCache();

export async function fetchWithCache(
  url: string,
  options: RequestInit = {},
  forceRefresh = false
): Promise<unknown> {
  const cacheKey = `${url}-${JSON.stringify(options)}`;

  // Check client cache (when not force refreshing)
  if (!forceRefresh) {
    const cached = clientCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Add conditional request headers
  const etag = clientCache.getETag(cacheKey);
  if (etag) {
    options.headers = {
      ...options.headers,
      'If-None-Match': etag,
    };
  }

  const response = await fetch(url, options);

  // 304 Not Modified - use cache
  const cachedData = clientCache.get(cacheKey);
  if (response.status === 304 && cachedData) {
    return cachedData;
  }

  if (!response.ok) {
    throw new Error(UTILITY_ERRORS.HTTP_ERROR(response.status));
  }

  const data = await response.json();
  const responseETag = response.headers.get('ETag');

  // Cache response
  clientCache.set(cacheKey, data, responseETag ?? undefined);

  return data;
}
