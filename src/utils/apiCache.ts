interface CachedResponse {
  data: unknown;
  timestamp: number;
  etag?: string;
}

class ClientCache {
  private readonly cache = new Map<string, CachedResponse>();
  private readonly maxAge = 30000; // 30 seconds

  set(key: string, data: unknown, etag?: string): void {
    const entry: CachedResponse = {
      data,
      timestamp: Date.now(),
      ...(etag ? { etag } : {}),
    };
    this.cache.set(key, entry);
  }

  get(key: string): unknown | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  getETag(key: string): string | null {
    const item = this.cache.get(key);
    return item?.etag || null;
  }

  clear(): void {
    this.cache.clear();
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
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  const responseETag = response.headers.get('ETag');

  // Cache response
  clientCache.set(cacheKey, data, responseETag ?? undefined);

  return data;
}
