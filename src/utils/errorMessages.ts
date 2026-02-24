/**
 * Centralized error messages to eliminate string literal duplication
 * and improve maintainability across the codebase.
 */

/**
 * Validation error messages
 */
export const VALIDATION_ERRORS = {
  INVALID_GRID_SIZE: 'Invalid grid size. Must be 4, 6, or 9.',
  INVALID_DIFFICULTY_RANGE:
    'Invalid difficulty level. Must be between 1 and 10.',
  DIFFICULTY_REQUIRED: 'Difficulty must be a valid number.',
  DIFFICULTY_POSITIVE_INTEGER: 'Difficulty must be a positive integer.',
  INVALID_SEED_FORMAT:
    'Invalid seed. Use 1-64 characters containing only letters, numbers, "_" or "-".',
} as const;

/**
 * Generate dynamic validation error messages
 */
export const createValidationError = {
  invalidRow: (row: number, maxRow: number) =>
    `Invalid row: ${row}. Must be between 0 and ${maxRow}.`,
  invalidColumn: (col: number, maxCol: number) =>
    `Invalid column: ${col}. Must be between 0 and ${maxCol}.`,
  invalidCellValue: (value: number, maxValue: number) =>
    `Invalid cell value: ${value}. Must be 0 or between 1 and ${maxValue}.`,
  invalidGrid: (size: number) =>
    `Invalid grid: must be a ${size}x${size} array.`,
  invalidRow_: (rowIndex: number, size: number) =>
    `Invalid row ${rowIndex}: must contain exactly ${size} elements.`,
  invalidCellAt: (row: number, col: number, message: string) =>
    `Invalid cell at [${row}, ${col}]: ${message}`,
} as const;

/**
 * API error messages
 */
export const API_ERRORS = {
  GENERATOR_FAILED: 'Failed to generate puzzle',
  NETWORK_FAILED: 'Network request failed',
  OFFLINE_MESSAGE: 'Offline - please try again when connected',
  SYNC_PROGRESS_FAILED: 'Failed to sync progress',
  SYNC_ACHIEVEMENT_FAILED: 'Failed to sync achievement',
} as const;

/**
 * Service Worker error messages
 */
export const SW_ERRORS = {
  UNTRUSTED_ORIGIN: 'Security: Rejecting message from untrusted origin/source',
  INVALID_MESSAGE: 'Security: Rejecting message with invalid payload/type',
  INVALID_SOURCE_URL: 'Ignoring message with invalid source URL',
  CACHE_FAILED: 'Failed to cache data',
  SYNC_FAILED: 'Failed to sync data',
} as const;

/**
 * Hook error messages
 */
export const HOOK_ERRORS = {
  THEME_CONTEXT_MISSING: 'useThemeContext must be used within a ThemeProvider',
  STORAGE_UNAVAILABLE: 'Storage not available',
  MEDIA_QUERY_NOT_SUPPORTED: 'Media queries not supported',
} as const;

/**
 * Utility error messages
 */
export const UTILITY_ERRORS = {
  UNSUPPORTED_GRID_SIZE: (size: number) => `Unsupported grid size: ${size}`,
  DEFAULT_THEME_NOT_FOUND: 'Default theme not found',
  SECURE_RANDOM_UNAVAILABLE:
    'Secure random values are not available in this environment',
  SECURE_RANDOM_GENERATION_FAILED: 'Unable to generate secure random value',
  HTTP_ERROR: (status: number) => `HTTP error! status: ${status}`,
} as const;
