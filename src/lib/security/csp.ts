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
export function generateCSPHeader(directives: CSPDirectives, nonce?: string): string {
  // Scripts require a request nonce; dynamic style attributes remain supported.
  const scriptSrc = [...directives['script-src']];
  const styleSrc = [...directives['style-src']];

  if (nonce) {
    scriptSrc.push(`'nonce-${nonce}'`);
    if (!styleSrc.includes("'unsafe-inline'")) styleSrc.push(`'nonce-${nonce}'`);
  }

  // Build directive strings
  const cspDirectives: string[] = [
    `default-src ${directives['default-src'].join(' ')}`,
    `script-src ${scriptSrc.join(' ')}`,
    ...(directives['script-src-elem']
      ? [
          `script-src-elem ${[...directives['script-src-elem'], ...(nonce ? [`'nonce-${nonce}'`] : [])].join(' ')}`,
        ]
      : []),
    ...(directives['script-src-attr']
      ? [`script-src-attr ${directives['script-src-attr'].join(' ')}`]
      : []),
    `style-src ${styleSrc.join(' ')}`,
    `img-src ${directives['img-src'].join(' ')}`,
    `font-src ${directives['font-src'].join(' ')}`,
    `connect-src ${directives['connect-src'].join(' ')}`,
    `frame-src ${directives['frame-src'].join(' ')}`,
    `object-src ${directives['object-src'].join(' ')}`,
    `base-uri ${directives['base-uri'].join(' ')}`,
    `form-action ${directives['form-action'].join(' ')}`,
    `frame-ancestors ${directives['frame-ancestors'].join(' ')}`,
    ...(directives['upgrade-insecure-requests'] ? ['upgrade-insecure-requests'] : []),
  ];

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

    // Turbopack dev client needs eval in development.
    ...(process.env.NODE_ENV === 'development' ? ["'unsafe-eval'"] : []),
  ],
  // Keep element/attribute policies explicit to avoid browser defaults that can
  // unexpectedly block Next.js runtime chunks.
  'script-src-elem': ["'self'"],
  'script-src-attr': ["'none'"],
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
  'upgrade-insecure-requests': process.env.NODE_ENV !== 'development', // Upgrade HTTP to HTTPS
};

/**
 * Generate a cryptographically secure nonce for CSP
 */
export function generateNonce(): string {
  const webCrypto = globalThis.crypto;

  if (webCrypto?.randomUUID) {
    return webCrypto.randomUUID();
  }

  if (webCrypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    webCrypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  throw new Error('Secure random generator unavailable for CSP nonce');
}

/**
 * Get CSP header name based on report-only mode
 */
export function getCSPHeaderName(reportOnly = false): string {
  return reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
}
