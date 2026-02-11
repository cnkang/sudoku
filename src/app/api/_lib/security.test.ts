import { NextRequest } from 'next/server';
import {
  buildSecurityHeaders,
  enforceRateLimit,
  isSameOriginRequest,
  readJsonBodyWithLimit,
} from './security';

// RFC 5737 TEST-NET-3 address reserved for documentation and examples.
const TEST_CLIENT_IP = '203.0.113.10';

describe('API security helpers', () => {
  describe('isSameOriginRequest', () => {
    it('returns true when origin matches request origin', () => {
      const request = {
        headers: new Headers({
          origin: 'http://localhost:3000',
        }),
        nextUrl: new URL('http://localhost:3000/api/progress'),
      } as unknown as NextRequest;

      expect(isSameOriginRequest(request)).toBe(true);
    });

    it('returns false when origin is different', () => {
      const request = {
        headers: new Headers({
          origin: 'https://attacker.example',
        }),
        nextUrl: new URL('http://localhost:3000/api/progress'),
      } as unknown as NextRequest;

      expect(isSameOriginRequest(request)).toBe(false);
    });
  });

  describe('enforceRateLimit', () => {
    it('limits requests after reaching configured maximum', () => {
      const request = new NextRequest('http://localhost:3000/api/progress', {
        headers: {
          'x-forwarded-for': TEST_CLIENT_IP,
        },
      });
      const key = `test-rate-${Date.now()}`;

      const first = enforceRateLimit(request, {
        key,
        windowMs: 60_000,
        maxRequests: 2,
      });
      const second = enforceRateLimit(request, {
        key,
        windowMs: 60_000,
        maxRequests: 2,
      });
      const third = enforceRateLimit(request, {
        key,
        windowMs: 60_000,
        maxRequests: 2,
      });

      expect(first.limited).toBe(false);
      expect(second.limited).toBe(false);
      expect(third.limited).toBe(true);
      expect(third.retryAfterSeconds).toBeGreaterThan(0);
    });
  });

  describe('readJsonBodyWithLimit', () => {
    it('rejects oversized JSON payloads', async () => {
      const payload = { value: 'a'.repeat(1024) };
      const request = new NextRequest('http://localhost:3000/api/progress', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await readJsonBodyWithLimit(request, 64);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.response.status).toBe(413);
      }
    });

    it('rejects unsupported media types', async () => {
      const request = new NextRequest('http://localhost:3000/api/progress', {
        method: 'POST',
        headers: {
          'content-type': 'text/plain',
        },
        body: '{"value":1}',
      });

      const result = await readJsonBodyWithLimit(request, 1024);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.response.status).toBe(415);
      }
    });

    it('parses valid JSON payloads', async () => {
      const request = new NextRequest('http://localhost:3000/api/progress', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: '{"value":1}',
      });

      const result = await readJsonBodyWithLimit<{ value: number }>(
        request,
        1024
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.value).toBe(1);
      }
    });
  });

  describe('buildSecurityHeaders', () => {
    it('sets baseline headers while preserving existing values', () => {
      const headers = buildSecurityHeaders({ 'Cache-Control': 'no-store' });

      expect(headers.get('Cache-Control')).toBe('no-store');
      expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(headers.get('Referrer-Policy')).toBe(
        'strict-origin-when-cross-origin'
      );
      expect(headers.get('Cross-Origin-Resource-Policy')).toBe('same-origin');
    });
  });
});
