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

export function isSameOriginRequest(request: NextRequest): boolean {
  const origin = getHeaderValue(request, 'origin');
  if (!origin) {
    return true;
  }

  try {
    const requestOrigin =
      request.nextUrl?.origin ?? new URL(request.url).origin;
    return new URL(origin).origin === requestOrigin;
  } catch {
    return false;
  }
}

export function buildSecurityHeaders(headersInit?: HeadersInit): Headers {
  const headers = new Headers(headersInit);
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
  headersInit?: HeadersInit
): Headers {
  const headers = buildSecurityHeaders(headersInit);
  if (!headers.has('Cache-Control')) {
    headers.set('Cache-Control', NO_STORE_CACHE_CONTROL);
  }
  return headers;
}

export function createJsonResponse<T>(
  payload: T,
  status = 200,
  headersInit?: HeadersInit
): NextResponse {
  return NextResponse.json(payload, {
    status,
    headers: buildSecurityHeaders(headersInit),
  });
}

export function createNoStoreJsonResponse<T>(
  payload: T,
  status = 200,
  headersInit?: HeadersInit
): NextResponse {
  return NextResponse.json(payload, {
    status,
    headers: buildNoStoreSecurityHeaders(headersInit),
  });
}

export function createRateLimitedResponse(
  retryAfterSeconds: number,
  message = 'Too many requests. Please try again later.'
): NextResponse {
  return createJsonResponse(
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
  message = 'Cross-origin request denied.'
): NextResponse {
  return createJsonResponse(
    {
      success: false,
      error: message,
    },
    403
  );
}

export function createPayloadTooLargeResponse(
  maxBytes: number,
  message = 'Request payload too large.'
): NextResponse {
  return createJsonResponse(
    {
      success: false,
      error: message,
      maxBytes,
    },
    413
  );
}

export function createUnsupportedMediaTypeResponse(): NextResponse {
  return createJsonResponse(
    {
      success: false,
      error: 'Unsupported media type. Use application/json.',
    },
    415
  );
}

export function createBadRequestResponse(
  message = 'Invalid JSON payload.'
): NextResponse {
  return createJsonResponse(
    {
      success: false,
      error: message,
    },
    400
  );
}

export async function readJsonBodyWithLimit<T>(
  request: NextRequest,
  maxBytes: number
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  const contentType = getHeaderValue(request, 'content-type');
  if (contentType && !contentType.toLowerCase().includes('application/json')) {
    return { ok: false, response: createUnsupportedMediaTypeResponse() };
  }

  let rawBody = '';
  try {
    rawBody = await request.text();
  } catch {
    return { ok: false, response: createBadRequestResponse() };
  }

  const bodySize = new TextEncoder().encode(rawBody).byteLength;
  if (bodySize > maxBytes) {
    return {
      ok: false,
      response: createPayloadTooLargeResponse(maxBytes),
    };
  }

  if (!rawBody.trim()) {
    return {
      ok: false,
      response: createBadRequestResponse('Request body is required.'),
    };
  }

  try {
    return {
      ok: true,
      data: JSON.parse(rawBody) as T,
    };
  } catch {
    return { ok: false, response: createBadRequestResponse() };
  }
}
