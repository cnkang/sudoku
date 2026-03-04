/**
 * Security Event Logging
 *
 * Centralized logging for security-related events
 * Requirements: 12.5 - Log security events for monitoring
 */

export type SecurityEventType =
  | 'csp_violation'
  | 'rate_limit'
  | 'validation_error'
  | 'auth_failure'
  | 'csrf_failure'
  | 'origin_denied'
  | 'payload_too_large'
  | 'suspicious_activity';

export type SecurityEventSeverity = 'low' | 'medium' | 'high' | 'critical';

export type SecurityEventAction = 'logged' | 'blocked' | 'rate_limited';

export interface SecurityEvent {
  type: SecurityEventType;
  timestamp: number;
  severity: SecurityEventSeverity;
  action: SecurityEventAction;
  details: {
    ip?: string;
    userAgent?: string;
    endpoint?: string;
    error?: string;
    blockedUri?: string;
    method?: string;
    payload?: unknown;
  };
}

/**
 * Security event log store
 * In production, this should send to a monitoring service
 */
const securityEventLog: SecurityEvent[] = [];
const MAX_LOG_SIZE = 1000;

/**
 * Logs a security event
 *
 * @param event - Security event to log
 */
export function logSecurityEvent(event: SecurityEvent): void {
  // Add to in-memory log
  securityEventLog.push(event);

  // Trim log if it exceeds max size
  if (securityEventLog.length > MAX_LOG_SIZE) {
    securityEventLog.shift();
  }

  // Log to console with appropriate level
  const logLevel = getLogLevel(event.severity);
  const logMessage = formatSecurityEvent(event);

  if (process.env.NODE_ENV === 'production') {
    // Structured logging for production
    // biome-ignore lint/suspicious/noConsole: Security logging requires console output
    console[logLevel](
      JSON.stringify({
        level: logLevel,
        category: 'security',
        ...event,
      })
    );
  } else {
    // Readable logging for development
    // biome-ignore lint/suspicious/noConsole: Security logging requires console output
    console[logLevel]('[SECURITY]', logMessage, event.details);
  }

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    sendToMonitoringService(event);
  }
}

/**
 * Gets console log level based on severity
 */
function getLogLevel(
  severity: SecurityEventSeverity
): 'log' | 'warn' | 'error' {
  switch (severity) {
    case 'low':
      return 'log';
    case 'medium':
      return 'warn';
    case 'high':
    case 'critical':
      return 'error';
  }
}

/**
 * Formats security event for logging
 */
function formatSecurityEvent(event: SecurityEvent): string {
  const timestamp = new Date(event.timestamp).toISOString();
  return `[${timestamp}] ${event.type.toUpperCase()} (${event.severity}) - ${event.action}`;
}

/**
 * Sends security event to monitoring service
 * In production, this would integrate with services like:
 * - Sentry
 * - DataDog
 * - CloudWatch
 * - Splunk
 */
function sendToMonitoringService(_event: SecurityEvent): void {
  // Monitoring service integration placeholder.
  // Example: Sentry.captureMessage(formatSecurityEvent(_event), { level: _event.severity });
}

/**
 * Gets recent security events
 *
 * @param limit - Maximum number of events to return
 * @param type - Optional filter by event type
 * @returns Array of security events
 */
export function getSecurityEvents(
  limit = 100,
  type?: SecurityEventType
): SecurityEvent[] {
  let events = securityEventLog;

  if (type) {
    events = events.filter(event => event.type === type);
  }

  return events.slice(-limit);
}

/**
 * Gets security event statistics
 *
 * @returns Statistics about security events
 */
export function getSecurityEventStats(): {
  total: number;
  byType: Record<SecurityEventType, number>;
  bySeverity: Record<SecurityEventSeverity, number>;
  byAction: Record<SecurityEventAction, number>;
} {
  const stats = {
    total: securityEventLog.length,
    byType: {} as Record<SecurityEventType, number>,
    bySeverity: {} as Record<SecurityEventSeverity, number>,
    byAction: {} as Record<SecurityEventAction, number>,
  };

  for (const event of securityEventLog) {
    stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;
    stats.bySeverity[event.severity] =
      (stats.bySeverity[event.severity] || 0) + 1;
    stats.byAction[event.action] = (stats.byAction[event.action] || 0) + 1;
  }

  return stats;
}

/**
 * Clears security event log
 * Should only be used in tests
 */
export function clearSecurityEventLog(): void {
  securityEventLog.length = 0;
}

/**
 * Helper functions for logging specific security events
 */

export function logRateLimitEvent(details: {
  ip: string;
  endpoint: string;
  userAgent?: string;
}): void {
  logSecurityEvent({
    type: 'rate_limit',
    timestamp: Date.now(),
    severity: 'medium',
    action: 'rate_limited',
    details,
  });
}

export function logValidationError(details: {
  ip: string;
  endpoint: string;
  error: string;
  userAgent?: string;
}): void {
  logSecurityEvent({
    type: 'validation_error',
    timestamp: Date.now(),
    severity: 'low',
    action: 'blocked',
    details,
  });
}

export function logCsrfFailure(details: {
  ip: string;
  endpoint: string;
  method: string;
  userAgent?: string;
}): void {
  logSecurityEvent({
    type: 'csrf_failure',
    timestamp: Date.now(),
    severity: 'high',
    action: 'blocked',
    details,
  });
}

export function logOriginDenied(details: {
  ip: string;
  endpoint: string;
  userAgent?: string;
}): void {
  logSecurityEvent({
    type: 'origin_denied',
    timestamp: Date.now(),
    severity: 'high',
    action: 'blocked',
    details,
  });
}

export function logPayloadTooLarge(details: {
  ip: string;
  endpoint: string;
  userAgent?: string;
}): void {
  logSecurityEvent({
    type: 'payload_too_large',
    timestamp: Date.now(),
    severity: 'medium',
    action: 'blocked',
    details,
  });
}

export function logCspViolation(details: {
  blockedUri: string;
  endpoint: string;
  userAgent?: string;
}): void {
  logSecurityEvent({
    type: 'csp_violation',
    timestamp: Date.now(),
    severity: 'high',
    action: 'logged',
    details,
  });
}

export function logSuspiciousActivity(details: {
  ip: string;
  endpoint: string;
  error: string;
  userAgent?: string;
  payload?: unknown;
}): void {
  logSecurityEvent({
    type: 'suspicious_activity',
    timestamp: Date.now(),
    severity: 'critical',
    action: 'blocked',
    details,
  });
}
