import { useEffect } from 'react';
import type { Dispatch } from 'react';
import type { GameAction } from '@/types';

export function useGameTimer(
  timerActive: boolean,
  isPaused: boolean,
  dispatch: Dispatch<GameAction>,
): void {
  useEffect(() => {
    if (!timerActive || isPaused) return undefined;

    let lastTick = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.round((now - lastTick) / 1_000);

      if (elapsed >= 1) {
        dispatch({ type: 'TICK', payload: elapsed });
        lastTick = now;
      }
    }, 1_000);

    return () => clearInterval(timer);
  }, [timerActive, isPaused, dispatch]);
}
