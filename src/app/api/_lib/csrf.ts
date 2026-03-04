/**
 * CSRF Protection Implementation
 *
 * Provides CSRF token generation and validation for state-changing operations
 * Requirements: 12.8 - CSRF protection for state-changing endpoints
 */

import type { NextRequest } from 'next/server';
import type { NextResponse } from 'next/server';
import { createJsonResponse } from './security';

/**
 * CSRF token configuration
 */
const CSRF_TOKEN_HEADER = 'x-csrf-token';
const CSRF_TOKEN_COOKIE = 'csrf-token';
const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_LIFETIME_MS = 3600000; // 1 hour

/**
 * In-memory store for CSRF tokens
 * In production, this should use Redis or similar distributed cache
 */
const csrfTokenStore = new Map<string, { token: string; expiresAt: number }>();

/**
 * Generates a cryptographically secure random token
 */
function generateSecureToken(): string {
  const array = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a CSRF token for a client session
 *
 * @param sessionId - Unique session identifier (e.g., from cookie or IP)
 * @returns CSRF token
 */
export function generateCsrfToken(sessionId: string): string {
  const token = generateSecureToken();
  const expiresAt = Date.now() + CSRF_TOKEN_LIFETIME_MS;

  csrfTokenStore.set(sessionId, { token, expiresAt });

  // Cleanup expired tokens periodically
  if (csrfTokenStore.size > 10000) {
    cleanupExpiredTokens();
  }

  return token;
}

/**
 * Validates a CSRF token for a client session
 *
 * @param sessionId - Unique session identifier
 * @param token - CSRF token to validate
 * @returns true if token is valid, false otherwise
 */
export function validateCsrfToken(sessionId: string, token: string): boolean {
  const stored = csrfTokenStore.get(sessionId);

  if (!stored) {
    return false;
  }

  // Check if token has expired
  if (stored.expiresAt < Date.now()) {
    csrfTokenStore.delete(sessionId);
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(stored.token, token);
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Cleans up expired CSRF tokens
 */
function cleanupExpiredTokens(): void {
  const now = Date.now();
  for (const [sessionId, entry] of csrfTokenStore.entries()) {
    if (entry.expiresAt < now) {
      csrfTokenStore.delete(sessionId);
    }
  }
}

/**
 * Extracts session ID from request
 * Uses IP address as session identifier for stateless CSRF protection
 */
function getSessionId(request: NextRequest): string {
  // Try to get from x-forwarded-for header
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ip = forwardedFor.split(',')[0]?.trim();
    if (ip) {
      return ip;
    }
  }

  // Try x-real-ip header
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // Fallback to user-agent as session identifier
  const userAgent = request.headers.get('user-agent');
  return userAgent || 'unknown';
}

/**
 * Validates CSRF token from request
 * Checks both header and cookie for token
 *
 * @param request - Incoming request
 * @returns true if CSRF token is valid, false otherwise
 */
export function validateCsrfFromRequest(request: NextRequest): boolean {
  const sessionId = getSessionId(request);

  // Get token from header
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);
  if (headerToken && validateCsrfToken(sessionId, headerToken)) {
    return true;
  }

  // Get token from cookie as fallback
  const cookieToken = request.cookies.get(CSRF_TOKEN_COOKIE)?.value;
  if (cookieToken && validateCsrfToken(sessionId, cookieToken)) {
    return true;
  }

  return false;
}

/**
 * Creates a response with CSRF token
 * Sets token in both header and cookie
 *
 * @param request - Incoming request
 * @param payload - Response payload
 * @param status - HTTP status code
 * @returns NextResponse with CSRF token
 */
export function createCsrfProtectedResponse<T>(
  request: NextRequest,
  payload: T,
  status = 200
): NextResponse {
  const sessionId = getSessionId(request);
  const token = generateCsrfToken(sessionId);

  const response = createJsonResponse(request, payload, status);

  // Set token in header
  response.headers.set(CSRF_TOKEN_HEADER, token);

  // Set token in cookie (HttpOnly, Secure, SameSite=Strict)
  response.cookies.set(CSRF_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CSRF_TOKEN_LIFETIME_MS / 1000,
    path: '/',
  });

  return response;
}

/**
 * Creates a 403 Forbidden response for invalid CSRF token
 */
export function createCsrfForbiddenResponse(
  request: NextRequest
): NextResponse {
  return createJsonResponse(
    request,
    {
      success: false,
      error: 'Invalid or missing CSRF token',
      code: 'CSRF_TOKEN_INVALID',
    },
    403
  );
}

/**
 * Middleware to enforce CSRF protection on state-changing operations
 * Should be called for POST, PUT, DELETE requests
 *
 * @param request - Incoming request
 * @returns null if valid, NextResponse with 403 if invalid
 */
export function enforceCsrfProtection(
  request: NextRequest
): NextResponse | null {
  // Only enforce CSRF for state-changing methods
  const method = request.method.toUpperCase();
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return null;
  }

  // Validate CSRF token
  if (!validateCsrfFromRequest(request)) {
    return createCsrfForbiddenResponse(request);
  }

  return null;
}
