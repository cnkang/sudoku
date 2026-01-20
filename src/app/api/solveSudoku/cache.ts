interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class APICache<T> {
  private readonly cache = new Map<string, CacheItem<T>>();
  private readonly defaultTTL: number;

  constructor(defaultTTL = 30000) {
    // Default TTL of 30 seconds
    this.defaultTTL = defaultTTL;
  }

  set(key: string, data: T, ttl = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired cache entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const puzzleCache = new APICache();

// Periodically clean up expired cache entries
setInterval(() => puzzleCache.cleanup(), 60000); // Clean up every minute
