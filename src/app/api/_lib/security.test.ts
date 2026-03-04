import { NextRequest } from 'next/server';
import {
  buildCorsHeaders,
  buildSecurityHeaders,
  createOptionsResponse,
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

    it('returns true when no origin header is present (same-origin request)', () => {
      const request = {
        headers: new Headers({}),
        nextUrl: new URL('http://localhost:3000/api/progress'),
      } as unknown as NextRequest;

      expect(isSameOriginRequest(request)).toBe(true);
    });

    it('returns true for localhost origins (allowed in development)', () => {
      // In development mode, localhost and 127.0.0.1 are in the allowed origins list
      const request = {
        headers: new Headers({
          origin: 'http://localhost:3000',
        }),
        nextUrl: new URL('http://localhost:3000/api/progress'),
      } as unknown as NextRequest;

      // This should pass because localhost:3000 matches the request origin (same-origin)
      expect(isSameOriginRequest(request)).toBe(true);
    });

    it('returns false for invalid origin URL format', () => {
      const request = {
        headers: new Headers({
          origin: 'not-a-valid-url',
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
      const request = {
        headers: new Headers(),
        nextUrl: new URL('http://localhost:3000/api/test'),
        url: 'http://localhost:3000/api/test',
      } as unknown as NextRequest;

      const headers = buildSecurityHeaders(request, {
        'Cache-Control': 'no-store',
      });

      expect(headers.get('Cache-Control')).toBe('no-store');
      expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(headers.get('Referrer-Policy')).toBe(
        'strict-origin-when-cross-origin'
      );
      expect(headers.get('Cross-Origin-Resource-Policy')).toBe('same-origin');
    });

    it('includes CORS headers for allowed cross-origin requests', () => {
      const request = {
        headers: new Headers({
          origin: 'http://localhost:3000',
        }),
        nextUrl: new URL('http://localhost:3000/api/test'),
        url: 'http://localhost:3000/api/test',
      } as unknown as NextRequest;

      const headers = buildSecurityHeaders(request);

      expect(headers.get('Access-Control-Allow-Origin')).toBe(
        'http://localhost:3000'
      );
      expect(headers.get('Access-Control-Allow-Credentials')).toBe('true');
      expect(headers.get('Access-Control-Allow-Methods')).toContain('GET');
      expect(headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(headers.get('Access-Control-Allow-Headers')).toContain(
        'Content-Type'
      );
    });

    it('does not include CORS headers for disallowed origins', () => {
      const request = {
        headers: new Headers({
          origin: 'https://attacker.example',
        }),
        nextUrl: new URL('http://localhost:3000/api/test'),
        url: 'http://localhost:3000/api/test',
      } as unknown as NextRequest;

      const headers = buildSecurityHeaders(request);

      expect(headers.get('Access-Control-Allow-Origin')).toBeNull();
      expect(headers.get('Access-Control-Allow-Credentials')).toBeNull();
    });

    it('does not include CORS headers for same-origin requests without origin header', () => {
      const request = {
        headers: new Headers(),
        nextUrl: new URL('http://localhost:3000/api/test'),
        url: 'http://localhost:3000/api/test',
      } as unknown as NextRequest;

      const headers = buildSecurityHeaders(request);

      // No origin header means same-origin, so no CORS headers needed
      expect(headers.get('Access-Control-Allow-Origin')).toBeNull();
    });
  });

  describe('buildCorsHeaders', () => {
    it('adds CORS headers for allowed same-origin requests', () => {
      const request = {
        headers: new Headers({
          origin: 'http://localhost:3000',
        }),
        nextUrl: new URL('http://localhost:3000/api/test'),
        url: 'http://localhost:3000/api/test',
      } as unknown as NextRequest;

      const headers = buildCorsHeaders(request);

      expect(headers.get('Access-Control-Allow-Origin')).toBe(
        'http://localhost:3000'
      );
      expect(headers.get('Access-Control-Allow-Credentials')).toBe('true');
      expect(headers.get('Access-Control-Allow-Methods')).toBe(
        'GET, POST, PUT, DELETE, OPTIONS'
      );
      expect(headers.get('Access-Control-Allow-Headers')).toBe(
        'Content-Type, Authorization, X-Requested-With, Accept'
      );
      expect(headers.get('Access-Control-Max-Age')).toBe('3600');
    });

    it('does not add CORS headers for disallowed origins', () => {
      const request = {
        headers: new Headers({
          origin: 'https://malicious.example',
        }),
        nextUrl: new URL('http://localhost:3000/api/test'),
        url: 'http://localhost:3000/api/test',
      } as unknown as NextRequest;

      const headers = buildCorsHeaders(request);

      expect(headers.get('Access-Control-Allow-Origin')).toBeNull();
      expect(headers.get('Access-Control-Allow-Credentials')).toBeNull();
      expect(headers.get('Access-Control-Allow-Methods')).toBeNull();
    });

    it('does not add CORS headers when no origin header is present', () => {
      const request = {
        headers: new Headers(),
        nextUrl: new URL('http://localhost:3000/api/test'),
        url: 'http://localhost:3000/api/test',
      } as unknown as NextRequest;

      const headers = buildCorsHeaders(request);

      expect(headers.get('Access-Control-Allow-Origin')).toBeNull();
    });

    it('preserves additional headers passed in', () => {
      const request = {
        headers: new Headers({
          origin: 'http://localhost:3000',
        }),
        nextUrl: new URL('http://localhost:3000/api/test'),
        url: 'http://localhost:3000/api/test',
      } as unknown as NextRequest;

      const headers = buildCorsHeaders(request, {
        'X-Custom-Header': 'custom-value',
      });

      expect(headers.get('X-Custom-Header')).toBe('custom-value');
      expect(headers.get('Access-Control-Allow-Origin')).toBe(
        'http://localhost:3000'
      );
    });

    it('handles invalid origin URLs gracefully', () => {
      const request = {
        headers: new Headers({
          origin: 'not-a-valid-url',
        }),
        nextUrl: new URL('http://localhost:3000/api/test'),
        url: 'http://localhost:3000/api/test',
      } as unknown as NextRequest;

      const headers = buildCorsHeaders(request);

      expect(headers.get('Access-Control-Allow-Origin')).toBeNull();
    });
  });

  describe('createOptionsResponse', () => {
    it('returns 204 No Content with CORS headers for allowed origins', () => {
      const request = {
        headers: new Headers({
          origin: 'http://localhost:3000',
        }),
        nextUrl: new URL('http://localhost:3000/api/test'),
        url: 'http://localhost:3000/api/test',
        method: 'OPTIONS',
      } as unknown as NextRequest;

      const response = createOptionsResponse(request);

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
        'http://localhost:3000'
      );
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain(
        'OPTIONS'
      );
    });

    it('returns 204 without CORS headers for disallowed origins', () => {
      const request = {
        headers: new Headers({
          origin: 'https://attacker.example',
        }),
        nextUrl: new URL('http://localhost:3000/api/test'),
        url: 'http://localhost:3000/api/test',
        method: 'OPTIONS',
      } as unknown as NextRequest;

      const response = createOptionsResponse(request);

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });
  });
});
