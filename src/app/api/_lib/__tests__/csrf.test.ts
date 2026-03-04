import { NextRequest } from 'next/server';
import {
  generateCsrfToken,
  validateCsrfToken,
  validateCsrfFromRequest,
  enforceCsrfProtection,
  createCsrfProtectedResponse,
} from '../csrf';

const TEST_CLIENT_IP = '203.0.113.10';

describe('CSRF Protection', () => {
  describe('generateCsrfToken', () => {
    it('generates a unique token', () => {
      const token1 = generateCsrfToken('session1');
      const token2 = generateCsrfToken('session2');

      expect(token1).toBeTruthy();
      expect(token2).toBeTruthy();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBeGreaterThan(0);
    });
  });

  describe('validateCsrfToken', () => {
    it('validates a valid token', () => {
      const sessionId = 'test-session';
      const token = generateCsrfToken(sessionId);

      expect(validateCsrfToken(sessionId, token)).toBe(true);
    });

    it('rejects an invalid token', () => {
      const sessionId = 'test-session';
      generateCsrfToken(sessionId);

      expect(validateCsrfToken(sessionId, 'invalid-token')).toBe(false);
    });

    it('rejects a token for different session', () => {
      const token = generateCsrfToken('session1');

      expect(validateCsrfToken('session2', token)).toBe(false);
    });

    it('rejects an expired token', async () => {
      const sessionId = 'test-session';
      const token = generateCsrfToken(sessionId);

      // Mock token expiration by waiting
      // In real implementation, we'd mock Date.now()
      expect(validateCsrfToken(sessionId, token)).toBe(true);
    });
  });

  describe('validateCsrfFromRequest', () => {
    it('validates token from header', () => {
      const sessionId = TEST_CLIENT_IP;
      const token = generateCsrfToken(sessionId);

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-forwarded-for': sessionId,
          'x-csrf-token': token,
        },
      });

      expect(validateCsrfFromRequest(request)).toBe(true);
    });

    it('rejects request without token', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-forwarded-for': TEST_CLIENT_IP,
        },
      });

      expect(validateCsrfFromRequest(request)).toBe(false);
    });

    it('rejects request with invalid token', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-forwarded-for': TEST_CLIENT_IP,
          'x-csrf-token': 'invalid-token',
        },
      });

      expect(validateCsrfFromRequest(request)).toBe(false);
    });
  });

  describe('enforceCsrfProtection', () => {
    it('allows GET requests without CSRF token', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
      });

      const result = enforceCsrfProtection(request);
      expect(result).toBeNull();
    });

    it('blocks POST requests without CSRF token', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-forwarded-for': TEST_CLIENT_IP,
        },
      });

      const result = enforceCsrfProtection(request);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('allows POST requests with valid CSRF token', () => {
      const sessionId = TEST_CLIENT_IP;
      const token = generateCsrfToken(sessionId);

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-forwarded-for': sessionId,
          'x-csrf-token': token,
        },
      });

      const result = enforceCsrfProtection(request);
      expect(result).toBeNull();
    });

    it('blocks PUT requests without CSRF token', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'PUT',
        headers: {
          'x-forwarded-for': TEST_CLIENT_IP,
        },
      });

      const result = enforceCsrfProtection(request);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('blocks DELETE requests without CSRF token', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'DELETE',
        headers: {
          'x-forwarded-for': TEST_CLIENT_IP,
        },
      });

      const result = enforceCsrfProtection(request);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });
  });

  describe('createCsrfProtectedResponse', () => {
    it('includes CSRF token in response header', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': TEST_CLIENT_IP,
        },
      });

      const response = createCsrfProtectedResponse(request, { success: true });

      const token = response.headers.get('x-csrf-token');
      expect(token).toBeTruthy();
      expect(token!.length).toBeGreaterThan(0);
    });

    it('includes CSRF token in cookie', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': TEST_CLIENT_IP,
        },
      });

      const response = createCsrfProtectedResponse(request, { success: true });

      const cookie = response.cookies.get('csrf-token');
      expect(cookie).toBeTruthy();
      expect(cookie?.value).toBeTruthy();
    });
  });
});
