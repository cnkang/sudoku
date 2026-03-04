/**
 * Tests for error sanitization utilities
 * Validates Requirements 12.4, 18.2
 */

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  sanitizeErrorForClient,
  createDetailedErrorLog,
  sanitizeZodError,
  logErrorServerSide,
  type DetailedErrorLog,
} from '../errorSanitization';

describe('errorSanitization', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('sanitizeErrorForClient', () => {
    it('should return generic error message in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Database connection failed at /var/lib/db');

      const result = sanitizeErrorForClient(error);

      expect(result.error).toBe(
        'An error occurred while processing your request'
      );
      expect(result.error).not.toContain('Database');
      expect(result.error).not.toContain('/var/lib/db');
      expect(result.timestamp).toBeTypeOf('number');
    });

    it('should return safe error message in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Database connection failed at /var/lib/db');

      const result = sanitizeErrorForClient(error);

      expect(result.error).toContain('Database connection failed');
      expect(result.error).not.toContain('/var/lib/db');
      expect(result.error).toContain('[path]');
    });

    it('should include safe error codes in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Validation failed');

      const result = sanitizeErrorForClient(error, 'VALIDATION_ERROR');

      expect(result.code).toBe('VALIDATION_ERROR');
      expect(result.error).toBe('Invalid request data');
    });

    it('should exclude unsafe error codes in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Internal error');

      const result = sanitizeErrorForClient(error, 'INTERNAL_DATABASE_ERROR');

      expect(result.code).toBeUndefined();
      expect(result.error).toBe(
        'An error occurred while processing your request'
      );
    });

    it('should handle string errors', () => {
      process.env.NODE_ENV = 'production';
      const error = 'Something went wrong at /home/user/app';

      const result = sanitizeErrorForClient(error);

      expect(result.error).toBe(
        'An error occurred while processing your request'
      );
      expect(result.error).not.toContain('/home/user/app');
    });

    it('should handle error objects with message property', () => {
      process.env.NODE_ENV = 'production';
      const error = { message: 'Custom error at /path/to/file' };

      const result = sanitizeErrorForClient(error);

      expect(result.error).toBe(
        'An error occurred while processing your request'
      );
    });

    it('should handle unknown error types', () => {
      process.env.NODE_ENV = 'production';
      const error = 123;

      const result = sanitizeErrorForClient(error);

      expect(result.error).toBe(
        'An error occurred while processing your request'
      );
    });

    it('should map rate limit error code correctly', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Rate limit exceeded');

      const result = sanitizeErrorForClient(error, 'RATE_LIMIT_ERROR');

      expect(result.error).toBe('Too many requests');
      expect(result.code).toBe('RATE_LIMIT_ERROR');
    });

    it('should not expose stack traces', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at /home/user/app/file.ts:10:5';

      const result = sanitizeErrorForClient(error);

      expect(result).not.toHaveProperty('stack');
      expect(JSON.stringify(result)).not.toContain('stack');
    });
  });

  describe('createDetailedErrorLog', () => {
    it('should include full error details', () => {
      const error = new Error('Database connection failed');
      error.stack = 'Error: Database connection failed\n    at file.ts:10:5';

      const log = createDetailedErrorLog(error, 'DATABASE_ERROR');

      expect(log.error).toBe('Database connection failed');
      expect(log.code).toBe('DATABASE_ERROR');
      expect(log.stack).toContain('Database connection failed');
      expect(log.timestamp).toBeTypeOf('number');
    });

    it('should include request context', () => {
      const error = new Error('Request failed');
      const context = {
        url: '/api/test',
        method: 'POST',
        userAgent: 'Mozilla/5.0',
        ip: '192.168.1.1',
      };

      const log = createDetailedErrorLog(error, 'REQUEST_ERROR', context);

      expect(log.context).toEqual(context);
    });

    it('should handle errors without stack traces', () => {
      const error = new Error('Simple error');
      error.stack = undefined;

      const log = createDetailedErrorLog(error);

      expect(log.error).toBe('Simple error');
      expect(log.stack).toBeUndefined();
    });

    it('should include error details for object errors', () => {
      const error = {
        message: 'Custom error',
        code: 500,
        details: { foo: 'bar' },
      };

      const log = createDetailedErrorLog(error);

      expect(log.details).toEqual(error);
    });

    it('should handle string errors', () => {
      const error = 'String error message';

      const log = createDetailedErrorLog(error);

      expect(log.error).toBe('String error message');
    });
  });

  describe('sanitizeZodError', () => {
    it('should return field details in development', () => {
      process.env.NODE_ENV = 'development';
      const zodError = {
        issues: [
          { path: ['email'], message: 'Invalid email format' },
          { path: ['age'], message: 'Must be a positive number' },
        ],
      };

      const result = sanitizeZodError(zodError);

      expect(result.error).toBe('Invalid request data');
      expect(result.code).toBe('VALIDATION_ERROR');
      expect(result.fields).toHaveLength(2);
      expect(result.fields?.[0]).toEqual({
        field: 'email',
        message: 'Invalid email format',
      });
    });

    it('should return generic error in production', () => {
      process.env.NODE_ENV = 'production';
      const zodError = {
        issues: [{ path: ['email'], message: 'Invalid email format' }],
      };

      const result = sanitizeZodError(zodError);

      expect(result.error).toBe('Invalid request data');
      expect(result.code).toBe('VALIDATION_ERROR');
      expect(result.fields).toBeUndefined();
    });

    it('should handle nested field paths', () => {
      process.env.NODE_ENV = 'development';
      const zodError = {
        issues: [
          { path: ['user', 'profile', 'email'], message: 'Invalid email' },
        ],
      };

      const result = sanitizeZodError(zodError);

      expect(result.fields?.[0].field).toBe('user.profile.email');
    });

    it('should handle array indices in paths', () => {
      process.env.NODE_ENV = 'development';
      const zodError = {
        issues: [{ path: ['items', 0, 'name'], message: 'Required field' }],
      };

      const result = sanitizeZodError(zodError);

      expect(result.fields?.[0].field).toBe('items.0.name');
    });
  });

  describe('logErrorServerSide', () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should log structured JSON in production', () => {
      process.env.NODE_ENV = 'production';
      const errorLog: DetailedErrorLog = {
        error: 'Test error',
        code: 'TEST_ERROR',
        timestamp: Date.now(),
        stack: 'Error stack trace',
      };

      logErrorServerSide(errorLog);

      expect(consoleErrorSpy).toHaveBeenCalledOnce();
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
      expect(loggedData.level).toBe('error');
      expect(loggedData.error).toBe('Test error');
      expect(loggedData.code).toBe('TEST_ERROR');
    });

    it('should log readable format in development', () => {
      process.env.NODE_ENV = 'development';
      const errorLog: DetailedErrorLog = {
        error: 'Test error',
        code: 'TEST_ERROR',
        timestamp: Date.now(),
        context: {
          url: '/api/test',
          method: 'POST',
        },
      };

      logErrorServerSide(errorLog);

      expect(consoleErrorSpy).toHaveBeenCalledOnce();
      expect(consoleErrorSpy.mock.calls[0][0]).toBe('Error occurred:');
      expect(consoleErrorSpy.mock.calls[0][1]).toMatchObject({
        message: 'Test error',
        code: 'TEST_ERROR',
      });
    });

    it('should include all error details in log', () => {
      process.env.NODE_ENV = 'production';
      const errorLog: DetailedErrorLog = {
        error: 'Complete error',
        code: 'COMPLETE_ERROR',
        timestamp: Date.now(),
        stack: 'Stack trace',
        details: { foo: 'bar' },
        context: {
          url: '/api/test',
          method: 'GET',
          userAgent: 'Test Agent',
          ip: '127.0.0.1',
        },
      };

      logErrorServerSide(errorLog);

      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
      expect(loggedData).toMatchObject({
        level: 'error',
        error: 'Complete error',
        code: 'COMPLETE_ERROR',
        stack: 'Stack trace',
        details: { foo: 'bar' },
        context: {
          url: '/api/test',
          method: 'GET',
          userAgent: 'Test Agent',
          ip: '127.0.0.1',
        },
      });
    });
  });

  describe('security requirements', () => {
    it('should never expose stack traces to clients (Requirement 12.4)', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at /home/user/app/file.ts:10:5';

      const clientResponse = sanitizeErrorForClient(error);

      expect(clientResponse).not.toHaveProperty('stack');
      expect(clientResponse.error).not.toContain('file.ts');
      expect(clientResponse.error).not.toContain('/home/user/app');
    });

    it('should display user-friendly messages without technical details (Requirement 18.2)', () => {
      process.env.NODE_ENV = 'production';
      const technicalError = new Error(
        'ECONNREFUSED: Connection refused at 127.0.0.1:5432'
      );

      const clientResponse = sanitizeErrorForClient(technicalError);

      expect(clientResponse.error).toBe(
        'An error occurred while processing your request'
      );
      expect(clientResponse.error).not.toContain('ECONNREFUSED');
      expect(clientResponse.error).not.toContain('127.0.0.1');
      expect(clientResponse.error).not.toContain('5432');
    });

    it('should log detailed errors server-side only', () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      process.env.NODE_ENV = 'production';

      const error = new Error(
        'Database connection failed at /var/lib/postgresql'
      );
      error.stack = 'Error: Database connection failed\n    at db.ts:42:10';

      const detailedLog = createDetailedErrorLog(error, 'DATABASE_ERROR', {
        url: '/api/data',
        method: 'POST',
        ip: '192.168.1.100',
      });

      logErrorServerSide(detailedLog);

      // Server-side log should have full details
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
      expect(loggedData.error).toContain('Database connection failed');
      expect(loggedData.stack).toContain('db.ts:42:10');
      expect(loggedData.context?.ip).toBe('192.168.1.100');

      // Client response should be sanitized
      const clientResponse = sanitizeErrorForClient(error);
      expect(clientResponse.error).not.toContain('Database');
      expect(clientResponse.error).not.toContain('/var/lib/postgresql');

      consoleErrorSpy.mockRestore();
    });
  });
});
