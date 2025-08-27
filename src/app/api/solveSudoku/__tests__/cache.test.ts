import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock setInterval to prevent side effects
vi.mock('node:timers', () => ({
  setInterval: vi.fn(),
}));

// Import after mocking to ensure setInterval is mocked
const { puzzleCache } = await import('../cache.js');

// Create a test cache class that extends the functionality for testing
class TestAPICache<T> {
  private cache = new Map<
    string,
    { data: T; timestamp: number; ttl: number }
  >();
  private readonly defaultTTL: number;

  constructor(defaultTTL = 30000) {
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

  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  size(): number {
    return this.cache.size;
  }
}

describe('APICache', () => {
  let cache: TestAPICache<any>;
  let mockNow: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    cache = new TestAPICache(5000); // 5 second TTL for testing
    mockNow = vi.spyOn(Date, 'now');
    mockNow.mockReturnValue(1000000); // Fixed timestamp
  });

  afterEach(() => {
    mockNow.mockRestore();
  });

  describe('Basic Operations', () => {
    it('should store and retrieve data', () => {
      const testData = { puzzle: [[1, 2, 3]] };

      cache.set('test-key', testData);
      const retrieved = cache.get('test-key');

      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      expect(cache.get('non-existent')).toBeNull();
    });

    it('should check if key exists', () => {
      cache.set('exists', { data: 'test' });

      expect(cache.has('exists')).toBe(true);
      expect(cache.has('not-exists')).toBe(false);
    });

    it('should clear all cache entries', () => {
      cache.set('key1', { data: 'test1' });
      cache.set('key2', { data: 'test2' });

      expect(cache.size()).toBe(2);

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeNull();
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should use default TTL when not specified', () => {
      const defaultCache = new TestAPICache(10000); // 10 second default
      defaultCache.set('test', { data: 'value' });

      // Should exist immediately
      expect(defaultCache.get('test')).toEqual({ data: 'value' });
    });

    it('should use custom TTL when specified', () => {
      cache.set('short-lived', { data: 'test' }, 1000); // 1 second TTL

      // Should exist immediately
      expect(cache.get('short-lived')).toEqual({ data: 'test' });

      // Advance time by 1.5 seconds
      mockNow.mockReturnValue(1000000 + 1500);

      // Should be expired
      expect(cache.get('short-lived')).toBeNull();
    });

    it('should expire entries after TTL', () => {
      cache.set('expires', { data: 'test' });

      // Should exist within TTL
      mockNow.mockReturnValue(1000000 + 4000); // 4 seconds later
      expect(cache.get('expires')).toEqual({ data: 'test' });

      // Should be expired after TTL
      mockNow.mockReturnValue(1000000 + 6000); // 6 seconds later
      expect(cache.get('expires')).toBeNull();
    });

    it('should remove expired entries when accessed', () => {
      cache.set('auto-remove', { data: 'test' });
      expect(cache.size()).toBe(1);

      // Advance time past TTL
      mockNow.mockReturnValue(1000000 + 6000);

      // Accessing expired entry should remove it
      expect(cache.get('auto-remove')).toBeNull();
      expect(cache.size()).toBe(0);
    });
  });

  describe('Cleanup Operations', () => {
    it('should cleanup expired entries', () => {
      // Add multiple entries with different TTLs
      cache.set('short1', { data: 'test1' }, 1000);
      cache.set('short2', { data: 'test2' }, 1000);
      cache.set('long', { data: 'test3' }, 10000);

      expect(cache.size()).toBe(3);

      // Advance time to expire short-lived entries
      mockNow.mockReturnValue(1000000 + 2000);

      cache.cleanup();

      expect(cache.size()).toBe(1);
      expect(cache.get('long')).toEqual({ data: 'test3' });
      expect(cache.get('short1')).toBeNull();
      expect(cache.get('short2')).toBeNull();
    });

    it('should not remove non-expired entries during cleanup', () => {
      cache.set('valid1', { data: 'test1' });
      cache.set('valid2', { data: 'test2' });

      // Advance time but not past TTL
      mockNow.mockReturnValue(1000000 + 3000);

      cache.cleanup();

      expect(cache.size()).toBe(2);
      expect(cache.get('valid1')).toEqual({ data: 'test1' });
      expect(cache.get('valid2')).toEqual({ data: 'test2' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero TTL', () => {
      cache.set('immediate-expire', { data: 'test' }, 0);

      // Advance time by 1ms to trigger expiration
      mockNow.mockReturnValue(1000001);

      // Should be expired immediately
      expect(cache.get('immediate-expire')).toBeNull();
    });

    it('should handle negative TTL', () => {
      cache.set('negative-ttl', { data: 'test' }, -1000);

      // Should be expired immediately
      expect(cache.get('negative-ttl')).toBeNull();
    });

    it('should handle overwriting existing keys', () => {
      cache.set('overwrite', { data: 'original' });
      cache.set('overwrite', { data: 'updated' });

      expect(cache.get('overwrite')).toEqual({ data: 'updated' });
      expect(cache.size()).toBe(1);
    });

    it('should handle different data types', () => {
      const testCases = [
        { key: 'string', value: 'test string' },
        { key: 'number', value: 42 },
        { key: 'object', value: { nested: { data: 'test' } } },
        { key: 'array', value: [1, 2, 3] },
        { key: 'boolean', value: true },
        { key: 'null', value: null },
      ];

      testCases.forEach(({ key, value }) => {
        cache.set(key, value);
        expect(cache.get(key)).toEqual(value);
      });
    });
  });

  describe('Performance Characteristics', () => {
    it('should handle large number of entries', () => {
      const entryCount = 1000;

      // Add many entries
      for (let i = 0; i < entryCount; i++) {
        cache.set(`key-${i}`, { data: `value-${i}` });
      }

      expect(cache.size()).toBe(entryCount);

      // Verify random entries
      expect(cache.get('key-100')).toEqual({ data: 'value-100' });
      expect(cache.get('key-500')).toEqual({ data: 'value-500' });
      expect(cache.get('key-999')).toEqual({ data: 'value-999' });
    });

    it('should efficiently cleanup large number of expired entries', () => {
      const entryCount = 500;

      // Add entries that will expire
      for (let i = 0; i < entryCount; i++) {
        cache.set(`expire-${i}`, { data: `value-${i}` }, 1000);
      }

      // Add entries that won't expire
      for (let i = 0; i < entryCount; i++) {
        cache.set(`keep-${i}`, { data: `value-${i}` }, 10000);
      }

      expect(cache.size()).toBe(entryCount * 2);

      // Expire half the entries
      mockNow.mockReturnValue(1000000 + 2000);

      cache.cleanup();

      expect(cache.size()).toBe(entryCount);
    });
  });

  describe('Exported puzzleCache', () => {
    beforeEach(() => {
      puzzleCache.clear();
    });

    it('should be available as exported instance', () => {
      expect(puzzleCache).toBeDefined();
      expect(typeof puzzleCache.set).toBe('function');
      expect(typeof puzzleCache.get).toBe('function');
    });

    it('should work with exported instance', () => {
      const testData = { puzzle: 'test' };
      puzzleCache.set('test-key', testData);
      expect(puzzleCache.get('test-key')).toEqual(testData);
    });

    it('should handle expired entries in exported instance', () => {
      puzzleCache.set('expire-test', { data: 'test' }, 1000);

      // Advance time past TTL
      mockNow.mockReturnValue(1000000 + 2000);

      // Should return null and remove expired entry
      expect(puzzleCache.get('expire-test')).toBeNull();
    });

    it('should return false for has() on non-existent key', () => {
      expect(puzzleCache.has('non-existent-key')).toBe(false);
    });

    it('should cleanup expired entries in exported instance', () => {
      // Add entries with different TTLs
      puzzleCache.set('short1', { data: 'test1' }, 1000);
      puzzleCache.set('short2', { data: 'test2' }, 1000);
      puzzleCache.set('long', { data: 'test3' }, 10000);

      // Advance time to expire short-lived entries
      mockNow.mockReturnValue(1000000 + 2000);

      puzzleCache.cleanup();

      // Only long-lived entry should remain
      expect(puzzleCache.get('long')).toEqual({ data: 'test3' });
      expect(puzzleCache.get('short1')).toBeNull();
      expect(puzzleCache.get('short2')).toBeNull();
    });
  });
});
