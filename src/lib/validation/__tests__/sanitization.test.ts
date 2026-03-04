/**
 * Tests for input sanitization utilities
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  sanitizeObject,
  sanitizeStringLength,
  sanitizeFilename,
  sanitizeUrl,
  sanitizeClassName,
  sanitizeNumber,
  sanitizeBoolean,
} from '../sanitization';

describe('Sanitization Utilities', () => {
  describe('sanitizeString', () => {
    it('should escape HTML special characters', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('should escape ampersands', () => {
      expect(sanitizeString('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape quotes', () => {
      expect(sanitizeString('He said "Hello"')).toBe(
        'He said &quot;Hello&quot;'
      );
      expect(sanitizeString("It's working")).toBe('It&#x27;s working');
    });

    it('should escape less than and greater than', () => {
      expect(sanitizeString('5 < 10 > 3')).toBe('5 &lt; 10 &gt; 3');
    });

    it('should escape forward slashes', () => {
      expect(sanitizeString('</script>')).toBe('&lt;&#x2F;script&gt;');
    });

    it('should not modify safe strings', () => {
      expect(sanitizeString('Hello World')).toBe('Hello World');
      expect(sanitizeString('123')).toBe('123');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize string values in object', () => {
      const input = {
        name: '<script>alert("xss")</script>',
        age: 25,
        active: true,
      };

      const result = sanitizeObject(input);

      expect(result.name).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
      expect(result.age).toBe(25);
      expect(result.active).toBe(true);
    });

    it('should sanitize nested objects', () => {
      const input = {
        user: {
          name: '<b>John</b>',
          email: 'john@example.com',
        },
      };

      const result = sanitizeObject(input);

      expect(result.user).toEqual({
        name: '&lt;b&gt;John&lt;&#x2F;b&gt;',
        email: 'john@example.com',
      });
    });

    it('should sanitize arrays of strings', () => {
      const input = {
        tags: ['<script>', 'safe', '"quoted"'],
      };

      const result = sanitizeObject(input);

      expect(result.tags).toEqual([
        '&lt;script&gt;',
        'safe',
        '&quot;quoted&quot;',
      ]);
    });

    it('should sanitize arrays of objects', () => {
      const input = {
        items: [{ name: '<b>Item 1</b>' }, { name: 'Item 2' }],
      };

      const result = sanitizeObject(input);

      expect(result.items).toEqual([
        { name: '&lt;b&gt;Item 1&lt;&#x2F;b&gt;' },
        { name: 'Item 2' },
      ]);
    });
  });

  describe('sanitizeStringLength', () => {
    it('should truncate strings exceeding max length', () => {
      expect(sanitizeStringLength('Hello World', 5)).toBe('Hello');
    });

    it('should sanitize truncated strings', () => {
      // Truncates to 10 chars first: '<script>al', then sanitizes
      expect(sanitizeStringLength('<script>alert("xss")</script>', 10)).toBe(
        '&lt;script&gt;al'
      );
    });

    it('should not modify strings within limit', () => {
      expect(sanitizeStringLength('Hello', 10)).toBe('Hello');
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove path traversal attempts', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd');
    });

    it('should remove forward slashes', () => {
      expect(sanitizeFilename('path/to/file.txt')).toBe('pathtofile.txt');
    });

    it('should remove backslashes', () => {
      expect(sanitizeFilename('path\\to\\file.txt')).toBe('pathtofile.txt');
    });

    it('should remove null bytes', () => {
      expect(sanitizeFilename('file\0.txt')).toBe('file.txt');
    });

    it('should trim whitespace', () => {
      expect(sanitizeFilename('  file.txt  ')).toBe('file.txt');
    });

    it('should allow safe filenames', () => {
      expect(sanitizeFilename('document.pdf')).toBe('document.pdf');
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow https URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('should allow http URLs', () => {
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    });

    it('should allow relative URLs', () => {
      expect(sanitizeUrl('/path/to/page')).toBe('/path/to/page');
      expect(sanitizeUrl('./relative/path')).toBe('./relative/path');
    });

    it('should block javascript: URLs', () => {
      expect(sanitizeUrl('javascript:alert("xss")')).toBe('');
    });

    it('should block data: URLs', () => {
      expect(sanitizeUrl('data:text/html,<script>alert("xss")</script>')).toBe(
        ''
      );
    });

    it('should block vbscript: URLs', () => {
      expect(sanitizeUrl('vbscript:msgbox("xss")')).toBe('');
    });

    it('should handle mixed case', () => {
      expect(sanitizeUrl('JAVASCRIPT:alert("xss")')).toBe('');
      expect(sanitizeUrl('HTTPS://example.com')).toBe('HTTPS://example.com');
    });
  });

  describe('sanitizeClassName', () => {
    it('should allow alphanumeric characters', () => {
      expect(sanitizeClassName('button123')).toBe('button123');
    });

    it('should allow hyphens and underscores', () => {
      expect(sanitizeClassName('btn-primary_active')).toBe(
        'btn-primary_active'
      );
    });

    it('should remove special characters', () => {
      expect(sanitizeClassName('btn@#$%primary')).toBe('btnprimary');
    });

    it('should remove spaces', () => {
      expect(sanitizeClassName('btn primary')).toBe('btnprimary');
    });
  });

  describe('sanitizeNumber', () => {
    it('should return number within range', () => {
      expect(sanitizeNumber(5, 0, 10, 0)).toBe(5);
    });

    it('should clamp to minimum', () => {
      expect(sanitizeNumber(-5, 0, 10, 0)).toBe(0);
    });

    it('should clamp to maximum', () => {
      expect(sanitizeNumber(15, 0, 10, 0)).toBe(10);
    });

    it('should return default for NaN', () => {
      expect(sanitizeNumber('invalid', 0, 10, 5)).toBe(5);
    });

    it('should parse string numbers', () => {
      expect(sanitizeNumber('7', 0, 10, 0)).toBe(7);
    });
  });

  describe('sanitizeBoolean', () => {
    it('should return boolean values unchanged', () => {
      expect(sanitizeBoolean(true, false)).toBe(true);
      expect(sanitizeBoolean(false, true)).toBe(false);
    });

    it('should parse string "true"', () => {
      expect(sanitizeBoolean('true', false)).toBe(true);
      expect(sanitizeBoolean('TRUE', false)).toBe(true);
    });

    it('should parse string "false"', () => {
      expect(sanitizeBoolean('false', true)).toBe(false);
      expect(sanitizeBoolean('FALSE', true)).toBe(false);
    });

    it('should parse numeric strings', () => {
      expect(sanitizeBoolean('1', false)).toBe(true);
      expect(sanitizeBoolean('0', true)).toBe(false);
    });

    it('should parse yes/no', () => {
      expect(sanitizeBoolean('yes', false)).toBe(true);
      expect(sanitizeBoolean('no', true)).toBe(false);
    });

    it('should parse numbers', () => {
      expect(sanitizeBoolean(1, false)).toBe(true);
      expect(sanitizeBoolean(0, true)).toBe(false);
      expect(sanitizeBoolean(42, false)).toBe(true);
    });

    it('should return default for invalid input', () => {
      expect(sanitizeBoolean('invalid', true)).toBe(true);
      expect(sanitizeBoolean({}, false)).toBe(false);
    });
  });
});
