export interface GameStats {
  gamesPlayed: number;
  gamesCompleted: number;
  bestTimes: Record<number, number>; // difficulty -> best time
  totalTime: number;
  averageTime: number;
}

const STATS_KEY = 'sudoku-stats';

import { safeSync } from './error-handling';

export const getStats = (): GameStats => {
  return (
    safeSync(() => {
      const saved = localStorage.getItem(STATS_KEY);
      if (!saved) return getDefaultStats();
      return JSON.parse(saved);
    }, getDefaultStats()) || getDefaultStats()
  );
};

export const updateStats = (
  difficulty: number,
  time: number,
  completed: boolean
): void => {
  safeSync(() => {
    const stats = getStats();
    stats.gamesPlayed++;
    stats.totalTime += time;

    if (completed) {
      stats.gamesCompleted++;
      if (!stats.bestTimes[difficulty] || time < stats.bestTimes[difficulty]) {
        stats.bestTimes[difficulty] = time;
      }
    }

    stats.averageTime = stats.totalTime / stats.gamesPlayed;
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  });
};

const getDefaultStats = (): GameStats => ({
  gamesPlayed: 0,
  gamesCompleted: 0,
  bestTimes: {},
  totalTime: 0,
  averageTime: 0,
});
