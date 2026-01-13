/**
 * Centralized error handling utilities to reduce duplication
 */

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * Common error types
 */
export const ERROR_TYPES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
  GENERATION_ERROR: 'GENERATION_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
} as const;

/**
 * Standardized error messages
 */
export const ERROR_MESSAGES = {
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
  INVALID_REQUEST: 'Invalid request parameters',
  RATE_LIMITED: 'Please wait before making another request',
  CACHE_MISS: 'Requested data not found in cache',
  GENERATION_FAILED: 'Failed to generate puzzle',
  NETWORK_UNAVAILABLE: 'Network request failed',
} as const;

/**
 * Extract error message from various error types
 */
export const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
};

/**
 * Create standardized error response
 */
export const createErrorResponse = (
  error: unknown,
  code?: string,
  details?: unknown
): ErrorResponse => {
  const response: ErrorResponse = {
    error: extractErrorMessage(error),
  };

  if (code) {
    response.code = code;
  }

  if (details) {
    response.details = details;
  }

  return response;
};

/**
 * Safe async operation wrapper with error handling
 */
export const safeAsync = async <T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T | null> => {
  try {
    return await operation();
  } catch {
    // Silent failure for safe operations
    return fallback ?? null;
  }
};

/**
 * Safe sync operation wrapper with error handling
 */
export const safeSync = <T>(operation: () => T, fallback?: T): T | null => {
  try {
    return operation();
  } catch {
    // Silent failure for safe operations
    return fallback ?? null;
  }
};

/**
 * Retry operation with exponential backoff
 */
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        break;
      }

      const delay = baseDelay * 2 ** attempt;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};
