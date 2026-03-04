/**
 * Tests for Optimized Touch Event Handlers
 * Validates throttling behavior and performance optimizations
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useOptimizedTouchHandlers,
  useThrottledTouchMove,
  useTouchPerformanceMonitor,
} from '../useOptimizedTouchHandlers';

describe('useThrottledTouchMove', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should throttle touch move events to maintain 60fps', () => {
    const handler = vi.fn();
    const { result } = renderHook(() =>
      useThrottledTouchMove(handler, { throttleMs: 16 })
    );

    const mockEvent = {
      touches: [{ clientX: 100, clientY: 100 }],
    } as React.TouchEvent<HTMLDivElement>;

    // Call handler multiple times rapidly
    act(() => {
      result.current(mockEvent);
      result.current(mockEvent);
      result.current(mockEvent);
    });

    // Should only call once due to throttling
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should call handler after throttle interval expires', () => {
    const handler = vi.fn();
    const { result } = renderHook(() =>
      useThrottledTouchMove(handler, { throttleMs: 16 })
    );

    const mockEvent = {
      touches: [{ clientX: 100, clientY: 100 }],
    } as React.TouchEvent<HTMLDivElement>;

    act(() => {
      result.current(mockEvent);
    });

    expect(handler).toHaveBeenCalledTimes(1);

    // Advance time past throttle interval
    act(() => {
      vi.advanceTimersByTime(20);
    });

    // Call again after interval
    act(() => {
      result.current(mockEvent);
    });

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('should support leading edge calls', () => {
    const handler = vi.fn();
    const { result } = renderHook(() =>
      useThrottledTouchMove(handler, { throttleMs: 16, leading: true })
    );

    const mockEvent = {
      touches: [{ clientX: 100, clientY: 100 }],
    } as React.TouchEvent<HTMLDivElement>;

    act(() => {
      result.current(mockEvent);
    });

    // Should call immediately on leading edge
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should support trailing edge calls', () => {
    const handler = vi.fn();
    const { result } = renderHook(() =>
      useThrottledTouchMove(handler, {
        throttleMs: 16,
        leading: false,
        trailing: true,
      })
    );

    const mockEvent = {
      touches: [{ clientX: 100, clientY: 100 }],
    } as React.TouchEvent<HTMLDivElement>;

    act(() => {
      result.current(mockEvent);
    });

    // Should not call immediately
    expect(handler).toHaveBeenCalledTimes(0);

    // Advance time to trigger trailing call
    act(() => {
      vi.advanceTimersByTime(20);
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle rapid successive calls correctly', () => {
    const handler = vi.fn();
    const { result } = renderHook(() =>
      useThrottledTouchMove(handler, { throttleMs: 16 })
    );

    const mockEvent = {
      touches: [{ clientX: 100, clientY: 100 }],
    } as React.TouchEvent<HTMLDivElement>;

    // Simulate rapid touch move events (like user dragging)
    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current(mockEvent);
      }
    });

    // Should only call once due to throttling
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('useOptimizedTouchHandlers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return optimized touch handlers', () => {
    const onTouchStart = vi.fn();
    const onTouchMove = vi.fn();
    const onTouchEnd = vi.fn();

    const { result } = renderHook(() =>
      useOptimizedTouchHandlers({
        onTouchStart,
        onTouchMove,
        onTouchEnd,
      })
    );

    expect(result.current.onTouchStart).toBe(onTouchStart);
    expect(result.current.onTouchMove).toBeDefined();
    expect(result.current.onTouchEnd).toBe(onTouchEnd);
  });

  it('should throttle move handler', () => {
    const onTouchMove = vi.fn();

    const { result } = renderHook(() =>
      useOptimizedTouchHandlers({
        onTouchMove,
        throttleMs: 16,
      })
    );

    const mockEvent = {
      touches: [{ clientX: 100, clientY: 100 }],
    } as React.TouchEvent<HTMLDivElement>;

    act(() => {
      result.current.onTouchMove?.(mockEvent);
      result.current.onTouchMove?.(mockEvent);
      result.current.onTouchMove?.(mockEvent);
    });

    // Should only call once due to throttling
    expect(onTouchMove).toHaveBeenCalledTimes(1);
  });

  it('should handle undefined move handler', () => {
    const { result } = renderHook(() =>
      useOptimizedTouchHandlers({
        onTouchStart: vi.fn(),
      })
    );

    expect(result.current.onTouchMove).toBeUndefined();
  });
});

describe('useTouchPerformanceMonitor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock performance.now()
    let time = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => {
      time += 16.67; // Simulate 60fps
      return time;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should track frame times', () => {
    const { result } = renderHook(() => useTouchPerformanceMonitor());

    act(() => {
      result.current.recordFrame();
      result.current.recordFrame();
      result.current.recordFrame();
    });

    const fps = result.current.getAverageFPS();
    expect(fps).toBeGreaterThan(0);
  });

  it('should calculate average FPS correctly', () => {
    const { result } = renderHook(() => useTouchPerformanceMonitor());

    // Record multiple frames
    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.recordFrame();
      }
    });

    const fps = result.current.getAverageFPS();
    // Should be close to 60fps (allowing some tolerance)
    expect(fps).toBeGreaterThanOrEqual(55);
    expect(fps).toBeLessThanOrEqual(65);
  });

  it('should detect good performance', () => {
    const { result } = renderHook(() => useTouchPerformanceMonitor());

    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.recordFrame();
      }
    });

    expect(result.current.isPerformanceGood()).toBe(true);
  });

  it('should keep only last 60 frames', () => {
    const { result } = renderHook(() => useTouchPerformanceMonitor());

    // Record more than 60 frames
    act(() => {
      for (let i = 0; i < 100; i++) {
        result.current.recordFrame();
      }
    });

    // Should still calculate FPS correctly
    const fps = result.current.getAverageFPS();
    expect(fps).toBeGreaterThan(0);
  });

  it('should return 60fps when no frames recorded', () => {
    const { result } = renderHook(() => useTouchPerformanceMonitor());

    const fps = result.current.getAverageFPS();
    expect(fps).toBe(60);
  });
});
