/**
 * Error response sanitization utilities
 * Prevents information leakage while maintaining detailed server-side logging
 *
 * Requirements: 12.4, 18.2
 */

/**
 * Sanitized error response structure for clients
 */
export interface SanitizedErrorResponse {
  error: string;
  code?: string | undefined;
  timestamp: number;
}

/**
 * Detailed error log structure for server-side logging
 */
export interface DetailedErrorLog {
  error: string;
  code?: string | undefined;
  stack?: string | undefined;
  details?: unknown;
  timestamp: number;
  context?: {
    url?: string | undefined;
    method?: string | undefined;
    userAgent?: string | undefined;
    ip?: string | undefined;
  };
}

/**
 * Generic error messages for production
 */
const GENERIC_ERROR_MESSAGES = {
  INTERNAL_ERROR: 'An error occurred while processing your request',
  VALIDATION_ERROR: 'Invalid request data',
  AUTHENTICATION_ERROR: 'Authentication failed',
  AUTHORIZATION_ERROR: 'Access denied',
  NOT_FOUND: 'Resource not found',
  RATE_LIMIT: 'Too many requests',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
} as const;

/**
 * Error codes that are safe to expose to clients
 */
const SAFE_ERROR_CODES = new Set([
  'VALIDATION_ERROR',
  'RATE_LIMIT_ERROR',
  'NOT_FOUND',
  'AUTHENTICATION_ERROR',
  'AUTHORIZATION_ERROR',
]);

/**
 * Sanitizes error for client response
 * Removes stack traces, internal details, and sensitive information
 *
 * @param error - The error to sanitize
 * @param code - Optional error code
 * @returns Sanitized error response safe for clients
 */
export function sanitizeErrorForClient(
  error: unknown,
  code?: string
): SanitizedErrorResponse {
  const timestamp = Date.now();

  // In development, provide more details (but still no stack traces)
  if (process.env.NODE_ENV === 'development') {
    return {
      error: extractSafeErrorMessage(error),
      code: code && SAFE_ERROR_CODES.has(code) ? code : undefined,
      timestamp,
    };
  }

  // In production, use generic messages
  const genericMessage = getGenericErrorMessage(code);

  return {
    error: genericMessage,
    code: code && SAFE_ERROR_CODES.has(code) ? code : undefined,
    timestamp,
  };
}

/**
 * Creates detailed error log for server-side logging
 * Includes stack traces and full error details
 *
 * @param error - The error to log
 * @param code - Optional error code
 * @param context - Optional request context
 * @returns Detailed error log for server-side use
 */
export function createDetailedErrorLog(
  error: unknown,
  code?: string | undefined,
  context?: {
    url: string;
    method: string;
    userAgent: string | undefined;
    ip?: string | undefined;
  }
): DetailedErrorLog {
  const timestamp = Date.now();

  const log: DetailedErrorLog = {
    error: extractFullErrorMessage(error),
    code,
    timestamp,
  };

  // Add stack trace if available
  if (error instanceof Error && error.stack) {
    log.stack = error.stack;
  }

  // Add error details
  if (error && typeof error === 'object') {
    log.details = error;
  }

  // Add request context
  if (context) {
    log.context = {
      url: context.url,
      method: context.method,
      userAgent: context.userAgent,
      ip: context.ip,
    };
  }

  return log;
}

/**
 * Extracts a safe error message without sensitive information
 */
function extractSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Remove any potential file paths or internal details
    return error.message.replaceAll(/\/[^\s]+/g, '[path]');
  }

  if (typeof error === 'string') {
    return error.replaceAll(/\/[^\s]+/g, '[path]');
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = String(error.message);
    return message.replaceAll(/\/[^\s]+/g, '[path]');
  }

  return GENERIC_ERROR_MESSAGES.INTERNAL_ERROR;
}

/**
 * Extracts full error message for server-side logging
 */
function extractFullErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return 'Unknown error';
}

/**
 * Gets generic error message based on error code
 */
function getGenericErrorMessage(code?: string): string {
  if (!code) {
    return GENERIC_ERROR_MESSAGES.INTERNAL_ERROR;
  }

  switch (code) {
    case 'VALIDATION_ERROR':
      return GENERIC_ERROR_MESSAGES.VALIDATION_ERROR;
    case 'RATE_LIMIT_ERROR':
      return GENERIC_ERROR_MESSAGES.RATE_LIMIT;
    case 'NOT_FOUND':
      return GENERIC_ERROR_MESSAGES.NOT_FOUND;
    case 'AUTHENTICATION_ERROR':
      return GENERIC_ERROR_MESSAGES.AUTHENTICATION_ERROR;
    case 'AUTHORIZATION_ERROR':
      return GENERIC_ERROR_MESSAGES.AUTHORIZATION_ERROR;
    case 'SERVICE_UNAVAILABLE':
      return GENERIC_ERROR_MESSAGES.SERVICE_UNAVAILABLE;
    default:
      return GENERIC_ERROR_MESSAGES.INTERNAL_ERROR;
  }
}

/**
 * Logs error to server-side logging system
 * In production, this would send to a logging service
 *
 * @param errorLog - The detailed error log
 */
export function logErrorServerSide(errorLog: DetailedErrorLog): void {
  // In production, send to logging service (e.g., Sentry, DataDog, CloudWatch)
  // For now, write to stderr with structured payloads.

  if (process.env.NODE_ENV === 'production') {
    const payload = JSON.stringify({
      level: 'error',
      ...errorLog,
    });
    process.stderr.write(`${payload}\n`);
  } else {
    const payload = {
      message: errorLog.error,
      code: errorLog.code,
      timestamp: new Date(errorLog.timestamp).toISOString(),
      context: errorLog.context,
      stack: errorLog.stack,
    };
    process.stderr.write(`Error occurred: ${JSON.stringify(payload)}\n`);
  }
}

/**
 * Extracts request context for error logging
 *
 * @param request - Next.js request object
 * @returns Request context object
 */
export function extractRequestContext(request: {
  url: string;
  method: string;
  headers: { get(name: string): string | null };
}): {
  url: string;
  method: string;
  userAgent: string | undefined;
} {
  const userAgent = request.headers.get('user-agent');
  return {
    url: request.url,
    method: request.method,
    userAgent: userAgent ?? undefined,
  };
}

/**
 * Sanitizes Zod validation errors for client response
 * Removes internal validation details while keeping useful information
 *
 * @param zodError - Zod validation error
 * @returns Sanitized validation error
 */
export function sanitizeZodError(zodError: {
  issues: Array<{ path: PropertyKey[]; message: string }>;
}): {
  error: string;
  code: string;
  fields?: Array<{ field: string; message: string }>;
} {
  if (process.env.NODE_ENV === 'development') {
    // In development, provide field-level details
    return {
      error: GENERIC_ERROR_MESSAGES.VALIDATION_ERROR,
      code: 'VALIDATION_ERROR',
      fields: zodError.issues.map(issue => ({
        field: issue.path.map(String).join('.'),
        message: issue.message,
      })),
    };
  }

  // In production, only provide generic validation error
  return {
    error: GENERIC_ERROR_MESSAGES.VALIDATION_ERROR,
    code: 'VALIDATION_ERROR',
  };
}
