import { describe, expect, it, vi } from 'vitest';
import {
  createErrorResponse,
  ERROR_MESSAGES,
  ERROR_TYPES,
  extractErrorMessage,
  retryOperation,
  safeAsync,
  safeSync,
} from '../error-handling';

describe('error-handling utilities', () => {
  describe('ERROR_TYPES', () => {
    it('should export all expected error types', () => {
      expect(ERROR_TYPES.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ERROR_TYPES.NETWORK_ERROR).toBe('NETWORK_ERROR');
      expect(ERROR_TYPES.CACHE_ERROR).toBe('CACHE_ERROR');
      expect(ERROR_TYPES.GENERATION_ERROR).toBe('GENERATION_ERROR');
      expect(ERROR_TYPES.RATE_LIMIT_ERROR).toBe('RATE_LIMIT_ERROR');
    });
  });

  describe('ERROR_MESSAGES', () => {
    it('should export all expected error messages', () => {
      expect(ERROR_MESSAGES.INTERNAL_SERVER_ERROR).toBe(
        'Internal Server Error'
      );
      expect(ERROR_MESSAGES.INVALID_REQUEST).toBe('Invalid request parameters');
      expect(ERROR_MESSAGES.RATE_LIMITED).toBe(
        'Please wait before making another request'
      );
      expect(ERROR_MESSAGES.CACHE_MISS).toBe(
        'Requested data not found in cache'
      );
      expect(ERROR_MESSAGES.GENERATION_FAILED).toBe(
        'Failed to generate puzzle'
      );
      expect(ERROR_MESSAGES.NETWORK_UNAVAILABLE).toBe('Network request failed');
    });
  });

  describe('extractErrorMessage', () => {
    it('should extract message from Error instance', () => {
      const error = new Error('Test error message');
      expect(extractErrorMessage(error)).toBe('Test error message');
    });

    it('should return string error as-is', () => {
      const error = 'String error message';
      expect(extractErrorMessage(error)).toBe('String error message');
    });

    it('should extract message from object with message property', () => {
      const error = { message: 'Object error message' };
      expect(extractErrorMessage(error)).toBe('Object error message');
    });

    it('should return default message for unknown error types', () => {
      expect(extractErrorMessage(null)).toBe(
        ERROR_MESSAGES.INTERNAL_SERVER_ERROR
      );
      expect(extractErrorMessage(undefined)).toBe(
        ERROR_MESSAGES.INTERNAL_SERVER_ERROR
      );
      expect(extractErrorMessage(123)).toBe(
        ERROR_MESSAGES.INTERNAL_SERVER_ERROR
      );
      expect(extractErrorMessage({})).toBe(
        ERROR_MESSAGES.INTERNAL_SERVER_ERROR
      );
    });

    it('should handle object with non-string message property', () => {
      const error = { message: 123 };
      expect(extractErrorMessage(error)).toBe('123');
    });
  });

  describe('createErrorResponse', () => {
    it('should create basic error response', () => {
      const error = new Error('Test error');
      const response = createErrorResponse(error);

      expect(response).toEqual({
        error: 'Test error',
      });
    });

    it('should create error response with code', () => {
      const error = 'Test error';
      const response = createErrorResponse(error, 'TEST_CODE');

      expect(response).toEqual({
        error: 'Test error',
        code: 'TEST_CODE',
      });
    });

    it('should create error response with code and details', () => {
      const error = 'Test error';
      const details = { field: 'value', nested: { data: 'test' } };
      const response = createErrorResponse(error, 'TEST_CODE', details);

      expect(response).toEqual({
        error: 'Test error',
        code: 'TEST_CODE',
        details,
      });
    });

    it('should create error response with only details', () => {
      const error = 'Test error';
      const details = { field: 'value' };
      const response = createErrorResponse(error, undefined, details);

      expect(response).toEqual({
        error: 'Test error',
        details,
      });
    });
  });

  describe('safeAsync', () => {
    it('should return result when operation succeeds', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const result = await safeAsync(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledOnce();
    });

    it('should return null when operation fails and no fallback provided', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failed'));
      const result = await safeAsync(operation);

      expect(result).toBeNull();
      expect(operation).toHaveBeenCalledOnce();
    });

    it('should return fallback when operation fails and fallback provided', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failed'));
      const fallback = 'fallback value';
      const result = await safeAsync(operation, fallback);

      expect(result).toBe(fallback);
      expect(operation).toHaveBeenCalledOnce();
    });

    it('should handle synchronous errors in async operation', async () => {
      const operation = vi.fn().mockImplementation(() => {
        throw new Error('Sync error in async');
      });
      const result = await safeAsync(operation);

      expect(result).toBeNull();
      expect(operation).toHaveBeenCalledOnce();
    });
  });

  describe('safeSync', () => {
    it('should return result when operation succeeds', () => {
      const operation = vi.fn().mockReturnValue('success');
      const result = safeSync(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledOnce();
    });

    it('should return null when operation fails and no fallback provided', () => {
      const operation = vi.fn().mockImplementation(() => {
        throw new Error('Failed');
      });
      const result = safeSync(operation);

      expect(result).toBeNull();
      expect(operation).toHaveBeenCalledOnce();
    });

    it('should return fallback when operation fails and fallback provided', () => {
      const operation = vi.fn().mockImplementation(() => {
        throw new Error('Failed');
      });
      const fallback = 'fallback value';
      const result = safeSync(operation, fallback);

      expect(result).toBe(fallback);
      expect(operation).toHaveBeenCalledOnce();
    });
  });

  describe('retryOperation', () => {
    it('should return result on first success', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const result = await retryOperation(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledOnce();
    });

    it('should retry on failure and eventually succeed', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');

      const result = await retryOperation(operation, 3, 10); // Use small delay for testing

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should throw last error after max retries exceeded', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockRejectedValue(new Error('Final failure'));

      await expect(retryOperation(operation, 2, 10)).rejects.toThrow(
        'Final failure'
      );
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should use exponential backoff for delays', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      const result = await retryOperation(operation, 2, 50);
      const endTime = Date.now();

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
      // Should have waited at least 50ms for the first retry
      expect(endTime - startTime).toBeGreaterThanOrEqual(40);
    });

    it('should use default parameters when not provided', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockRejectedValueOnce(new Error('Fail 3'))
        .mockRejectedValue(new Error('Final failure'));

      await expect(retryOperation(operation)).rejects.toThrow('Final failure');
      expect(operation).toHaveBeenCalledTimes(4); // Initial + 3 retries (default)
    });
  });
});
