/**
 * Tests for CSP nonce utilities
 *
 * Note: These tests verify the utility functions work correctly.
 * The actual nonce generation and injection is tested in integration tests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

describe('Nonce Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getNonce', () => {
    it('should return nonce from headers when available', async () => {
      const { headers } = await import('next/headers');
      const { getNonce } = await import('../nonce');

      const mockHeaders = new Map([['x-nonce', 'test-nonce-123']]);
      vi.mocked(headers).mockResolvedValue({
        get: (key: string) => mockHeaders.get(key) || null,
      } as any);

      const nonce = await getNonce();
      expect(nonce).toBe('test-nonce-123');
    });

    it('should return undefined when nonce header is not present', async () => {
      const { headers } = await import('next/headers');
      const { getNonce } = await import('../nonce');

      vi.mocked(headers).mockResolvedValue({
        get: () => null,
      } as any);

      const nonce = await getNonce();
      expect(nonce).toBeUndefined();
    });

    it('should return undefined when headers() throws', async () => {
      const { headers } = await import('next/headers');
      const { getNonce } = await import('../nonce');

      vi.mocked(headers).mockRejectedValue(new Error('Not in server context'));

      const nonce = await getNonce();
      expect(nonce).toBeUndefined();
    });
  });

  describe('getNonceAttr', () => {
    it('should return nonce attribute when nonce is available', async () => {
      const { headers } = await import('next/headers');
      const { getNonceAttr } = await import('../nonce');

      const mockHeaders = new Map([['x-nonce', 'test-nonce-456']]);
      vi.mocked(headers).mockResolvedValue({
        get: (key: string) => mockHeaders.get(key) || null,
      } as any);

      const attr = await getNonceAttr();
      expect(attr).toEqual({ nonce: 'test-nonce-456' });
    });

    it('should return empty object when nonce is not available', async () => {
      const { headers } = await import('next/headers');
      const { getNonceAttr } = await import('../nonce');

      vi.mocked(headers).mockResolvedValue({
        get: () => null,
      } as any);

      const attr = await getNonceAttr();
      expect(attr).toEqual({});
    });

    it('should return empty object when headers() throws', async () => {
      const { headers } = await import('next/headers');
      const { getNonceAttr } = await import('../nonce');

      vi.mocked(headers).mockRejectedValue(new Error('Not in server context'));

      const attr = await getNonceAttr();
      expect(attr).toEqual({});
    });

    it('should be usable with spread operator', async () => {
      const { headers } = await import('next/headers');
      const { getNonceAttr } = await import('../nonce');

      const mockHeaders = new Map([['x-nonce', 'spread-test-nonce']]);
      vi.mocked(headers).mockResolvedValue({
        get: (key: string) => mockHeaders.get(key) || null,
      } as any);

      const attr = await getNonceAttr();
      const scriptProps = { type: 'text/javascript', ...attr };

      expect(scriptProps).toEqual({
        type: 'text/javascript',
        nonce: 'spread-test-nonce',
      });
    });
  });
});
