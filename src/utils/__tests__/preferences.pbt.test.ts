import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// Create localStorage mock that works with the preferences module
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
    // Helper to get the store for testing
    _getStore: () => store,
    _clearStore: () => {
      store = {};
    },
  };
})();

// Replace global localStorage before importing preferences
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

import {
  loadAccessibilitySettings,
  saveAccessibilitySettings,
  loadProgressStats,
  saveProgressStats,
  updateGridProgress,
  loadChildMode,
  saveChildMode,
  loadGridConfig,
  saveGridConfig,
  loadDifficulty,
  saveDifficulty,
  loadUserPreferences,
  saveUserPreferences,
  clearAllPreferences,
  getStorageInfo,
} from '../preferences';
import type { AccessibilitySettings, ProgressStats } from '../../types';
import { GRID_CONFIGS } from '../gridConfig';

/**
 * Property 11: Preference persistence
 * Validates: Requirements 8.2, 8.4, 10.8
 *
 * User preferences should be reliably stored and retrieved from localStorage:
 * - Accessibility settings should persist across sessions
 * - Progress statistics should be maintained separately for each grid size
 * - Child mode preferences should be preserved
 * - Grid configuration choices should be remembered
 * - Difficulty settings should persist per grid size
 * - Data integrity should be maintained even with storage limitations
 */
describe('Property 11: Preference persistence', () => {
  beforeEach(() => {
    localStorageMock._clearStore();
  });

  afterEach(() => {
    localStorageMock._clearStore();
  });

  const accessibilityArbitrary: fc.Arbitrary<AccessibilitySettings> = fc.record(
    {
      highContrast: fc.boolean(),
      reducedMotion: fc.boolean(),
      screenReaderMode: fc.boolean(),
      largeText: fc.boolean(),
      audioFeedback: fc.boolean(),
      keyboardNavigation: fc.boolean(),
      voiceInput: fc.boolean(),
      adaptiveTouchTargets: fc.boolean(),
    }
  );

  const progressStatsArbitrary: fc.Arbitrary<ProgressStats> = fc.record({
    puzzlesCompleted: fc.nat(1000),
    totalTime: fc.nat(100000),
    averageTime: fc.nat(10000),
    bestTime: fc.nat(10000),
    hintsUsed: fc.nat(500),
    achievements: fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
      maxLength: 20,
    }),
    streakCount: fc.nat(100),
    longestStreak: fc.nat(100),
    perfectGames: fc.nat(100),
    lastPlayed: fc.option(
      fc
        .date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') })
        .filter(date => !Number.isNaN(date.getTime())),
      { nil: null }
    ),
    dailyStreak: fc.nat(365),
    weeklyGoalProgress: fc.nat(7),
    starsEarned: fc.nat(500),
    badgesEarned: fc.nat(500),
    stickersEarned: fc.nat(500),
    improvementRate: fc.nat(100),
    consistencyScore: fc.nat(100),
    difficultyProgression: fc.nat(100),
  });

  const gridConfigArbitrary = fc.constantFrom(...Object.values(GRID_CONFIGS));

  type SavedPreferences = {
    accessibility?: AccessibilitySettings;
    childMode?: boolean;
    difficulty?: number;
  };

  const isAccessibilitySettings = (
    data: unknown
  ): data is AccessibilitySettings =>
    typeof data === 'object' &&
    data !== null &&
    !Array.isArray(data) &&
    'highContrast' in data &&
    'reducedMotion' in data &&
    'screenReaderMode' in data &&
    'largeText' in data &&
    'audioFeedback' in data &&
    'keyboardNavigation' in data &&
    'voiceInput' in data &&
    'adaptiveTouchTargets' in data;

  const applyPreferenceOperation = (
    savedData: SavedPreferences,
    operation: string,
    data: unknown
  ) => {
    if (operation === 'accessibility' && isAccessibilitySettings(data)) {
      saveAccessibilitySettings(data);
      savedData.accessibility = data;
      return;
    }

    if (operation === 'childMode' && typeof data === 'boolean') {
      saveChildMode(data);
      savedData.childMode = data;
      return;
    }

    if (operation === 'difficulty' && typeof data === 'number') {
      saveDifficulty(data);
      savedData.difficulty = data;
    }
  };

  const assertSavedPreferences = (savedData: SavedPreferences) => {
    if (savedData.accessibility) {
      expect(loadAccessibilitySettings()).toEqual(savedData.accessibility);
    }
    if (savedData.childMode !== undefined) {
      expect(loadChildMode()).toBe(savedData.childMode);
    }
    if (savedData.difficulty !== undefined) {
      expect(loadDifficulty()).toBe(savedData.difficulty);
    }
  };

  it('should preserve accessibility settings across save/load cycles', () => {
    fc.assert(
      fc.property(accessibilityArbitrary, settings => {
        // Save settings
        saveAccessibilitySettings(settings);

        // Load settings
        const loaded = loadAccessibilitySettings();

        // Should match exactly
        expect(loaded).toEqual(settings);
      }),
      { numRuns: 100 }
    );
  });

  // Custom matcher for progress stats that handles date serialization
  const expectProgressStatsEqual = (
    actual: ProgressStats,
    expected: ProgressStats
  ) => {
    expect(actual.puzzlesCompleted).toBe(expected.puzzlesCompleted);
    expect(actual.totalTime).toBe(expected.totalTime);
    expect(actual.averageTime).toBe(expected.averageTime);
    expect(actual.bestTime).toBe(expected.bestTime);
    expect(actual.hintsUsed).toBe(expected.hintsUsed);
    expect(actual.achievements).toEqual(expected.achievements);
    expect(actual.streakCount).toBe(expected.streakCount);
    expect(actual.longestStreak).toBe(expected.longestStreak);
    expect(actual.perfectGames).toBe(expected.perfectGames);

    // Handle date serialization - localStorage converts dates to strings
    if (expected.lastPlayed === null) {
      expect(actual.lastPlayed).toBeNull();
    } else if (expected.lastPlayed instanceof Date) {
      // Skip invalid dates
      if (Number.isNaN(expected.lastPlayed.getTime())) {
        expect(actual.lastPlayed).toBeNull();
        return;
      }

      // When loaded from localStorage, dates become strings
      if (typeof actual.lastPlayed === 'string') {
        expect(new Date(actual.lastPlayed)).toEqual(expected.lastPlayed);
      } else {
        expect(actual.lastPlayed).toEqual(expected.lastPlayed);
      }
    }

    expect(actual.dailyStreak).toBe(expected.dailyStreak);
    expect(actual.weeklyGoalProgress).toBe(expected.weeklyGoalProgress);
    expect(actual.starsEarned).toBe(expected.starsEarned);
    expect(actual.badgesEarned).toBe(expected.badgesEarned);
    expect(actual.stickersEarned).toBe(expected.stickersEarned);
    expect(actual.improvementRate).toBe(expected.improvementRate);
    expect(actual.consistencyScore).toBe(expected.consistencyScore);
    expect(actual.difficultyProgression).toBe(expected.difficultyProgression);
  };

  it('should maintain progress statistics for all grid sizes independently', () => {
    fc.assert(
      fc.property(
        fc.record({
          '4x4': progressStatsArbitrary,
          '6x6': progressStatsArbitrary,
          '9x9': progressStatsArbitrary,
        }),
        progressData => {
          // Save progress data
          saveProgressStats(progressData);

          // Load progress data
          const loaded = loadProgressStats();

          // Should match exactly for all grid sizes
          expectProgressStatsEqual(loaded['4x4'], progressData['4x4']);
          expectProgressStatsEqual(loaded['6x6'], progressData['6x6']);
          expectProgressStatsEqual(loaded['9x9'], progressData['9x9']);

          // Verify all grid sizes are present
          expect(Object.keys(loaded)).toContain('4x4');
          expect(Object.keys(loaded)).toContain('6x6');
          expect(Object.keys(loaded)).toContain('9x9');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle individual grid progress updates correctly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('4x4', '6x6', '9x9'),
        progressStatsArbitrary,
        progressStatsArbitrary,
        (gridSize, initialStats, updateStats) => {
          // Set initial progress
          const initialProgress = {
            '4x4': { ...initialStats },
            '6x6': { ...initialStats },
            '9x9': { ...initialStats },
          };
          saveProgressStats(initialProgress);

          // Update specific grid progress
          updateGridProgress(gridSize, updateStats);

          // Load and verify
          const loaded = loadProgressStats();

          // Updated grid should have merged stats
          const expectedStats = { ...initialStats, ...updateStats };
          expectProgressStatsEqual(loaded[gridSize], expectedStats);

          // Other grids should remain unchanged
          const otherGrids = ['4x4', '6x6', '9x9'].filter(g => g !== gridSize);
          otherGrids.forEach(otherGrid => {
            expectProgressStatsEqual(loaded[otherGrid], initialStats);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve child mode preference across sessions', () => {
    fc.assert(
      fc.property(fc.boolean(), childMode => {
        // Save child mode
        saveChildMode(childMode);

        // Load child mode
        const loaded = loadChildMode();

        // Should match exactly
        expect(loaded).toBe(childMode);
      }),
      { numRuns: 50 }
    );
  });

  it('should preserve grid configuration choices', () => {
    fc.assert(
      fc.property(gridConfigArbitrary, gridConfig => {
        // Save grid config
        saveGridConfig(gridConfig);

        // Load grid config
        const loaded = loadGridConfig();

        // Should match exactly
        expect(loaded).toEqual(gridConfig);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve difficulty settings', () => {
    fc.assert(
      fc.property(fc.nat(20), difficulty => {
        // Save difficulty
        saveDifficulty(difficulty);

        // Load difficulty
        const loaded = loadDifficulty();

        // Should match exactly
        expect(loaded).toBe(difficulty);
      }),
      { numRuns: 50 }
    );
  });

  it('should handle complete user preference save/load cycles', () => {
    fc.assert(
      fc.property(
        accessibilityArbitrary,
        fc.record({
          '4x4': progressStatsArbitrary,
          '6x6': progressStatsArbitrary,
          '9x9': progressStatsArbitrary,
        }),
        fc.boolean(),
        gridConfigArbitrary,
        fc.nat(20),
        (accessibility, progress, childMode, gridConfig, difficulty) => {
          const preferences = {
            accessibility,
            progress,
            childMode,
            gridConfig,
            difficulty,
          };

          // Save all preferences
          saveUserPreferences(preferences);

          // Load all preferences
          const loaded = loadUserPreferences();

          // Should match exactly
          expect(loaded.accessibility).toEqual(accessibility);

          // Handle progress with custom matcher for date serialization
          if (loaded.progress) {
            expectProgressStatsEqual(loaded.progress['4x4'], progress['4x4']);
            expectProgressStatsEqual(loaded.progress['6x6'], progress['6x6']);
            expectProgressStatsEqual(loaded.progress['9x9'], progress['9x9']);
          }

          expect(loaded.childMode).toBe(childMode);
          expect(loaded.gridConfig).toEqual(gridConfig);
          expect(loaded.difficulty).toBe(difficulty);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle localStorage unavailability gracefully', () => {
    fc.assert(
      fc.property(accessibilityArbitrary, settings => {
        // Temporarily replace localStorage with a broken version
        const originalLocalStorage = globalThis.localStorage;
        const brokenStorage = {
          getItem: () => {
            throw new Error('Storage unavailable');
          },
          setItem: () => {
            throw new Error('Storage unavailable');
          },
          removeItem: () => {
            throw new Error('Storage unavailable');
          },
          clear: () => {
            throw new Error('Storage unavailable');
          },
          length: 0,
          key: () => null,
        };

        Object.defineProperty(globalThis, 'localStorage', {
          value: brokenStorage,
          writable: true,
          configurable: true,
        });

        try {
          // Should not throw when saving
          expect(() => saveAccessibilitySettings(settings)).not.toThrow();

          // Should return defaults when loading
          const loaded = loadAccessibilitySettings();
          expect(loaded).toBeDefined();
          expect(typeof loaded).toBe('object');
        } finally {
          // Restore original localStorage
          Object.defineProperty(globalThis, 'localStorage', {
            value: originalLocalStorage,
            writable: true,
            configurable: true,
          });
        }
      }),
      { numRuns: 50 }
    );
  });

  it('should handle corrupted localStorage data gracefully', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => {
          // Filter out strings that parse to valid accessibility settings
          try {
            const parsed = JSON.parse(s);
            // Only accept if it's NOT a valid accessibility settings object
            if (
              typeof parsed === 'object' &&
              parsed !== null &&
              'highContrast' in parsed &&
              'reducedMotion' in parsed &&
              'screenReaderMode' in parsed &&
              'largeText' in parsed &&
              'audioFeedback' in parsed &&
              'keyboardNavigation' in parsed &&
              'voiceInput' in parsed &&
              'adaptiveTouchTargets' in parsed
            ) {
              return false; // Filter out valid settings
            }
            return true; // Keep corrupted data
          } catch {
            return true; // Keep unparseable strings
          }
        }),
        corruptedData => {
          // Set corrupted data directly in the mock store
          const store = localStorageMock._getStore();
          store['sudoku-accessibility-settings'] = corruptedData;

          // Should return defaults for corrupted data
          const accessibility = loadAccessibilitySettings();
          const progress = loadProgressStats();
          const childMode = loadChildMode();
          const difficulty = loadDifficulty();

          // Should all be valid default values
          expect(accessibility).toBeDefined();
          expect(typeof accessibility).toBe('object');
          expect(progress).toBeDefined();
          expect(typeof progress).toBe('object');
          expect(typeof childMode).toBe('boolean');
          expect(typeof difficulty).toBe('number');
          expect(difficulty).toBeGreaterThanOrEqual(1);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should clear all preferences correctly', () => {
    fc.assert(
      fc.property(
        accessibilityArbitrary,
        fc.boolean(),
        gridConfigArbitrary,
        (accessibility, childMode, gridConfig) => {
          // Save some preferences
          saveAccessibilitySettings(accessibility);
          saveChildMode(childMode);
          saveGridConfig(gridConfig);

          // Verify they were saved
          expect(loadAccessibilitySettings()).toEqual(accessibility);
          expect(loadChildMode()).toBe(childMode);
          expect(loadGridConfig()).toEqual(gridConfig);

          // Verify store is not empty
          const storeBeforeClear = localStorageMock._getStore();
          expect(Object.keys(storeBeforeClear).length).toBeGreaterThan(0);

          // Clear all preferences
          clearAllPreferences();

          // Verify store is now empty
          const storeAfterClear = localStorageMock._getStore();
          expect(Object.keys(storeAfterClear)).toHaveLength(0);

          // Verify they were cleared (should return defaults)
          const defaultAccessibility = loadAccessibilitySettings();
          const defaultChildMode = loadChildMode();
          const defaultGridConfig = loadGridConfig();

          // Should return default values after clearing
          expect(defaultAccessibility).toEqual({
            highContrast: false,
            reducedMotion: false,
            screenReaderMode: false,
            largeText: false,
            audioFeedback: false,
            keyboardNavigation: false,
            voiceInput: false,
            adaptiveTouchTargets: false,
          });
          expect(defaultChildMode).toBe(false);
          expect(defaultGridConfig).toBeNull();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should provide accurate storage information', () => {
    fc.assert(
      fc.property(accessibilityArbitrary, settings => {
        // Get initial storage info
        const initialInfo = getStorageInfo();
        expect(initialInfo.available).toBe(true);

        // Save some data
        saveAccessibilitySettings(settings);

        // Get updated storage info
        const updatedInfo = getStorageInfo();
        expect(updatedInfo.available).toBe(true);
        expect(updatedInfo.usage).toBeDefined();
        expect(typeof updatedInfo.usage).toBe('number');
        expect(updatedInfo.usage).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 50 }
    );
  });

  it('should maintain data consistency across multiple operations', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            fc.record({
              operation: fc.constant('accessibility'),
              data: accessibilityArbitrary,
            }),
            fc.record({
              operation: fc.constant('childMode'),
              data: fc.boolean(),
            }),
            fc.record({
              operation: fc.constant('difficulty'),
              data: fc.nat(20).map(n => n + 1), // Generate 1-21 instead of 0-20
            })
          ),
          { minLength: 5, maxLength: 20 }
        ),
        operations => {
          const savedData: SavedPreferences = {};

          // Apply all operations in sequence
          operations.forEach(({ operation, data }) => {
            applyPreferenceOperation(savedData, operation, data);
          });

          // Verify that the final state matches what we expect
          assertSavedPreferences(savedData);
        }
      ),
      { numRuns: 50 }
    );
  });
});
