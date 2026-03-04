import {
  logSecurityEvent,
  getSecurityEvents,
  getSecurityEventStats,
  clearSecurityEventLog,
  logRateLimitEvent,
  logValidationError,
  logCsrfFailure,
  logOriginDenied,
  logPayloadTooLarge,
  logCspViolation,
  logSuspiciousActivity,
  type SecurityEvent,
} from '../securityLogger';

describe('Security Logger', () => {
  beforeEach(() => {
    clearSecurityEventLog();
  });

  describe('logSecurityEvent', () => {
    it('logs a security event', () => {
      const event: SecurityEvent = {
        type: 'rate_limit',
        timestamp: Date.now(),
        severity: 'medium',
        action: 'rate_limited',
        details: {
          ip: '203.0.113.10',
          endpoint: '/api/test',
        },
      };

      logSecurityEvent(event);

      const events = getSecurityEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual(event);
    });

    it('maintains log size limit', () => {
      // Log more than MAX_LOG_SIZE events
      for (let i = 0; i < 1100; i++) {
        logSecurityEvent({
          type: 'validation_error',
          timestamp: Date.now(),
          severity: 'low',
          action: 'blocked',
          details: { ip: '203.0.113.10', endpoint: '/api/test', error: 'test' },
        });
      }

      const events = getSecurityEvents(2000);
      expect(events.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('getSecurityEvents', () => {
    it('returns recent events', () => {
      logRateLimitEvent({
        ip: '203.0.113.10',
        endpoint: '/api/test',
      });
      logValidationError({
        ip: '203.0.113.11',
        endpoint: '/api/test2',
        error: 'Invalid input',
      });

      const events = getSecurityEvents();
      expect(events).toHaveLength(2);
    });

    it('filters events by type', () => {
      logRateLimitEvent({
        ip: '203.0.113.10',
        endpoint: '/api/test',
      });
      logValidationError({
        ip: '203.0.113.11',
        endpoint: '/api/test2',
        error: 'Invalid input',
      });

      const rateLimitEvents = getSecurityEvents(100, 'rate_limit');
      expect(rateLimitEvents).toHaveLength(1);
      expect(rateLimitEvents[0]?.type).toBe('rate_limit');
    });

    it('respects limit parameter', () => {
      for (let i = 0; i < 10; i++) {
        logRateLimitEvent({
          ip: '203.0.113.10',
          endpoint: '/api/test',
        });
      }

      const events = getSecurityEvents(5);
      expect(events).toHaveLength(5);
    });
  });

  describe('getSecurityEventStats', () => {
    it('returns statistics about security events', () => {
      logRateLimitEvent({
        ip: '203.0.113.10',
        endpoint: '/api/test',
      });
      logRateLimitEvent({
        ip: '203.0.113.11',
        endpoint: '/api/test',
      });
      logValidationError({
        ip: '203.0.113.12',
        endpoint: '/api/test2',
        error: 'Invalid input',
      });

      const stats = getSecurityEventStats();
      expect(stats.total).toBe(3);
      expect(stats.byType.rate_limit).toBe(2);
      expect(stats.byType.validation_error).toBe(1);
      expect(stats.bySeverity.medium).toBe(2);
      expect(stats.bySeverity.low).toBe(1);
    });
  });

  describe('helper functions', () => {
    it('logRateLimitEvent logs with correct type and severity', () => {
      logRateLimitEvent({
        ip: '203.0.113.10',
        endpoint: '/api/test',
      });

      const events = getSecurityEvents();
      expect(events[0]?.type).toBe('rate_limit');
      expect(events[0]?.severity).toBe('medium');
      expect(events[0]?.action).toBe('rate_limited');
    });

    it('logValidationError logs with correct type and severity', () => {
      logValidationError({
        ip: '203.0.113.10',
        endpoint: '/api/test',
        error: 'Invalid input',
      });

      const events = getSecurityEvents();
      expect(events[0]?.type).toBe('validation_error');
      expect(events[0]?.severity).toBe('low');
      expect(events[0]?.action).toBe('blocked');
    });

    it('logCsrfFailure logs with correct type and severity', () => {
      logCsrfFailure({
        ip: '203.0.113.10',
        endpoint: '/api/test',
        method: 'POST',
      });

      const events = getSecurityEvents();
      expect(events[0]?.type).toBe('csrf_failure');
      expect(events[0]?.severity).toBe('high');
      expect(events[0]?.action).toBe('blocked');
    });

    it('logOriginDenied logs with correct type and severity', () => {
      logOriginDenied({
        ip: '203.0.113.10',
        endpoint: '/api/test',
      });

      const events = getSecurityEvents();
      expect(events[0]?.type).toBe('origin_denied');
      expect(events[0]?.severity).toBe('high');
      expect(events[0]?.action).toBe('blocked');
    });

    it('logPayloadTooLarge logs with correct type and severity', () => {
      logPayloadTooLarge({
        ip: '203.0.113.10',
        endpoint: '/api/test',
      });

      const events = getSecurityEvents();
      expect(events[0]?.type).toBe('payload_too_large');
      expect(events[0]?.severity).toBe('medium');
      expect(events[0]?.action).toBe('blocked');
    });

    it('logCspViolation logs with correct type and severity', () => {
      logCspViolation({
        blockedUri: 'https://evil.com/script.js',
        endpoint: '/page',
      });

      const events = getSecurityEvents();
      expect(events[0]?.type).toBe('csp_violation');
      expect(events[0]?.severity).toBe('high');
      expect(events[0]?.action).toBe('logged');
    });

    it('logSuspiciousActivity logs with correct type and severity', () => {
      logSuspiciousActivity({
        ip: '203.0.113.10',
        endpoint: '/api/test',
        error: 'SQL injection attempt',
      });

      const events = getSecurityEvents();
      expect(events[0]?.type).toBe('suspicious_activity');
      expect(events[0]?.severity).toBe('critical');
      expect(events[0]?.action).toBe('blocked');
    });
  });
});
