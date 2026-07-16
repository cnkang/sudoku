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

      for (let index = 0; index < elapsed; index++) {
        dispatch({ type: 'TICK' });
      }

      if (elapsed >= 1) {
        lastTick = now;
      }
    }, 1_000);

    return () => clearInterval(timer);
  }, [timerActive, isPaused, dispatch]);
}
