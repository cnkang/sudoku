import { describe, expect, it } from 'vitest';
import {
  API_ERRORS,
  createValidationError,
  HOOK_ERRORS,
  SW_ERRORS,
  UTILITY_ERRORS,
  VALIDATION_ERRORS,
} from '@/utils/errorMessages';

describe('errorMessages', () => {
  describe('VALIDATION_ERRORS', () => {
    it('should have all required validation error messages', () => {
      expect(VALIDATION_ERRORS.INVALID_GRID_SIZE).toBe(
        'Invalid grid size. Must be 4, 6, or 9.'
      );
      expect(VALIDATION_ERRORS.INVALID_DIFFICULTY_RANGE).toBe(
        'Invalid difficulty level. Must be between 1 and 10.'
      );
      expect(VALIDATION_ERRORS.DIFFICULTY_REQUIRED).toBe(
        'Difficulty must be a valid number.'
      );
      expect(VALIDATION_ERRORS.DIFFICULTY_POSITIVE_INTEGER).toBe(
        'Difficulty must be a positive integer.'
      );
      expect(VALIDATION_ERRORS.INVALID_SEED_FORMAT).toBe(
        'Invalid seed. Use 1-64 characters containing only letters, numbers, "_" or "-".'
      );
    });
  });

  describe('createValidationError', () => {
    it('should create dynamic row error message', () => {
      expect(createValidationError.invalidRow(5, 8)).toBe(
        'Invalid row: 5. Must be between 0 and 8.'
      );
      expect(createValidationError.invalidRow(-1, 8)).toBe(
        'Invalid row: -1. Must be between 0 and 8.'
      );
    });

    it('should create dynamic column error message', () => {
      expect(createValidationError.invalidColumn(10, 8)).toBe(
        'Invalid column: 10. Must be between 0 and 8.'
      );
      expect(createValidationError.invalidColumn(0, 5)).toBe(
        'Invalid column: 0. Must be between 0 and 5.'
      );
    });

    it('should create dynamic cell value error message', () => {
      expect(createValidationError.invalidCellValue(10, 9)).toBe(
        'Invalid cell value: 10. Must be 0 or between 1 and 9.'
      );
      expect(createValidationError.invalidCellValue(-1, 4)).toBe(
        'Invalid cell value: -1. Must be 0 or between 1 and 4.'
      );
    });

    it('should create dynamic grid error message', () => {
      expect(createValidationError.invalidGrid(9)).toBe(
        'Invalid grid: must be a 9x9 array.'
      );
      expect(createValidationError.invalidGrid(4)).toBe(
        'Invalid grid: must be a 4x4 array.'
      );
    });

    it('should create dynamic row structure error message', () => {
      expect(createValidationError.invalidRow_(0, 9)).toBe(
        'Invalid row 0: must contain exactly 9 elements.'
      );
      expect(createValidationError.invalidRow_(5, 6)).toBe(
        'Invalid row 5: must contain exactly 6 elements.'
      );
    });

    it('should create dynamic cell position error message', () => {
      expect(
        createValidationError.invalidCellAt(2, 3, 'Value out of range')
      ).toBe('Invalid cell at [2, 3]: Value out of range');
    });
  });

  describe('API_ERRORS', () => {
    it('should have all required API error messages', () => {
      expect(API_ERRORS.GENERATOR_FAILED).toBe('Failed to generate puzzle');
      expect(API_ERRORS.NETWORK_FAILED).toBe('Network request failed');
      expect(API_ERRORS.OFFLINE_MESSAGE).toBe(
        'Offline - please try again when connected'
      );
      expect(API_ERRORS.SYNC_PROGRESS_FAILED).toBe('Failed to sync progress');
      expect(API_ERRORS.SYNC_ACHIEVEMENT_FAILED).toBe(
        'Failed to sync achievement'
      );
    });
  });

  describe('SW_ERRORS', () => {
    it('should have all required Service Worker error messages', () => {
      expect(SW_ERRORS.UNTRUSTED_ORIGIN).toBe(
        'Security: Rejecting message from untrusted origin/source'
      );
      expect(SW_ERRORS.INVALID_MESSAGE).toBe(
        'Security: Rejecting message with invalid payload/type'
      );
      expect(SW_ERRORS.INVALID_SOURCE_URL).toBe(
        'Ignoring message with invalid source URL'
      );
      expect(SW_ERRORS.CACHE_FAILED).toBe('Failed to cache data');
      expect(SW_ERRORS.SYNC_FAILED).toBe('Failed to sync data');
    });
  });

  describe('HOOK_ERRORS', () => {
    it('should have all required hook error messages', () => {
      expect(HOOK_ERRORS.THEME_CONTEXT_MISSING).toBe(
        'useThemeContext must be used within a ThemeProvider'
      );
      expect(HOOK_ERRORS.STORAGE_UNAVAILABLE).toBe('Storage not available');
      expect(HOOK_ERRORS.MEDIA_QUERY_NOT_SUPPORTED).toBe(
        'Media queries not supported'
      );
    });
  });

  describe('UTILITY_ERRORS', () => {
    it('should have static utility error messages', () => {
      expect(UTILITY_ERRORS.DEFAULT_THEME_NOT_FOUND).toBe(
        'Default theme not found'
      );
      expect(UTILITY_ERRORS.SECURE_RANDOM_UNAVAILABLE).toBe(
        'Secure random values are not available in this environment'
      );
      expect(UTILITY_ERRORS.SECURE_RANDOM_GENERATION_FAILED).toBe(
        'Unable to generate secure random value'
      );
    });

    it('should create dynamic utility error messages', () => {
      expect(UTILITY_ERRORS.UNSUPPORTED_GRID_SIZE(5)).toBe(
        'Unsupported grid size: 5'
      );
      expect(UTILITY_ERRORS.UNSUPPORTED_GRID_SIZE(10)).toBe(
        'Unsupported grid size: 10'
      );
      expect(UTILITY_ERRORS.HTTP_ERROR(404)).toBe('HTTP error! status: 404');
      expect(UTILITY_ERRORS.HTTP_ERROR(500)).toBe('HTTP error! status: 500');
    });
  });

  describe('Error message consistency', () => {
    it('should not have duplicate error messages across categories', () => {
      const allMessages = new Set<string>();
      const duplicates: string[] = [];

      const addMessages = (obj: Record<string, unknown>) => {
        for (const value of Object.values(obj)) {
          if (typeof value === 'string') {
            if (allMessages.has(value)) {
              duplicates.push(value);
            }
            allMessages.add(value);
          }
        }
      };

      addMessages(VALIDATION_ERRORS);
      addMessages(API_ERRORS);
      addMessages(SW_ERRORS);
      addMessages(HOOK_ERRORS);

      expect(duplicates).toHaveLength(0);
    });
  });
});
