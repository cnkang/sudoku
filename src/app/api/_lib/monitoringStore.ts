/**
 * In-memory monitoring store for Real User Monitoring (RUM) and client errors.
 *
 * Requirements:
 * - 15.1 Track Core Web Vitals in production
 * - 15.8 Report performance metrics to analytics endpoint
 * - 18.5 Log errors to monitoring service for debugging
 */

export type MonitoringMetricName =
  | 'CLS'
  | 'FCP'
  | 'LCP'
  | 'TTFB'
  | 'INP'
  | 'FID';
export type MonitoringMetricRating = 'good' | 'needs-improvement' | 'poor';
export type MonitoringAlertLevel = 'warning' | 'critical';

export interface MonitoringMetricEvent {
  name: MonitoringMetricName;
  value: number;
  rating: MonitoringMetricRating;
  id: string;
  delta?: number;
  navigationType?: string;
  timestamp: number;
  url: string;
  userAgent: string;
}

export interface MonitoringClientErrorEvent {
  message: string;
  source: 'error' | 'unhandledrejection';
  timestamp: number;
  url: string;
  userAgent: string;
  stack?: string;
}

export interface MonitoringAlert {
  type: 'web-vital-budget' | 'client-error-rate';
  level: MonitoringAlertLevel;
  metric?: MonitoringMetricName;
  value: number;
  threshold: number;
  timestamp: number;
  message: string;
}

export interface MonitoringMetricSummary {
  name: MonitoringMetricName;
  count: number;
  average: number;
  p75: number;
  max: number;
  budget: number;
  overBudgetCount: number;
  overBudgetRate: number;
}

export interface MonitoringDashboardSnapshot {
  generatedAt: string;
  windowMs: number;
  metricCount: number;
  errorCount: number;
  alertCount: number;
  budgets: Readonly<Record<MonitoringMetricName, number>>;
  metrics: MonitoringMetricSummary[];
  recentErrors: MonitoringClientErrorEvent[];
  recentAlerts: MonitoringAlert[];
}

const MAX_METRIC_EVENTS = 5000;
const MAX_ERROR_EVENTS = 2000;
const MAX_ALERT_EVENTS = 1000;

const MAX_ERROR_MESSAGE_LENGTH = 400;
const MAX_ERROR_STACK_LENGTH = 2000;
const MAX_URL_LENGTH = 500;
const MAX_USER_AGENT_LENGTH = 500;
const MAX_NAVIGATION_TYPE_LENGTH = 64;

const ERROR_ALERT_THRESHOLD = 20;
const ERROR_ALERT_WINDOW_MS = 5 * 60 * 1000;
const ERROR_ALERT_MIN_INTERVAL_MS = 60 * 1000;

const DEFAULT_DASHBOARD_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_RECENT_ITEMS = 20;

const MONITORING_BUDGETS: Readonly<Record<MonitoringMetricName, number>> = {
  LCP: 2500,
  FID: 100,
  CLS: 0.1,
  FCP: 1800,
  TTFB: 800,
  INP: 200,
} as const;

const metricEvents: MonitoringMetricEvent[] = [];
const clientErrorEvents: MonitoringClientErrorEvent[] = [];
const alerts: MonitoringAlert[] = [];

let lastErrorRateAlertTimestamp = 0;

function toFiniteNumber(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value;
}

function clampString(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength);
}

function pushBounded<T>(target: T[], value: T, maxSize: number): void {
  target.push(value);
  if (target.length > maxSize) {
    target.shift();
  }
}

function percentile(values: number[], percentileValue: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentileValue / 100) * sorted.length) - 1;
  const boundedIndex = Math.max(0, Math.min(sorted.length - 1, index));
  return sorted[boundedIndex] ?? 0;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, value) => acc + value, 0);
  return sum / values.length;
}

function shouldEscalateMetricAlert(
  metricName: MonitoringMetricName,
  value: number
): MonitoringAlertLevel {
  const budget = MONITORING_BUDGETS[metricName];
  if (value >= budget * 1.2) {
    return 'critical';
  }
  return 'warning';
}

function maybeRecordErrorRateAlert(now: number): MonitoringAlert | null {
  if (now - lastErrorRateAlertTimestamp < ERROR_ALERT_MIN_INTERVAL_MS) {
    return null;
  }

  const recentErrorCount = clientErrorEvents.filter(
    event => event.timestamp >= now - ERROR_ALERT_WINDOW_MS
  ).length;

  if (recentErrorCount < ERROR_ALERT_THRESHOLD) {
    return null;
  }

  lastErrorRateAlertTimestamp = now;

  const alert: MonitoringAlert = {
    type: 'client-error-rate',
    level:
      recentErrorCount >= ERROR_ALERT_THRESHOLD * 2 ? 'critical' : 'warning',
    value: recentErrorCount,
    threshold: ERROR_ALERT_THRESHOLD,
    timestamp: now,
    message: `Client error rate exceeded threshold (${recentErrorCount}/${ERROR_ALERT_THRESHOLD} in 5m).`,
  };

  pushBounded(alerts, alert, MAX_ALERT_EVENTS);
  return alert;
}

export function getMonitoringBudgets(): Readonly<
  Record<MonitoringMetricName, number>
> {
  return MONITORING_BUDGETS;
}

export function recordMonitoringMetric(
  event: Omit<MonitoringMetricEvent, 'timestamp'> & { timestamp?: number }
): { event: MonitoringMetricEvent; alert?: MonitoringAlert } {
  const timestamp = event.timestamp ?? Date.now();

  const normalized: MonitoringMetricEvent = {
    name: event.name,
    value: toFiniteNumber(event.value),
    rating: event.rating,
    id: clampString(event.id, 128),
    timestamp,
    url: clampString(event.url, MAX_URL_LENGTH),
    userAgent: clampString(event.userAgent, MAX_USER_AGENT_LENGTH),
    ...(event.delta !== undefined
      ? { delta: toFiniteNumber(event.delta) }
      : {}),
    ...(event.navigationType
      ? {
          navigationType: clampString(
            event.navigationType,
            MAX_NAVIGATION_TYPE_LENGTH
          ),
        }
      : {}),
  };

  pushBounded(metricEvents, normalized, MAX_METRIC_EVENTS);

  const budget = MONITORING_BUDGETS[normalized.name];
  if (normalized.value <= budget) {
    return { event: normalized };
  }

  const alert: MonitoringAlert = {
    type: 'web-vital-budget',
    level: shouldEscalateMetricAlert(normalized.name, normalized.value),
    metric: normalized.name,
    value: normalized.value,
    threshold: budget,
    timestamp,
    message: `${normalized.name} exceeded budget (${normalized.value.toFixed(
      normalized.name === 'CLS' ? 3 : 1
    )} > ${budget}).`,
  };

  pushBounded(alerts, alert, MAX_ALERT_EVENTS);
  return { event: normalized, alert };
}

export function recordMonitoringClientError(
  event: Omit<MonitoringClientErrorEvent, 'timestamp'> & { timestamp?: number }
): { event: MonitoringClientErrorEvent; alert?: MonitoringAlert } {
  const timestamp = event.timestamp ?? Date.now();
  const normalized: MonitoringClientErrorEvent = {
    message: clampString(event.message, MAX_ERROR_MESSAGE_LENGTH),
    source: event.source,
    timestamp,
    url: clampString(event.url, MAX_URL_LENGTH),
    userAgent: clampString(event.userAgent, MAX_USER_AGENT_LENGTH),
    ...(event.stack
      ? { stack: clampString(event.stack, MAX_ERROR_STACK_LENGTH) }
      : {}),
  };

  pushBounded(clientErrorEvents, normalized, MAX_ERROR_EVENTS);

  const alert = maybeRecordErrorRateAlert(timestamp) ?? undefined;
  return { event: normalized, ...(alert ? { alert } : {}) };
}

export function getMonitoringDashboardSnapshot(
  windowMs = DEFAULT_DASHBOARD_WINDOW_MS
): MonitoringDashboardSnapshot {
  const now = Date.now();
  const effectiveWindowMs =
    Number.isFinite(windowMs) && windowMs > 0
      ? Math.floor(windowMs)
      : DEFAULT_DASHBOARD_WINDOW_MS;

  const windowStart = now - effectiveWindowMs;

  const metricsInWindow = metricEvents.filter(
    event => event.timestamp >= windowStart
  );
  const errorsInWindow = clientErrorEvents.filter(
    event => event.timestamp >= windowStart
  );
  const alertsInWindow = alerts.filter(event => event.timestamp >= windowStart);

  const summaries = (Object.keys(MONITORING_BUDGETS) as MonitoringMetricName[])
    .map(metricName => {
      const metricValues = metricsInWindow
        .filter(event => event.name === metricName)
        .map(event => event.value);

      const budget = MONITORING_BUDGETS[metricName];
      const overBudgetCount = metricValues.filter(
        value => value > budget
      ).length;

      return {
        name: metricName,
        count: metricValues.length,
        average: average(metricValues),
        p75: percentile(metricValues, 75),
        max: metricValues.length > 0 ? Math.max(...metricValues) : 0,
        budget,
        overBudgetCount,
        overBudgetRate:
          metricValues.length > 0 ? overBudgetCount / metricValues.length : 0,
      } satisfies MonitoringMetricSummary;
    })
    .filter(summary => summary.count > 0);

  return {
    generatedAt: new Date(now).toISOString(),
    windowMs: effectiveWindowMs,
    metricCount: metricsInWindow.length,
    errorCount: errorsInWindow.length,
    alertCount: alertsInWindow.length,
    budgets: MONITORING_BUDGETS,
    metrics: summaries,
    recentErrors: errorsInWindow.slice(-MAX_RECENT_ITEMS),
    recentAlerts: alertsInWindow.slice(-MAX_RECENT_ITEMS),
  };
}

export function clearMonitoringStore(): void {
  metricEvents.length = 0;
  clientErrorEvents.length = 0;
  alerts.length = 0;
  lastErrorRateAlertTimestamp = 0;
}
