/**
 * Tests for request deduplication utility
 * Validates Requirement 5.6
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanupExpiredRequests,
  clearPendingRequests,
  createRequestKey,
  deduplicateRequest,
  getPendingRequestCount,
} from '../requestDeduplication';

describe('requestDeduplication', () => {
  beforeEach(() => {
    clearPendingRequests();
  });

  describe('deduplicateRequest', () => {
    it('should execute request only once for duplicate calls within 5s window', async () => {
      const mockFn = vi.fn().mockResolvedValue({ data: 'test' });
      const key = 'test-request';

      // Make three concurrent requests with the same key
      const [result1, result2, result3] = await Promise.all([
        deduplicateRequest(key, mockFn),
        deduplicateRequest(key, mockFn),
        deduplicateRequest(key, mockFn),
      ]);

      // All should return the same result
      expect(result1).toEqual({ data: 'test' });
      expect(result2).toEqual({ data: 'test' });
      expect(result3).toEqual({ data: 'test' });

      // But the function should only be called once
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should share results across duplicate requests', async () => {
      let callCount = 0;
      const mockFn = vi.fn().mockImplementation(async () => {
        callCount++;
        await new Promise(resolve => setTimeout(resolve, 50));
        return { count: callCount };
      });

      const key = 'shared-request';

      // Start first request
      const promise1 = deduplicateRequest(key, mockFn);

      // Start second request while first is still pending
      await new Promise(resolve => setTimeout(resolve, 10));
      const promise2 = deduplicateRequest(key, mockFn);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Both should get the same result (count: 1)
      expect(result1).toEqual({ count: 1 });
      expect(result2).toEqual({ count: 1 });
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should execute new request after 5s window expires', async () => {
      const mockFn = vi
        .fn()
        .mockResolvedValueOnce({ data: 'first' })
        .mockResolvedValueOnce({ data: 'second' });

      const key = 'time-window-test';

      // First request
      const result1 = await deduplicateRequest(key, mockFn);
      expect(result1).toEqual({ data: 'first' });

      // Wait for deduplication window to expire (5s + buffer)
      vi.useFakeTimers();
      vi.advanceTimersByTime(5100);
      vi.useRealTimers();

      // Second request after window expires
      const result2 = await deduplicateRequest(key, mockFn);
      expect(result2).toEqual({ data: 'second' });

      // Should have been called twice
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should handle errors and allow retry', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: 'success' });

      const key = 'error-test';

      // First request fails
      await expect(deduplicateRequest(key, mockFn)).rejects.toThrow(
        'Network error'
      );

      // Second request should execute (not deduplicated after error)
      const result = await deduplicateRequest(key, mockFn);
      expect(result).toEqual({ data: 'success' });

      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should handle different keys independently', async () => {
      const mockFn1 = vi.fn().mockResolvedValue({ data: 'request1' });
      const mockFn2 = vi.fn().mockResolvedValue({ data: 'request2' });

      const [result1, result2] = await Promise.all([
        deduplicateRequest('key1', mockFn1),
        deduplicateRequest('key2', mockFn2),
      ]);

      expect(result1).toEqual({ data: 'request1' });
      expect(result2).toEqual({ data: 'request2' });
      expect(mockFn1).toHaveBeenCalledTimes(1);
      expect(mockFn2).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPendingRequestCount', () => {
    it('should track pending request count', async () => {
      const mockFn = vi
        .fn()
        .mockImplementation(
          () =>
            new Promise(resolve =>
              setTimeout(() => resolve({ data: 'test' }), 100)
            )
        );

      expect(getPendingRequestCount()).toBe(0);

      // Start a request
      const promise = deduplicateRequest('test', mockFn);
      expect(getPendingRequestCount()).toBe(1);

      // Wait for completion
      await promise;
      expect(getPendingRequestCount()).toBe(0);
    });

    it('should not increase count for deduplicated requests', async () => {
      const mockFn = vi
        .fn()
        .mockImplementation(
          () =>
            new Promise(resolve =>
              setTimeout(() => resolve({ data: 'test' }), 50)
            )
        );

      const key = 'same-key';

      // Start multiple requests with same key
      const promise1 = deduplicateRequest(key, mockFn);
      const promise2 = deduplicateRequest(key, mockFn);
      const promise3 = deduplicateRequest(key, mockFn);

      // Should only count as one pending request
      expect(getPendingRequestCount()).toBe(1);

      await Promise.all([promise1, promise2, promise3]);
      expect(getPendingRequestCount()).toBe(0);
    });
  });

  describe('cleanupExpiredRequests', () => {
    it('should remove expired requests from tracking', async () => {
      const mockFn = vi.fn().mockResolvedValue({ data: 'test' });

      // Create a request
      await deduplicateRequest('expired-test', mockFn);

      // Manually advance time
      vi.useFakeTimers();
      vi.advanceTimersByTime(6000); // 6 seconds

      cleanupExpiredRequests();
      vi.useRealTimers();

      // Pending count should be 0 after cleanup
      expect(getPendingRequestCount()).toBe(0);
    });
  });

  describe('createRequestKey', () => {
    it('should create unique keys for different URLs', () => {
      const key1 = createRequestKey('/api/puzzle?difficulty=5');
      const key2 = createRequestKey('/api/puzzle?difficulty=6');

      expect(key1).not.toBe(key2);
    });

    it('should create unique keys for different methods', () => {
      const key1 = createRequestKey('/api/puzzle', { method: 'GET' });
      const key2 = createRequestKey('/api/puzzle', { method: 'POST' });

      expect(key1).not.toBe(key2);
    });

    it('should create unique keys for different request bodies', () => {
      const key1 = createRequestKey('/api/puzzle', {
        method: 'POST',
        body: JSON.stringify({ difficulty: 5 }),
      });
      const key2 = createRequestKey('/api/puzzle', {
        method: 'POST',
        body: JSON.stringify({ difficulty: 6 }),
      });

      expect(key1).not.toBe(key2);
    });

    it('should create same key for identical requests', () => {
      const options = {
        method: 'POST',
        body: JSON.stringify({ difficulty: 5 }),
      };
      const key1 = createRequestKey('/api/puzzle', options);
      const key2 = createRequestKey('/api/puzzle', options);

      expect(key1).toBe(key2);
    });

    it('should default to GET method when not specified', () => {
      const key = createRequestKey('/api/puzzle');
      expect(key).toContain('GET:');
    });
  });

  describe('clearPendingRequests', () => {
    it('should clear all pending requests', async () => {
      const mockFn = vi
        .fn()
        .mockImplementation(
          () =>
            new Promise(resolve =>
              setTimeout(() => resolve({ data: 'test' }), 100)
            )
        );

      // Start some requests
      deduplicateRequest('key1', mockFn);
      deduplicateRequest('key2', mockFn);

      expect(getPendingRequestCount()).toBe(2);

      clearPendingRequests();
      expect(getPendingRequestCount()).toBe(0);
    });
  });
});
