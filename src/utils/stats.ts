export interface GameStats {
  gamesPlayed: number;
  gamesCompleted: number;
  bestTimes: Record<number, number>; // difficulty -> best time
  totalTime: number;
  averageTime: number;
}

const STATS_KEY = 'sudoku-stats';

export const getStats = (): GameStats => {
  try {
    const saved = localStorage.getItem(STATS_KEY);
    if (!saved) return getDefaultStats();
    return JSON.parse(saved);
  } catch {
    return getDefaultStats();
  }
};

export const updateStats = (
  difficulty: number,
  time: number,
  completed: boolean
): void => {
  try {
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
  } catch {
    // console.warn('Failed to update stats:', error);
  }
};

const getDefaultStats = (): GameStats => ({
  gamesPlayed: 0,
  gamesCompleted: 0,
  bestTimes: {},
  totalTime: 0,
  averageTime: 0,
});
