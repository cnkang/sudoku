'use client';

import { useEffect } from 'react';
import { type Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

type MonitoringEventPayload =
  | {
      kind: 'web-vital';
      name: Metric['name'] | 'FID';
      value: number;
      rating: Metric['rating'];
      id: string;
      delta: number;
      navigationType: Metric['navigationType'];
      timestamp: number;
      url: string;
      userAgent: string;
    }
  | {
      kind: 'client-error';
      message: string;
      source: 'error' | 'unhandledrejection';
      stack?: string;
      timestamp: number;
      url: string;
      userAgent: string;
    };

const MAX_MESSAGE_LENGTH = 400;
const MAX_STACK_LENGTH = 2000;
const MAX_DEDUPE_IDS = 400;

const isMonitoringEnabled = (): boolean => {
  if (process.env.NEXT_PUBLIC_DISABLE_MONITORING === 'true') {
    return false;
  }
  return true;
};

const truncate = (value: string, maxLength: number): string =>
  value.length > maxLength ? value.slice(0, maxLength) : value;

const postMonitoringEvent = (payload: MonitoringEventPayload): void => {
  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    navigator.sendBeacon('/api/monitoring', blob);
    return;
  }

  void fetch('/api/monitoring', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    credentials: 'same-origin',
    keepalive: true,
  });
};

const createMetricReporter = (reportedIds: Set<string>) => {
  return (metric: Metric) => {
    const dedupeKey = `${metric.name}:${metric.id}`;
    if (reportedIds.has(dedupeKey)) {
      return;
    }
    reportedIds.add(dedupeKey);

    if (reportedIds.size > MAX_DEDUPE_IDS) {
      const oldest = reportedIds.values().next().value;
      if (oldest) {
        reportedIds.delete(oldest);
      }
    }

    postMonitoringEvent({
      kind: 'web-vital',
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      delta: metric.delta,
      navigationType: metric.navigationType,
      timestamp: Date.now(),
      url: globalThis.location.href,
      userAgent: navigator.userAgent,
    });
  };
};

export default function MonitoringInit() {
  useEffect(() => {
    if (!isMonitoringEnabled()) {
      return;
    }

    const reportedMetricIds = new Set<string>();
    const reportMetric = createMetricReporter(reportedMetricIds);

    onCLS(reportMetric);
    onFCP(reportMetric);
    onLCP(reportMetric);
    onINP(reportMetric);
    onTTFB(reportMetric);

    const handleError = (event: ErrorEvent) => {
      const message = event.message?.trim();
      if (!message) {
        return;
      }

      postMonitoringEvent({
        kind: 'client-error',
        message: truncate(message, MAX_MESSAGE_LENGTH),
        source: 'error',
        ...(event.error?.stack
          ? { stack: truncate(event.error.stack, MAX_STACK_LENGTH) }
          : {}),
        timestamp: Date.now(),
        url: globalThis.location.href,
        userAgent: navigator.userAgent,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      let message = 'Unhandled promise rejection';
      let stack: string | undefined;

      if (event.reason instanceof Error) {
        message = event.reason.message || message;
        stack = event.reason.stack
          ? truncate(event.reason.stack, MAX_STACK_LENGTH)
          : undefined;
      } else if (typeof event.reason === 'string' && event.reason.trim()) {
        message = event.reason.trim();
      }

      postMonitoringEvent({
        kind: 'client-error',
        message: truncate(message, MAX_MESSAGE_LENGTH),
        source: 'unhandledrejection',
        ...(stack ? { stack } : {}),
        timestamp: Date.now(),
        url: globalThis.location.href,
        userAgent: navigator.userAgent,
      });
    };

    globalThis.addEventListener('error', handleError);
    globalThis.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      globalThis.removeEventListener('error', handleError);
      globalThis.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection
      );
      reportedMetricIds.clear();
    };
  }, []);

  return null;
}
