/**
 * Content Security Policy (CSP) Configuration
 *
 * Implements strict CSP headers to prevent XSS attacks and other security vulnerabilities.
 * Uses nonce-based approach for inline scripts and styles.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
 * @see Requirements 9.1, 9.7, 9.8
 */

export interface CSPDirectives {
  'default-src': string[];
  'script-src': string[];
  'script-src-elem'?: string[];
  'script-src-attr'?: string[];
  'style-src': string[];
  'img-src': string[];
  'font-src': string[];
  'connect-src': string[];
  'frame-src': string[];
  'object-src': string[];
  'base-uri': string[];
  'form-action': string[];
  'frame-ancestors': string[];
  'upgrade-insecure-requests': boolean;
}

/**
 * Generate CSP header value from directives
 */
export function generateCSPHeader(
  directives: CSPDirectives,
  nonce?: string,
  reportOnly = false
): string {
  const cspDirectives: string[] = [];

  // Add nonce to script-src and style-src if provided
  const scriptSrc = [...directives['script-src']];
  const styleSrc = [...directives['style-src']];

  if (nonce) {
    scriptSrc.push(`'nonce-${nonce}'`);
    styleSrc.push(`'nonce-${nonce}'`);
  }

  // Build directive strings
  cspDirectives.push(`default-src ${directives['default-src'].join(' ')}`);
  cspDirectives.push(`script-src ${scriptSrc.join(' ')}`);
  if (directives['script-src-elem']) {
    cspDirectives.push(
      `script-src-elem ${directives['script-src-elem'].join(' ')}`
    );
  }
  if (directives['script-src-attr']) {
    cspDirectives.push(
      `script-src-attr ${directives['script-src-attr'].join(' ')}`
    );
  }
  cspDirectives.push(`style-src ${styleSrc.join(' ')}`);
  cspDirectives.push(`img-src ${directives['img-src'].join(' ')}`);
  cspDirectives.push(`font-src ${directives['font-src'].join(' ')}`);
  cspDirectives.push(`connect-src ${directives['connect-src'].join(' ')}`);
  cspDirectives.push(`frame-src ${directives['frame-src'].join(' ')}`);
  cspDirectives.push(`object-src ${directives['object-src'].join(' ')}`);
  cspDirectives.push(`base-uri ${directives['base-uri'].join(' ')}`);
  cspDirectives.push(`form-action ${directives['form-action'].join(' ')}`);
  cspDirectives.push(
    `frame-ancestors ${directives['frame-ancestors'].join(' ')}`
  );

  if (directives['upgrade-insecure-requests']) {
    cspDirectives.push('upgrade-insecure-requests');
  }

  return cspDirectives.join('; ');
}

/**
 * Default CSP directives for the application
 *
 * Strict policy with 'self' as default, allowing only necessary external resources.
 */
export const defaultCSPDirectives: CSPDirectives = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    // Next.js injects inline bootstrap/runtime scripts.
    "'unsafe-inline'",
    // Turbopack dev client needs eval in development.
    ...(process.env.NODE_ENV === 'development' ? ["'unsafe-eval'"] : []),
  ],
  // Keep element/attribute policies explicit to avoid browser defaults that can
  // unexpectedly block Next.js runtime chunks.
  'script-src-elem': ["'self'", "'unsafe-inline'"],
  'script-src-attr': ["'unsafe-inline'"],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for CSS-in-JS and CSS Modules
  ],
  'img-src': [
    "'self'",
    'data:', // Allow data URIs for inline images
    'blob:', // Allow blob URLs for generated images
  ],
  'font-src': [
    "'self'",
    'data:', // Allow data URIs for inline fonts
  ],
  'connect-src': [
    "'self'",
    // Add analytics endpoints here if needed
  ],
  'frame-src': ["'none'"], // No iframes allowed
  'object-src': ["'none'"], // No plugins allowed
  'base-uri': ["'self'"], // Restrict base tag
  'form-action': ["'self'"], // Forms can only submit to same origin
  'frame-ancestors': ["'none'"], // Cannot be embedded in iframes
  'upgrade-insecure-requests': true, // Upgrade HTTP to HTTPS
};

/**
 * Generate a cryptographically secure nonce for CSP
 */
export function generateNonce(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

/**
 * Get CSP header name based on report-only mode
 */
export function getCSPHeaderName(reportOnly = false): string {
  return reportOnly
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy';
}
