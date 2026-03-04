import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearMonitoringStore,
  getMonitoringDashboardSnapshot,
  getMonitoringBudgets,
  recordMonitoringClientError,
  recordMonitoringMetric,
} from '../monitoringStore';

describe('Monitoring Store', () => {
  beforeEach(() => {
    clearMonitoringStore();
  });

  it('aggregates web vital metrics with budget statistics', () => {
    const now = Date.now();

    recordMonitoringMetric({
      name: 'LCP',
      value: 1200,
      rating: 'good',
      id: 'lcp-a',
      timestamp: now - 10_000,
      url: 'https://example.com',
      userAgent: 'vitest',
    });
    recordMonitoringMetric({
      name: 'LCP',
      value: 2400,
      rating: 'good',
      id: 'lcp-b',
      timestamp: now - 8_000,
      url: 'https://example.com',
      userAgent: 'vitest',
    });
    recordMonitoringMetric({
      name: 'LCP',
      value: 2800,
      rating: 'needs-improvement',
      id: 'lcp-c',
      timestamp: now - 6_000,
      url: 'https://example.com',
      userAgent: 'vitest',
    });

    const snapshot = getMonitoringDashboardSnapshot(60_000);
    const lcpSummary = snapshot.metrics.find(metric => metric.name === 'LCP');

    expect(lcpSummary).toBeDefined();
    expect(lcpSummary?.count).toBe(3);
    expect(lcpSummary?.budget).toBe(getMonitoringBudgets().LCP);
    expect(lcpSummary?.p75).toBe(2800);
    expect(lcpSummary?.overBudgetCount).toBe(1);
  });

  it('creates alert when metric exceeds budget', () => {
    const result = recordMonitoringMetric({
      name: 'CLS',
      value: 0.24,
      rating: 'poor',
      id: 'cls-alert',
      timestamp: Date.now(),
      url: 'https://example.com',
      userAgent: 'vitest',
    });

    expect(result.alert).toBeDefined();
    expect(result.alert?.type).toBe('web-vital-budget');
    expect(result.alert?.metric).toBe('CLS');
  });

  it('creates error-rate alert after burst of client errors', () => {
    const now = Date.now();
    let latestAlertType: string | undefined;

    for (let index = 0; index < 20; index++) {
      const result = recordMonitoringClientError({
        message: `error-${index}`,
        source: 'error',
        timestamp: now - 1_000,
        url: 'https://example.com',
        userAgent: 'vitest',
      });
      if (result.alert) {
        latestAlertType = result.alert.type;
      }
    }

    const snapshot = getMonitoringDashboardSnapshot(60_000);

    expect(snapshot.errorCount).toBe(20);
    expect(latestAlertType).toBe('client-error-rate');
    expect(
      snapshot.recentAlerts.some(alert => alert.type === 'client-error-rate')
    ).toBe(true);
  });
});
