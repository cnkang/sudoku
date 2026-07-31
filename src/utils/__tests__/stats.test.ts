import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { getStats, updateStats } from '../stats';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(globalThis, 'localStorage', {
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
        expect.stringContaining('"gamesCompleted":1'),
      );
    });

    it('should update stats for incorrect solution', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      updateStats(3, 180, false);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'sudoku-stats',
        expect.stringContaining('"gamesPlayed":1'),
      );
    });

    it('should update best time when new time is better', () => {
      const existingStats = {
        gamesPlayed: 2,
        gamesCompleted: 1,
        totalTime: 500,
        bestTimes: { 5: 400 },
        averageTime: 250,
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingStats));

      updateStats(5, 300, true);

      const savedData = mockLocalStorage.setItem.mock.calls[0][1];
      const parsedStats = JSON.parse(savedData);
      expect(parsedStats.bestTimes[5]).toBe(300);
    });

    it('should not update best time when new time is worse', () => {
      const existingStats = {
        gamesPlayed: 2,
        gamesCompleted: 1,
        totalTime: 500,
        bestTimes: { 5: 200 },
        averageTime: 250,
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingStats));

      updateStats(5, 300, true);

      const savedData = mockLocalStorage.setItem.mock.calls[0][1];
      const parsedStats = JSON.parse(savedData);
      expect(parsedStats.bestTimes[5]).toBe(200);
    });

    it('should set best time for new difficulty level', () => {
      const existingStats = {
        gamesPlayed: 1,
        gamesCompleted: 1,
        totalTime: 300,
        bestTimes: {},
        averageTime: 300,
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingStats));

      updateStats(7, 250, true);

      const savedData = mockLocalStorage.setItem.mock.calls[0][1];
      const parsedStats = JSON.parse(savedData);
      expect(parsedStats.bestTimes[7]).toBe(250);
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

    it('should fall back to defaults when localStorage throws', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('storage unavailable');
      });

      const stats = getStats();

      expect(stats).toEqual({
        gamesPlayed: 0,
        gamesCompleted: 0,
        bestTimes: {},
        totalTime: 0,
        averageTime: 0,
      });
    });
  });

  describe('error resilience', () => {
    it('should not throw when persisting stats fails', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('quota exceeded');
      });

      expect(() => updateStats(2, 120, true)).not.toThrow();
    });
  });

  describe('updateStats additional branches', () => {
    it('should not update bestTimes when completed is false', () => {
      const existingStats = {
        gamesPlayed: 1,
        gamesCompleted: 0,
        totalTime: 300,
        bestTimes: {},
        averageTime: 300,
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingStats));

      updateStats(5, 200, false);

      const savedData = mockLocalStorage.setItem.mock.calls[0][1];
      const parsedStats = JSON.parse(savedData);
      // bestTimes should remain empty since completed is false
      expect(parsedStats.bestTimes).toEqual({});
      expect(parsedStats.gamesCompleted).toBe(0);
    });

    it('should set best time when no existing best time for difficulty', () => {
      const existingStats = {
        gamesPlayed: 1,
        gamesCompleted: 1,
        totalTime: 300,
        bestTimes: {}, // No best time for difficulty 3
        averageTime: 300,
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingStats));

      updateStats(3, 250, true);

      const savedData = mockLocalStorage.setItem.mock.calls[0][1];
      const parsedStats = JSON.parse(savedData);
      expect(parsedStats.bestTimes[3]).toBe(250);
    });

    it('should correctly calculate average time across multiple games', () => {
      const existingStats = {
        gamesPlayed: 2,
        gamesCompleted: 1,
        totalTime: 600,
        bestTimes: {},
        averageTime: 300,
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingStats));

      updateStats(5, 300, false);

      const savedData = mockLocalStorage.setItem.mock.calls[0][1];
      const parsedStats = JSON.parse(savedData);
      expect(parsedStats.gamesPlayed).toBe(3);
      expect(parsedStats.totalTime).toBe(900);
      expect(parsedStats.averageTime).toBe(300);
    });
  });

  describe('getStats additional branches', () => {
    it('should return defaults when localStorage returns invalid JSON', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const stats = getStats();

      expect(stats).toEqual({
        gamesPlayed: 0,
        gamesCompleted: 0,
        bestTimes: {},
        totalTime: 0,
        averageTime: 0,
      });
    });
  });
});
