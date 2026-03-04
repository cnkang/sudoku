/**
 * Next.js Proxy for security headers and CSP nonce generation
 *
 * Generates a unique nonce per request for Content Security Policy.
 * The nonce is stored in request headers and can be accessed by components.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/proxy
 * @see Requirements 9.7
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateNonce } from './lib/security/csp';

export function proxy(request: NextRequest): NextResponse {
  // Generate unique nonce for this request
  const nonce = generateNonce();

  // Clone the request headers and add the nonce
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  // Create response with modified headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add nonce to response headers for debugging (optional, remove in production)
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('x-nonce', nonce);
  }

  return response;
}

// Configure which routes use this proxy
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (sw.js, manifest.json, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.json|icons|screenshots).*)',
  ],
};
