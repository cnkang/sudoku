import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import type { GameAction } from '@/types';
import { useGameTimer } from '../useGameTimer';

describe('useGameTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-16T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('dispatches one tick for each elapsed second', () => {
    const dispatch = vi.fn<(action: GameAction) => void>();
    renderHook(() => useGameTimer(true, false, dispatch));

    act(() => {
      vi.advanceTimersByTime(2_000);
    });

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenNthCalledWith(1, { type: 'TICK', payload: 1 });
    expect(dispatch).toHaveBeenNthCalledWith(2, { type: 'TICK', payload: 1 });
  });

  it('does not tick while paused or inactive', () => {
    const dispatch = vi.fn<(action: GameAction) => void>();
    const { rerender } = renderHook(
      ({ active, paused }) => useGameTimer(active, paused, dispatch),
      { initialProps: { active: false, paused: false } },
    );

    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    rerender({ active: true, paused: true });
    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('catches up when the clock advances farther than the interval', () => {
    const dispatch = vi.fn<(action: GameAction) => void>();
    renderHook(() => useGameTimer(true, false, dispatch));

    vi.setSystemTime(new Date('2026-07-16T00:00:03Z'));
    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    // The interval fires once after 1s of timer time; Date.now() reports 4s total elapsed
    // (3s from setSystemTime + 1s from advanceTimersByTime), so one TICK with payload=4
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'TICK', payload: 4 });
  });

  it('clears its interval on unmount', () => {
    const dispatch = vi.fn<(action: GameAction) => void>();
    const { unmount } = renderHook(() => useGameTimer(true, false, dispatch));

    unmount();
    act(() => {
      vi.advanceTimersByTime(2_000);
    });

    expect(dispatch).not.toHaveBeenCalled();
  });
});
