/**
 * Optimized Touch Event Handlers Hook
 * Provides throttled touch handlers for 60fps performance
 *
 * Requirements: 8.2, 8.3, 8.5
 * - Uses passive: true for touch events (handled by React synthetic events)
 * - Throttles touchmove handlers to maintain 60fps
 * - Does not block scrolling with non-passive touch listeners
 */

import { useCallback, useRef } from 'react';

export interface ThrottledTouchOptions {
  /**
   * Throttle interval in milliseconds
   * Default: 16ms (60fps = 1000ms / 60 ≈ 16.67ms)
   */
  throttleMs?: number;

  /**
   * Whether to call the handler on the leading edge
   * Default: true
   */
  leading?: boolean;

  /**
   * Whether to call the handler on the trailing edge
   * Default: false
   */
  trailing?: boolean;
}

/**
 * Hook for creating a throttled touch move handler
 * Ensures touch events run at 60fps for smooth performance
 *
 * @param handler - The touch event handler to throttle
 * @param options - Throttling options
 * @returns Throttled touch event handler
 */
export function useThrottledTouchMove<T extends HTMLElement>(
  handler: (event: React.TouchEvent<T>) => void,
  options: ThrottledTouchOptions = {}
): (event: React.TouchEvent<T>) => void {
  const {
    throttleMs = 16, // 60fps
    leading = true,
    trailing = false,
  } = options;

  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastArgsRef = useRef<React.TouchEvent<T> | null>(null);

  return useCallback(
    (event: React.TouchEvent<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;

      // Store the latest event for trailing call
      lastArgsRef.current = event;

      // Clear any pending trailing call
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Leading edge call
      if (leading && timeSinceLastCall >= throttleMs) {
        lastCallRef.current = now;
        handler(event);
        return;
      }

      // Schedule trailing edge call
      if (trailing) {
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          if (lastArgsRef.current) {
            handler(lastArgsRef.current);
          }
          timeoutRef.current = null;
        }, throttleMs - timeSinceLastCall);
      }
    },
    [handler, throttleMs, leading, trailing]
  );
}

/**
 * Hook for creating optimized touch handlers with proper event options
 * Provides start, move, and end handlers with performance optimizations
 *
 * Note: React synthetic events automatically use passive: true for touch events
 * when preventDefault() is not called, which is the recommended approach.
 */
export function useOptimizedTouchHandlers<T extends HTMLElement>(handlers: {
  onTouchStart?: (event: React.TouchEvent<T>) => void;
  onTouchMove?: (event: React.TouchEvent<T>) => void;
  onTouchEnd?: (event: React.TouchEvent<T>) => void;
  throttleMs?: number;
}) {
  const { onTouchStart, onTouchMove, onTouchEnd, throttleMs = 16 } = handlers;

  // Throttle the move handler for 60fps performance
  const throttledMove = useThrottledTouchMove(onTouchMove || (() => {}), {
    throttleMs,
  });

  return {
    onTouchStart,
    onTouchMove: onTouchMove ? throttledMove : undefined,
    onTouchEnd,
  };
}

/**
 * Performance monitoring for touch events
 * Tracks frame rate and reports performance issues
 */
export function useTouchPerformanceMonitor() {
  const frameTimesRef = useRef<number[]>([]);
  const lastFrameRef = useRef<number>(0);

  const recordFrame = useCallback(() => {
    const now = performance.now();
    if (lastFrameRef.current > 0) {
      const frameTime = now - lastFrameRef.current;
      frameTimesRef.current.push(frameTime);

      // Keep only last 60 frames (1 second at 60fps)
      if (frameTimesRef.current.length > 60) {
        frameTimesRef.current.shift();
      }
    }
    lastFrameRef.current = now;
  }, []);

  const getAverageFPS = useCallback(() => {
    if (frameTimesRef.current.length === 0) return 60;

    const avgFrameTime =
      frameTimesRef.current.reduce((sum, time) => sum + time, 0) /
      frameTimesRef.current.length;

    return Math.round(1000 / avgFrameTime);
  }, []);

  const isPerformanceGood = useCallback(() => {
    return getAverageFPS() >= 55; // Allow 5fps tolerance
  }, [getAverageFPS]);

  return {
    recordFrame,
    getAverageFPS,
    isPerformanceGood,
  };
}
