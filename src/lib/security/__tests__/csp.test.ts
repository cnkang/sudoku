/**
 * Tests for Content Security Policy (CSP) utilities
 */

import { describe, it, expect } from 'vitest';
import {
  generateCSPHeader,
  generateNonce,
  getCSPHeaderName,
  defaultCSPDirectives,
  type CSPDirectives,
} from '../csp';

describe('CSP Utilities', () => {
  describe('generateCSPHeader', () => {
    it('should generate CSP header without nonce', () => {
      const directives: CSPDirectives = {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'"],
        'img-src': ["'self'", 'data:'],
        'font-src': ["'self'"],
        'connect-src': ["'self'"],
        'frame-src': ["'none'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'upgrade-insecure-requests': true,
      };

      const header = generateCSPHeader(directives);

      expect(header).toContain("default-src 'self'");
      expect(header).toContain("script-src 'self'");
      expect(header).toContain("style-src 'self'");
      expect(header).toContain("img-src 'self' data:");
      expect(header).toContain('upgrade-insecure-requests');
    });

    it('should add nonce to script-src and style-src when provided', () => {
      const directives: CSPDirectives = {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'"],
        'img-src': ["'self'"],
        'font-src': ["'self'"],
        'connect-src': ["'self'"],
        'frame-src': ["'none'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'upgrade-insecure-requests': false,
      };

      const nonce = 'test-nonce-123';
      const header = generateCSPHeader(directives, nonce);

      expect(header).toContain(`script-src 'self' 'nonce-${nonce}'`);
      expect(header).toContain(`style-src 'self' 'nonce-${nonce}'`);
    });

    it('should not include upgrade-insecure-requests when false', () => {
      const directives: CSPDirectives = {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'"],
        'img-src': ["'self'"],
        'font-src': ["'self'"],
        'connect-src': ["'self'"],
        'frame-src': ["'none'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'upgrade-insecure-requests': false,
      };

      const header = generateCSPHeader(directives);

      expect(header).not.toContain('upgrade-insecure-requests');
    });

    it('should handle multiple sources per directive', () => {
      const directives: CSPDirectives = {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'strict-dynamic'", 'https://cdn.example.com'],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
        'font-src': ["'self'", 'data:'],
        'connect-src': ["'self'", 'https://api.example.com'],
        'frame-src': ["'none'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'upgrade-insecure-requests': true,
      };

      const header = generateCSPHeader(directives);

      expect(header).toContain(
        "script-src 'self' 'strict-dynamic' https://cdn.example.com"
      );
      expect(header).toContain("style-src 'self' 'unsafe-inline'");
      expect(header).toContain("img-src 'self' data: blob: https:");
    });
  });

  describe('generateNonce', () => {
    it('should generate a non-empty nonce', () => {
      const nonce = generateNonce();
      expect(nonce).toBeTruthy();
      expect(typeof nonce).toBe('string');
      expect(nonce.length).toBeGreaterThan(0);
    });

    it('should generate unique nonces', () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();
      expect(nonce1).not.toBe(nonce2);
    });

    it('should generate nonces with reasonable length', () => {
      const nonce = generateNonce();
      // UUID format is 36 characters, fallback is ~20-30 characters
      expect(nonce.length).toBeGreaterThan(10);
      expect(nonce.length).toBeLessThan(50);
    });
  });

  describe('getCSPHeaderName', () => {
    it('should return Content-Security-Policy by default', () => {
      const headerName = getCSPHeaderName();
      expect(headerName).toBe('Content-Security-Policy');
    });

    it('should return Content-Security-Policy when reportOnly is false', () => {
      const headerName = getCSPHeaderName(false);
      expect(headerName).toBe('Content-Security-Policy');
    });

    it('should return Content-Security-Policy-Report-Only when reportOnly is true', () => {
      const headerName = getCSPHeaderName(true);
      expect(headerName).toBe('Content-Security-Policy-Report-Only');
    });
  });

  describe('defaultCSPDirectives', () => {
    it('should have strict default-src', () => {
      expect(defaultCSPDirectives['default-src']).toEqual(["'self'"]);
    });

    it('should allow unsafe-inline in script-src for Next.js runtime bootstrap', () => {
      expect(defaultCSPDirectives['script-src']).toContain("'unsafe-inline'");
    });

    it('should define script-src-elem for runtime chunk loading', () => {
      expect(defaultCSPDirectives['script-src-elem']).toBeDefined();
      expect(defaultCSPDirectives['script-src-elem']).toContain("'self'");
    });

    it('should allow unsafe-inline for style-src (required for CSS Modules)', () => {
      expect(defaultCSPDirectives['style-src']).toContain("'unsafe-inline'");
    });

    it('should allow data: URIs for img-src', () => {
      expect(defaultCSPDirectives['img-src']).toContain('data:');
    });

    it('should disallow frames', () => {
      expect(defaultCSPDirectives['frame-src']).toEqual(["'none'"]);
      expect(defaultCSPDirectives['frame-ancestors']).toEqual(["'none'"]);
    });

    it('should disallow objects/plugins', () => {
      expect(defaultCSPDirectives['object-src']).toEqual(["'none'"]);
    });

    it('should enable upgrade-insecure-requests', () => {
      expect(defaultCSPDirectives['upgrade-insecure-requests']).toBe(true);
    });

    it('should restrict base-uri to self', () => {
      expect(defaultCSPDirectives['base-uri']).toEqual(["'self'"]);
    });

    it('should restrict form-action to self', () => {
      expect(defaultCSPDirectives['form-action']).toEqual(["'self'"]);
    });
  });

  describe('CSP Header Integration', () => {
    it('should generate valid CSP header from default directives', () => {
      const header = generateCSPHeader(defaultCSPDirectives);

      // Should be a non-empty string
      expect(header).toBeTruthy();
      expect(typeof header).toBe('string');

      // Should contain all required directives
      expect(header).toContain('default-src');
      expect(header).toContain('script-src');
      expect(header).toContain('style-src');
      expect(header).toContain('img-src');
      expect(header).toContain('font-src');
      expect(header).toContain('connect-src');
      expect(header).toContain('frame-src');
      expect(header).toContain('object-src');
      expect(header).toContain('base-uri');
      expect(header).toContain('form-action');
      expect(header).toContain('frame-ancestors');

      // Should use semicolons as separators
      expect(header).toContain(';');
    });

    it('should generate valid CSP header with nonce', () => {
      const nonce = generateNonce();
      const header = generateCSPHeader(defaultCSPDirectives, nonce);

      expect(header).toContain(`'nonce-${nonce}'`);
      expect(header).toContain('script-src');
      expect(header).toContain('style-src');
    });
  });
});
