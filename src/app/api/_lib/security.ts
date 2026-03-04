import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export type RateLimitOptions = {
  key: string;
  windowMs: number;
  maxRequests: number;
};

type RateLimitResult = {
  limited: boolean;
  retryAfterSeconds: number;
  remaining: number;
};

const MAX_RATE_LIMIT_ENTRIES = 10000;
const NO_STORE_CACHE_CONTROL = 'no-store';
const rateLimitStore = new Map<string, RateLimitEntry>();

function getHeaderValue(
  request: Pick<NextRequest, 'headers'>,
  headerName: string
): string | null {
  const { headers } = request;
  if (headers instanceof Headers) {
    return headers.get(headerName);
  }

  if (headers && typeof headers === 'object') {
    const record = headers as Record<string, unknown>;
    const directValue = record[headerName];
    if (typeof directValue === 'string') {
      return directValue;
    }

    const lowerCasedValue = record[headerName.toLowerCase()];
    if (typeof lowerCasedValue === 'string') {
      return lowerCasedValue;
    }
  }

  return null;
}

function cleanupExpiredRateLimitEntries(now: number): void {
  for (const [storeKey, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(storeKey);
    }
  }
}

function getClientAddress(request: NextRequest): string {
  const forwardedFor = getHeaderValue(request, 'x-forwarded-for');
  if (forwardedFor) {
    const firstAddress = forwardedFor.split(',')[0]?.trim();
    if (firstAddress) {
      return firstAddress.slice(0, 128);
    }
  }

  const realIp = getHeaderValue(request, 'x-real-ip')?.trim();
  if (realIp) {
    return realIp.slice(0, 128);
  }

  return 'unknown';
}

export function enforceRateLimit(
  request: NextRequest,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  if (rateLimitStore.size > MAX_RATE_LIMIT_ENTRIES) {
    cleanupExpiredRateLimitEntries(now);
  }

  const clientAddress = getClientAddress(request);
  const storeKey = `${options.key}:${clientAddress}`;
  const currentEntry = rateLimitStore.get(storeKey);

  let entry = currentEntry;
  if (!entry || entry.resetAt <= now) {
    entry = {
      count: 0,
      resetAt: now + options.windowMs,
    };
  }

  entry.count += 1;
  rateLimitStore.set(storeKey, entry);

  const limited = entry.count > options.maxRequests;
  const remaining = Math.max(0, options.maxRequests - entry.count);
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((entry.resetAt - now) / 1000)
  );

  return {
    limited,
    retryAfterSeconds,
    remaining,
  };
}

/**
 * List of allowed origins for CORS requests
 * In production, this should be configured via environment variables
 */
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  // Allow localhost in development and test environments
  ...(process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
    ? ['http://localhost:3000', 'http://127.0.0.1:3000']
    : []),
].filter((origin): origin is string => Boolean(origin));

/**
 * Allowed HTTP methods for CORS requests
 */
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] as const;

/**
 * Allowed headers for CORS requests
 */
const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'Accept',
] as const;

/**
 * Validates that the request origin is either same-origin or in the allowed origins list
 *
 * @param request - The incoming request
 * @returns true if the origin is valid, false otherwise
 *
 * Requirements: 12.1 - Validate request origin against allowed origins
 */
export function isSameOriginRequest(request: NextRequest): boolean {
  const origin = getHeaderValue(request, 'origin');

  // No origin header means same-origin request (e.g., direct navigation)
  if (!origin) {
    return true;
  }

  try {
    const requestOrigin =
      request.nextUrl?.origin ?? new URL(request.url).origin;
    const originUrl = new URL(origin).origin;

    // Check if it's same-origin
    if (originUrl === requestOrigin) {
      return true;
    }

    // Check if it's in the allowed origins list
    return ALLOWED_ORIGINS.includes(originUrl);
  } catch {
    // Invalid origin URL format
    return false;
  }
}

/**
 * Builds CORS headers based on the request origin
 * Sets Access-Control-Allow-Origin to the request origin if it's allowed,
 * otherwise omits CORS headers (which will cause the browser to block the request)
 *
 * @param request - The incoming request
 * @param additionalHeaders - Optional additional headers to include
 * @returns Headers object with CORS headers if origin is allowed
 *
 * Requirements: 12.3 - Configure CORS headers to restrict allowed origins
 */
export function buildCorsHeaders(
  request: NextRequest,
  additionalHeaders?: HeadersInit
): Headers {
  const headers = new Headers(additionalHeaders);
  const origin = getHeaderValue(request, 'origin');

  // Only add CORS headers if there's an origin header (cross-origin request)
  if (origin) {
    try {
      const requestOrigin =
        request.nextUrl?.origin ?? new URL(request.url).origin;
      const originUrl = new URL(origin).origin;

      // Check if origin is allowed (same-origin or in allowed list)
      const isAllowed =
        originUrl === requestOrigin || ALLOWED_ORIGINS.includes(originUrl);

      if (isAllowed) {
        // Set the specific origin that made the request
        headers.set('Access-Control-Allow-Origin', originUrl);
        // Allow credentials for same-origin or trusted origins
        headers.set('Access-Control-Allow-Credentials', 'true');
        // Specify allowed methods
        headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS.join(', '));
        // Specify allowed headers
        headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS.join(', '));
        // Cache preflight requests for 1 hour
        headers.set('Access-Control-Max-Age', '3600');
      }
    } catch {
      // Invalid origin URL format - don't add CORS headers
    }
  }

  return headers;
}

export function buildSecurityHeaders(
  request: NextRequest,
  headersInit?: HeadersInit
): Headers {
  // Build CORS headers first
  const headers = buildCorsHeaders(request, headersInit);

  // Add other security headers
  if (!headers.has('X-Content-Type-Options')) {
    headers.set('X-Content-Type-Options', 'nosniff');
  }
  if (!headers.has('Referrer-Policy')) {
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  }
  if (!headers.has('Cross-Origin-Resource-Policy')) {
    headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  }
  return headers;
}

export function buildNoStoreSecurityHeaders(
  request: NextRequest,
  headersInit?: HeadersInit
): Headers {
  const headers = buildSecurityHeaders(request, headersInit);
  if (!headers.has('Cache-Control')) {
    headers.set('Cache-Control', NO_STORE_CACHE_CONTROL);
  }
  return headers;
}

export function createJsonResponse<T>(
  request: NextRequest,
  payload: T,
  status = 200,
  headersInit?: HeadersInit
): NextResponse {
  return NextResponse.json(payload, {
    status,
    headers: buildSecurityHeaders(request, headersInit),
  });
}

export function createNoStoreJsonResponse<T>(
  request: NextRequest,
  payload: T,
  status = 200,
  headersInit?: HeadersInit
): NextResponse {
  return NextResponse.json(payload, {
    status,
    headers: buildNoStoreSecurityHeaders(request, headersInit),
  });
}

export function createRateLimitedResponse(
  request: NextRequest,
  retryAfterSeconds: number,
  message = 'Too many requests. Please try again later.'
): NextResponse {
  return createJsonResponse(
    request,
    {
      success: false,
      error: message,
    },
    429,
    {
      'Retry-After': String(retryAfterSeconds),
    }
  );
}

export function createForbiddenResponse(
  request: NextRequest,
  message = 'Cross-origin request denied.'
): NextResponse {
  return createJsonResponse(
    request,
    {
      success: false,
      error: message,
    },
    403
  );
}

export function createPayloadTooLargeResponse(
  request: NextRequest,
  maxBytes: number,
  message = 'Request payload too large.'
): NextResponse {
  return createJsonResponse(
    request,
    {
      success: false,
      error: message,
      maxBytes,
    },
    413
  );
}

export function createUnsupportedMediaTypeResponse(
  request: NextRequest
): NextResponse {
  return createJsonResponse(
    request,
    {
      success: false,
      error: 'Unsupported media type. Use application/json.',
    },
    415
  );
}

export function createBadRequestResponse(
  request: NextRequest,
  message = 'Invalid JSON payload.'
): NextResponse {
  return createJsonResponse(
    request,
    {
      success: false,
      error: message,
    },
    400
  );
}

/**
 * Creates a response for OPTIONS preflight requests
 * Returns 204 No Content with appropriate CORS headers
 *
 * @param request - The incoming OPTIONS request
 * @returns NextResponse with CORS headers for preflight
 *
 * Requirements: 12.3 - Configure CORS headers for preflight requests
 */
export function createOptionsResponse(request: NextRequest): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request),
  });
}

export async function readJsonBodyWithLimit<T>(
  request: NextRequest,
  maxBytes: number
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  const contentType = getHeaderValue(request, 'content-type');
  if (contentType && !contentType.toLowerCase().includes('application/json')) {
    return { ok: false, response: createUnsupportedMediaTypeResponse(request) };
  }

  let rawBody = '';
  try {
    rawBody = await request.text();
  } catch {
    return { ok: false, response: createBadRequestResponse(request) };
  }

  const bodySize = new TextEncoder().encode(rawBody).byteLength;
  if (bodySize > maxBytes) {
    return {
      ok: false,
      response: createPayloadTooLargeResponse(request, maxBytes),
    };
  }

  if (!rawBody.trim()) {
    return {
      ok: false,
      response: createBadRequestResponse(request, 'Request body is required.'),
    };
  }

  try {
    return {
      ok: true,
      data: JSON.parse(rawBody) as T,
    };
  } catch {
    return { ok: false, response: createBadRequestResponse(request) };
  }
}
