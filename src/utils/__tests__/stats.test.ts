import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateStats, getStats } from '../stats';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('Stats Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateStats', () => {
    it('should update stats for correct solution', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      updateStats(5, 300, true);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'sudoku-stats',
        expect.stringContaining('"gamesCompleted":1')
      );
    });

    it('should update stats for incorrect solution', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      updateStats(3, 180, false);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'sudoku-stats',
        expect.stringContaining('"gamesPlayed":1')
      );
    });
  });

  describe('getStats', () => {
    it('should return default stats when no data exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const stats = getStats();

      expect(stats.gamesPlayed).toBe(0);
      expect(stats.gamesCompleted).toBe(0);
    });

    it('should return stored stats', () => {
      const mockStats = {
        gamesPlayed: 5,
        gamesCompleted: 3,
        totalTime: 1500,
        bestTimes: { 5: 200 },
        averageTime: 300,
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockStats));

      const stats = getStats();

      expect(stats.gamesPlayed).toBe(5);
      expect(stats.gamesCompleted).toBe(3);
    });
  });
});
