/**
 * Input sanitization utilities
 *
 * Provides functions to sanitize user input and prevent XSS attacks.
 * All user-generated content should be sanitized before rendering.
 *
 * @see Requirements 10.3, 10.8
 */

/**
 * HTML special characters that need escaping
 */
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Sanitize string by escaping HTML special characters
 *
 * Prevents XSS attacks by converting special characters to HTML entities.
 * Use this for any user-generated content before rendering.
 *
 * @param input - String to sanitize
 * @returns Sanitized string with HTML entities
 *
 * @example
 * ```typescript
 * sanitizeString('<script>alert("xss")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 * ```
 */
export function sanitizeString(input: string): string {
  return input.replaceAll(/[&<>"'/]/g, char => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Sanitize object by escaping all string values
 *
 * Recursively sanitizes all string values in an object.
 * Useful for sanitizing entire data structures.
 *
 * @param obj - Object to sanitize
 * @returns New object with sanitized string values
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => {
        if (typeof item === 'string') {
          return sanitizeString(item);
        }

        if (typeof item === 'object' && item !== null) {
          return sanitizeObject(item as Record<string, unknown>);
        }

        return item;
      });
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Validate and sanitize string length
 *
 * Ensures string doesn't exceed maximum length to prevent DoS attacks.
 *
 * @param input - String to validate
 * @param maxLength - Maximum allowed length
 * @returns Truncated and sanitized string
 *
 * @example
 * ```typescript
 * sanitizeStringLength('Hello World', 5)
 * // Returns: 'Hello'
 * ```
 */
export function sanitizeStringLength(input: string, maxLength: number): string {
  const truncated = input.slice(0, maxLength);
  return sanitizeString(truncated);
}

/**
 * Remove potentially dangerous characters from filename
 *
 * Prevents path traversal attacks by removing directory separators
 * and other dangerous characters.
 *
 * @param filename - Filename to sanitize
 * @returns Sanitized filename
 *
 * @example
 * ```typescript
 * sanitizeFilename('../../../etc/passwd')
 * // Returns: 'etcpasswd'
 * ```
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and null bytes
  return filename
    .replaceAll(/[/\\]/g, '')
    .replaceAll('\0', '')
    .replaceAll(/\.\./g, '')
    .trim();
}

/**
 * Sanitize URL to prevent javascript: and data: URIs
 *
 * Only allows http:, https:, and relative URLs.
 *
 * @param url - URL to sanitize
 * @returns Sanitized URL or empty string if dangerous
 *
 * @example
 * ```typescript
 * sanitizeUrl('javascript:alert("xss")')
 * // Returns: ''
 *
 * sanitizeUrl('https://example.com')
 * // Returns: 'https://example.com'
 * ```
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim().toLowerCase();

  // Allow relative URLs
  if (trimmed.startsWith('/') || trimmed.startsWith('./')) {
    return url.trim();
  }

  // Allow http and https
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return url.trim();
  }

  // Block everything else (javascript:, data:, etc.)
  return '';
}

/**
 * Sanitize CSS class name
 *
 * Ensures class name only contains safe characters.
 *
 * @param className - Class name to sanitize
 * @returns Sanitized class name
 */
export function sanitizeClassName(className: string): string {
  // Only allow alphanumeric, hyphen, and underscore
  return className.replaceAll(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * Sanitize number input
 *
 * Ensures input is a valid number within range.
 *
 * @param input - Input to sanitize
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @param defaultValue - Default value if invalid
 * @returns Sanitized number
 */
export function sanitizeNumber(
  input: unknown,
  min: number,
  max: number,
  defaultValue: number
): number {
  const num = Number(input);

  if (Number.isNaN(num)) {
    return defaultValue;
  }

  if (num < min) {
    return min;
  }

  if (num > max) {
    return max;
  }

  return num;
}

/**
 * Sanitize boolean input
 *
 * Converts various truthy/falsy values to boolean.
 *
 * @param input - Input to sanitize
 * @param defaultValue - Default value if invalid
 * @returns Sanitized boolean
 */
export function sanitizeBoolean(
  input: unknown,
  defaultValue: boolean
): boolean {
  if (typeof input === 'boolean') {
    return input;
  }

  if (typeof input === 'string') {
    const lower = input.toLowerCase();
    if (lower === 'true' || lower === '1' || lower === 'yes') {
      return true;
    }
    if (lower === 'false' || lower === '0' || lower === 'no') {
      return false;
    }
  }

  if (typeof input === 'number') {
    return input !== 0;
  }

  return defaultValue;
}
