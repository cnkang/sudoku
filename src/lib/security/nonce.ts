/**
 * Utilities for accessing CSP nonce in server components
 *
 * The nonce is generated per-request in middleware and stored in headers.
 * Server components can access it via headers() from next/headers.
 *
 * @see Requirements 9.7
 */

import { headers } from 'next/headers';

/**
 * Get the CSP nonce for the current request
 *
 * This function can only be called in Server Components.
 * Returns undefined if no nonce is available (e.g., in API routes).
 */
export async function getNonce(): Promise<string | undefined> {
  try {
    const headersList = await headers();
    return headersList.get('x-nonce') || undefined;
  } catch {
    // headers() throws in non-server contexts
    return undefined;
  }
}

/**
 * Get nonce attribute for inline scripts/styles
 *
 * Returns an object with nonce attribute if available, empty object otherwise.
 * Use with spread operator: <script {...getNonceAttr()} />
 */
export async function getNonceAttr(): Promise<{ nonce?: string }> {
  const nonce = await getNonce();
  return nonce ? { nonce } : {};
}
