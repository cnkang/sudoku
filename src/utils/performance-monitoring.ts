/**
 * Performance Monitoring Utilities for React 19 and Modern Web Standards
 * Implements Core Web Vitals tracking and React 19 optimization monitoring
 */

import React from 'react';

declare const gtag:
  | ((event: string, action: string, params?: Record<string, unknown>) => void)
  | undefined;

// Core Web Vitals thresholds (Requirements 8.9)
export const PERFORMANCE_THRESHOLDS = {
  // Largest Contentful Paint (LCP) - should be < 2.5s
  LCP: {
    GOOD: 2500,
    NEEDS_IMPROVEMENT: 4000,
  },
  // First Input Delay (FID) - should be < 100ms
  FID: {
    GOOD: 100,
    NEEDS_IMPROVEMENT: 300,
  },
  // Cumulative Layout Shift (CLS) - should be < 0.1
  CLS: {
    GOOD: 0.1,
    NEEDS_IMPROVEMENT: 0.25,
  },
  // First Contentful Paint (FCP) - should be < 1.8s
  FCP: {
    GOOD: 1800,
    NEEDS_IMPROVEMENT: 3000,
  },
  // Time to Interactive (TTI) - should be < 3.8s
  TTI: {
    GOOD: 3800,
    NEEDS_IMPROVEMENT: 7300,
  },
} as const;

// Performance metric types
export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  userAgent: string;
}

export interface ReactOptimizationMetric {
  componentName: string;
  renderCount: number;
  renderTime: number;
  memoizationHits: number;
  memoizationMisses: number;
  isOptimized: boolean;
}

// Performance observer for Core Web Vitals
class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private reactMetrics: Map<string, ReactOptimizationMetric> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers(): void {
    // Only initialize in browser environment
    if (typeof window === 'undefined') return;

    try {
      // LCP Observer
      const lcpObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
          renderTime?: number;
          loadTime?: number;
        };

        if (lastEntry) {
          const value = lastEntry.renderTime || lastEntry.loadTime || 0;
          this.recordMetric('LCP', value);
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(lcpObserver);

      // FID Observer
      const fidObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          const fidEntry = entry as PerformanceEntry & {
            processingStart?: number;
          };
          if (fidEntry.processingStart) {
            const value = fidEntry.processingStart - entry.startTime;
            this.recordMetric('FID', value);
          }
        });
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
      this.observers.push(fidObserver);

      // CLS Observer
      let clsValue = 0;
      const clsObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          const clsEntry = entry as PerformanceEntry & {
            value?: number;
            hadRecentInput?: boolean;
          };
          if (clsEntry.value && !clsEntry.hadRecentInput) {
            clsValue += clsEntry.value;
            this.recordMetric('CLS', clsValue);
          }
        });
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(clsObserver);

      // FCP Observer
      const fcpObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric('FCP', entry.startTime);
          }
        });
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
      this.observers.push(fcpObserver);

      // Navigation timing for TTI approximation
      this.observeNavigationTiming();
    } catch (error) {
      void error;
    }
  }

  private observeNavigationTiming(): void {
    if (typeof window === 'undefined') return;

    // Use Navigation Timing API to calculate TTI approximation
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;
        if (navigation) {
          // TTI approximation: domContentLoadedEventEnd + some buffer for React hydration
          const tti = navigation.domContentLoadedEventEnd + 500; // 500ms buffer for React 19 hydration
          this.recordMetric('TTI', tti);
        }
      }, 0);
    });
  }

  private recordMetric(name: string, value: number): void {
    const rating = this.getRating(name, value);
    const metric: PerformanceMetric = {
      name,
      value,
      rating,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };

    this.metrics.set(name, metric);
    this.reportMetric(metric);
  }

  private getRating(
    name: string,
    value: number
  ): 'good' | 'needs-improvement' | 'poor' {
    const thresholds =
      PERFORMANCE_THRESHOLDS[name as keyof typeof PERFORMANCE_THRESHOLDS];
    if (!thresholds) return 'good';

    if (value <= thresholds.GOOD) return 'good';
    if (value <= thresholds.NEEDS_IMPROVEMENT) return 'needs-improvement';
    return 'poor';
  }

  private reportMetric(metric: PerformanceMetric): void {
    // Send to analytics service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Google Analytics 4
      if (typeof gtag !== 'undefined') {
        gtag('event', metric.name, {
          event_category: 'Web Vitals',
          value: Math.round(metric.value),
          custom_parameter_rating: metric.rating,
        });
      }
    }

    // Log in development
  }

  // React 19 optimization tracking
  public trackReactOptimization(
    componentName: string,
    renderTime: number,
    wasOptimized: boolean = false
  ): void {
    const existing = this.reactMetrics.get(componentName) || {
      componentName,
      renderCount: 0,
      renderTime: 0,
      memoizationHits: 0,
      memoizationMisses: 0,
      isOptimized: false,
    };

    existing.renderCount++;
    existing.renderTime += renderTime;
    existing.isOptimized = wasOptimized;

    if (wasOptimized) {
      existing.memoizationHits++;
    } else {
      existing.memoizationMisses++;
    }

    this.reactMetrics.set(componentName, existing);

    // Log React Compiler effectiveness
  }

  // Get current metrics
  public getMetrics(): Map<string, PerformanceMetric> {
    return new Map(this.metrics);
  }

  public getReactMetrics(): Map<string, ReactOptimizationMetric> {
    return new Map(this.reactMetrics);
  }

  // Check if performance meets requirements
  public meetsPerformanceRequirements(): boolean {
    const lcp = this.metrics.get('LCP');
    const fid = this.metrics.get('FID');
    const cls = this.metrics.get('CLS');

    return (
      (!lcp || lcp.rating !== 'poor') &&
      (!fid || fid.rating !== 'poor') &&
      (!cls || cls.rating !== 'poor')
    );
  }

  // Cleanup observers
  public disconnect(): void {
    for (const observer of this.observers) {
      observer.disconnect();
    }
    this.observers = [];
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export const getPerformanceMonitor = (): PerformanceMonitor => {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
};

// React 19 optimization hooks
export const usePerformanceTracking = (componentName: string) => {
  const monitor = getPerformanceMonitor();

  return {
    trackRender: (renderTime: number, wasOptimized: boolean = false) => {
      monitor.trackReactOptimization(componentName, renderTime, wasOptimized);
    },
    trackTransition: (_transitionTime: number) => {},
    getMetrics: () => monitor.getReactMetrics().get(componentName),
  };
};

// Lazy loading utilities for code splitting
export const createLazyComponent = <P extends object>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  fallback?: React.ComponentType
) => {
  const LazyComponent = React.lazy(importFn);

  return (props: P) => {
    const fallbackElement = fallback
      ? React.createElement(fallback)
      : React.createElement('div', {}, 'Loading...');

    return React.createElement(
      React.Suspense,
      { fallback: fallbackElement },
      React.createElement(LazyComponent, props)
    );
  };
};

// Performance-optimized component wrapper
export const withPerformanceTracking = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.memo((props: P) => {
    const startTime = performance.now();
    const { trackRender } = usePerformanceTracking(componentName);

    React.useEffect(() => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      // Assume React Compiler optimization if render time is below threshold
      const wasOptimized = renderTime < 16; // 60fps threshold
      trackRender(renderTime, wasOptimized);
    });

    return React.createElement(Component, props);
  });
};

// Bundle size monitoring
export const getBundleSize = async (): Promise<number> => {
  if (typeof window === 'undefined') return 0;

  try {
    const entries = performance.getEntriesByType(
      'navigation'
    ) as PerformanceNavigationTiming[];
    const entry = entries[0];
    if (entry) {
      return entry.transferSize || 0;
    }
  } catch (error) {
    void error;
  }

  return 0;
};

// Export for global access
declare global {
  interface Window {
    performanceMonitor: PerformanceMonitor;
  }
}

if (typeof window !== 'undefined') {
  window.performanceMonitor = getPerformanceMonitor();
}

export default getPerformanceMonitor;
