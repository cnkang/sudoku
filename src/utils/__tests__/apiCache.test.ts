import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clientCache, fetchWithCache } from '../apiCache';

// Mock fetch
globalThis.fetch = vi.fn();

describe('apiCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clientCache.clear();
  });

  describe('ClientCache', () => {
    it('should cache and retrieve data', () => {
      const testData = { test: 'data' };
      clientCache.set('test-key', testData);

      const retrieved = clientCache.get('test-key');
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent key', () => {
      const result = clientCache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should expire cache after maxAge', () => {
      vi.useFakeTimers();

      clientCache.set('test-key', { data: 'test' });

      // Fast forward past expiration (30 seconds)
      vi.advanceTimersByTime(30001);

      const result = clientCache.get('test-key');
      expect(result).toBeNull();

      vi.useRealTimers();
    });

    it('should store and retrieve ETag', () => {
      clientCache.set('test-key', { data: 'test' }, 'etag-123');

      const etag = clientCache.getETag('test-key');
      expect(etag).toBe('etag-123');
    });
  });

  describe('fetchWithCache', () => {
    it('should return cached data when available', async () => {
      const testData = { cached: true };
      clientCache.set('test-url-{}', testData);

      const result = await fetchWithCache('test-url');
      expect(result).toEqual(testData);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should fetch and cache new data', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'new' }),
        headers: new Map([['ETag', 'new-etag']]),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      const result = await fetchWithCache('test-url');

      expect(fetch).toHaveBeenCalledWith('test-url', {});
      expect(result).toEqual({ data: 'new' });
    });

    it('should bypass cache with forceRefresh', async () => {
      clientCache.set('test-url-{}', { cached: true });

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'fresh' }),
        headers: new Map(),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      const result = await fetchWithCache('test-url', {}, true);

      expect(fetch).toHaveBeenCalled();
      expect(result).toEqual({ data: 'fresh' });
    });

    it('should handle 304 Not Modified response', async () => {
      const cachedData = { cached: true };
      clientCache.set('test-url-{}', cachedData, 'old-etag');

      const mockResponse = { status: 304, ok: false };
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      const result = await fetchWithCache('test-url');

      expect(result).toEqual(cachedData);
    });

    it('should include If-None-Match header when cached ETag exists', async () => {
      clientCache.set('etag-url-{}', { stale: true }, 'etag-123');

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ fresh: true }),
        headers: new Headers({ ETag: 'etag-456' }),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      await fetchWithCache('etag-url', {}, true);

      expect(fetch).toHaveBeenCalledWith(
        'etag-url',
        expect.objectContaining({
          headers: expect.objectContaining({
            'If-None-Match': 'etag-123',
          }),
        })
      );
    });

    it('should return cached data on 304 when force refresh is enabled', async () => {
      const cachedData = { cached: 'value' };
      clientCache.set('revalidate-url-{}', cachedData, 'etag-123');

      const mockResponse = { status: 304, ok: false };
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      const result = await fetchWithCache('revalidate-url', {}, true);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual(cachedData);
    });

    it('should throw error for failed requests', async () => {
      const mockResponse = { ok: false, status: 500 };
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      await expect(fetchWithCache('test-url')).rejects.toThrow(
        'HTTP error! status: 500'
      );
    });
  });
});
