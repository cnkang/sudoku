import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AccessibilitySettings } from '../../types';
import { GRID_CONFIGS } from '../gridConfig';
import {
  clearAllPreferences,
  getStorageInfo,
  loadAccessibilitySettings,
  loadChildMode,
  loadDifficulty,
  loadGridConfig,
  loadProgressStats,
  loadUserPreferences,
  saveAccessibilitySettings,
  saveChildMode,
  saveDifficulty,
  saveGridConfig,
  saveProgressStats,
  saveUserPreferences,
  updateGridProgress,
} from '../preferences';

describe('preferences', () => {
  const createLocalStorageMock = () => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    };
  };

  let localStorageMock = createLocalStorageMock();

  beforeEach(() => {
    localStorageMock = createLocalStorageMock();
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('accessibility settings', () => {
    it('should save and load accessibility settings', () => {
      const settings: AccessibilitySettings = {
        highContrast: true,
        reducedMotion: false,
        screenReaderMode: true,
        largeText: false,
        audioFeedback: true,
        keyboardNavigation: false,
        voiceInput: false,
        adaptiveTouchTargets: false,
      };

      saveAccessibilitySettings(settings);
      const loaded = loadAccessibilitySettings();

      expect(loaded).toEqual(settings);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'sudoku-accessibility-settings',
        JSON.stringify(settings)
      );
    });

    it('should return default settings when none exist', () => {
      const loaded = loadAccessibilitySettings();

      expect(loaded).toEqual({
        highContrast: false,
        reducedMotion: false,
        screenReaderMode: false,
        largeText: false,
        audioFeedback: false,
        keyboardNavigation: false,
        voiceInput: false,
        adaptiveTouchTargets: false,
      });
    });
  });

  describe('progress statistics', () => {
    it('should save and load progress statistics', () => {
      const progress = {
        '4x4': {
          puzzlesCompleted: 5,
          totalTime: 300,
          averageTime: 60,
          bestTime: 45,
          hintsUsed: 2,
          achievements: ['first-solve'],
          streakCount: 3,
          longestStreak: 0,
          perfectGames: 0,
          lastPlayed: new Date('2024-01-01'),
          dailyStreak: 0,
          weeklyGoalProgress: 0,
          starsEarned: 0,
          badgesEarned: 0,
          stickersEarned: 0,
          improvementRate: 0,
          consistencyScore: 0,
          difficultyProgression: 0,
        },
        '6x6': {
          puzzlesCompleted: 0,
          totalTime: 0,
          averageTime: 0,
          bestTime: 0,
          hintsUsed: 0,
          achievements: [],
          streakCount: 0,
          longestStreak: 0,
          perfectGames: 0,
          lastPlayed: null,
          dailyStreak: 0,
          weeklyGoalProgress: 0,
          starsEarned: 0,
          badgesEarned: 0,
          stickersEarned: 0,
          improvementRate: 0,
          consistencyScore: 0,
          difficultyProgression: 0,
        },
        '9x9': {
          puzzlesCompleted: 10,
          totalTime: 1200,
          averageTime: 120,
          bestTime: 90,
          hintsUsed: 5,
          achievements: ['speed-demon'],
          streakCount: 7,
          longestStreak: 0,
          perfectGames: 0,
          lastPlayed: new Date('2024-01-02'),
          dailyStreak: 0,
          weeklyGoalProgress: 0,
          starsEarned: 0,
          badgesEarned: 0,
          stickersEarned: 0,
          improvementRate: 0,
          consistencyScore: 0,
          difficultyProgression: 0,
        },
      };

      saveProgressStats(progress);
      const loaded = loadProgressStats();

      expect(loaded).toEqual(progress);
    });

    it('should update individual grid progress', () => {
      const initialProgress = {
        '4x4': {
          puzzlesCompleted: 0,
          totalTime: 0,
          averageTime: 0,
          bestTime: 0,
          hintsUsed: 0,
          achievements: [],
          streakCount: 0,
          longestStreak: 0,
          perfectGames: 0,
          lastPlayed: null,
          dailyStreak: 0,
          weeklyGoalProgress: 0,
          starsEarned: 0,
          badgesEarned: 0,
          stickersEarned: 0,
          improvementRate: 0,
          consistencyScore: 0,
          difficultyProgression: 0,
        },
        '6x6': {
          puzzlesCompleted: 0,
          totalTime: 0,
          averageTime: 0,
          bestTime: 0,
          hintsUsed: 0,
          achievements: [],
          streakCount: 0,
          longestStreak: 0,
          perfectGames: 0,
          lastPlayed: null,
          dailyStreak: 0,
          weeklyGoalProgress: 0,
          starsEarned: 0,
          badgesEarned: 0,
          stickersEarned: 0,
          improvementRate: 0,
          consistencyScore: 0,
          difficultyProgression: 0,
        },
        '9x9': {
          puzzlesCompleted: 0,
          totalTime: 0,
          averageTime: 0,
          bestTime: 0,
          hintsUsed: 0,
          achievements: [],
          streakCount: 0,
          longestStreak: 0,
          perfectGames: 0,
          lastPlayed: null,
          dailyStreak: 0,
          weeklyGoalProgress: 0,
          starsEarned: 0,
          badgesEarned: 0,
          stickersEarned: 0,
          improvementRate: 0,
          consistencyScore: 0,
          difficultyProgression: 0,
        },
      };

      saveProgressStats(initialProgress);

      const update = {
        puzzlesCompleted: 1,
        totalTime: 120,
        averageTime: 120,
        bestTime: 120,
      };

      updateGridProgress('4x4', update);
      const loaded = loadProgressStats();

      expect(loaded['4x4']).toEqual({
        ...initialProgress['4x4'],
        ...update,
      });
      expect(loaded['6x6']).toEqual(initialProgress['6x6']);
      expect(loaded['9x9']).toEqual(initialProgress['9x9']);
    });

    it('should return default progress when none exists', () => {
      const loaded = loadProgressStats();

      expect(loaded).toHaveProperty('4x4');
      expect(loaded).toHaveProperty('6x6');
      expect(loaded).toHaveProperty('9x9');
      expect(loaded['4x4'].puzzlesCompleted).toBe(0);
      expect(loaded['6x6'].puzzlesCompleted).toBe(0);
      expect(loaded['9x9'].puzzlesCompleted).toBe(0);
    });
  });

  describe('child mode', () => {
    it('should save and load child mode preference', () => {
      saveChildMode(true);
      expect(loadChildMode()).toBe(true);

      saveChildMode(false);
      expect(loadChildMode()).toBe(false);
    });

    it('should return false by default', () => {
      expect(loadChildMode()).toBe(false);
    });
  });

  describe('grid configuration', () => {
    it('should save and load grid configuration', () => {
      const gridConfig = GRID_CONFIGS[6];

      saveGridConfig(gridConfig);
      const loaded = loadGridConfig();

      expect(loaded).toEqual(gridConfig);
    });

    it('should return null when no config exists', () => {
      expect(loadGridConfig()).toBeNull();
    });
  });

  describe('difficulty', () => {
    it('should save and load difficulty preference', () => {
      saveDifficulty(5);
      expect(loadDifficulty()).toBe(5);

      saveDifficulty(1);
      expect(loadDifficulty()).toBe(1);
    });

    it('should return 1 by default', () => {
      expect(loadDifficulty()).toBe(1);
    });
  });

  describe('complete user preferences', () => {
    it('should save and load all preferences together', () => {
      const preferences = {
        accessibility: {
          highContrast: true,
          reducedMotion: false,
          screenReaderMode: true,
          largeText: false,
          audioFeedback: true,
          keyboardNavigation: false,
          voiceInput: false,
          adaptiveTouchTargets: false,
        },
        progress: {
          '4x4': {
            puzzlesCompleted: 5,
            totalTime: 300,
            averageTime: 60,
            bestTime: 45,
            hintsUsed: 2,
            achievements: ['first-solve'],
            streakCount: 3,
            longestStreak: 0,
            perfectGames: 0,
            lastPlayed: new Date('2024-01-01'),
            dailyStreak: 0,
            weeklyGoalProgress: 0,
            starsEarned: 0,
            badgesEarned: 0,
            stickersEarned: 0,
            improvementRate: 0,
            consistencyScore: 0,
            difficultyProgression: 0,
          },
          '6x6': {
            puzzlesCompleted: 0,
            totalTime: 0,
            averageTime: 0,
            bestTime: 0,
            hintsUsed: 0,
            achievements: [],
            streakCount: 0,
            longestStreak: 0,
            perfectGames: 0,
            lastPlayed: null,
            dailyStreak: 0,
            weeklyGoalProgress: 0,
            starsEarned: 0,
            badgesEarned: 0,
            stickersEarned: 0,
            improvementRate: 0,
            consistencyScore: 0,
            difficultyProgression: 0,
          },
          '9x9': {
            puzzlesCompleted: 0,
            totalTime: 0,
            averageTime: 0,
            bestTime: 0,
            hintsUsed: 0,
            achievements: [],
            streakCount: 0,
            longestStreak: 0,
            perfectGames: 0,
            lastPlayed: null,
            dailyStreak: 0,
            weeklyGoalProgress: 0,
            starsEarned: 0,
            badgesEarned: 0,
            stickersEarned: 0,
            improvementRate: 0,
            consistencyScore: 0,
            difficultyProgression: 0,
          },
        },
        childMode: true,
        gridConfig: GRID_CONFIGS[4],
        difficulty: 3,
      };

      saveUserPreferences(preferences);
      const loaded = loadUserPreferences();

      expect(loaded.accessibility).toEqual(preferences.accessibility);
      expect(loaded.progress).toEqual(preferences.progress);
      expect(loaded.childMode).toBe(preferences.childMode);
      expect(loaded.gridConfig).toEqual(preferences.gridConfig);
      expect(loaded.difficulty).toBe(preferences.difficulty);
    });
  });

  describe('error handling', () => {
    it('should handle localStorage unavailability gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage unavailable');
      });
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage unavailable');
      });

      // Should not throw
      expect(() =>
        saveAccessibilitySettings({
          highContrast: true,
          reducedMotion: false,
          screenReaderMode: false,
          largeText: false,
          audioFeedback: false,
          keyboardNavigation: false,
          voiceInput: false,
          adaptiveTouchTargets: false,
        })
      ).not.toThrow();

      // Should return defaults
      const loaded = loadAccessibilitySettings();
      expect(loaded).toBeDefined();
      expect(typeof loaded).toBe('object');
    });

    it('should handle corrupted data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const loaded = loadAccessibilitySettings();
      expect(loaded).toEqual({
        highContrast: false,
        reducedMotion: false,
        screenReaderMode: false,
        largeText: false,
        audioFeedback: false,
        keyboardNavigation: false,
        voiceInput: false,
        adaptiveTouchTargets: false,
      });
    });
  });

  describe('utility functions', () => {
    it('should clear all preferences', () => {
      saveAccessibilitySettings({
        highContrast: true,
        reducedMotion: false,
        screenReaderMode: false,
        largeText: false,
        audioFeedback: false,
        keyboardNavigation: false,
        voiceInput: false,
        adaptiveTouchTargets: false,
      });
      saveChildMode(true);

      clearAllPreferences();

      const removedKeys = localStorageMock.removeItem.mock.calls.map(
        ([key]) => key
      );
      expect(removedKeys).toEqual(
        expect.arrayContaining([
          'sudoku-accessibility-settings',
          'sudoku-progress-stats',
          'sudoku-child-mode',
          'sudoku-grid-config',
          'sudoku-difficulty',
        ])
      );
    });

    it('should provide storage information', () => {
      const info = getStorageInfo();
      expect(info.available).toBe(true);
      expect(info.usage).toBeDefined();
      expect(typeof info.usage).toBe('number');
    });

    it('should handle storage info when localStorage unavailable', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage unavailable');
      });

      const info = getStorageInfo();
      expect(info.available).toBe(false);
      expect(info.usage).toBeUndefined();
    });
  });
});
