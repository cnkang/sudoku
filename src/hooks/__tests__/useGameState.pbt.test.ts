import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as fc from 'fast-check';
import { useGameState } from '../useGameState';
import { GRID_CONFIGS } from '../../utils/gridConfig';
import type { AccessibilitySettings, ProgressStats } from '../../types';

/**
 * Property 10: State persistence across grid changes
 * Validates: Requirements 8.1
 *
 * When changing grid sizes, certain state should persist:
 * - Accessibility settings should remain unchanged
 * - Progress tracking should be preserved for all grid sizes
 * - Child mode preference should be maintained (unless overridden by grid config)
 * - User preferences should not be lost during grid transitions
 */
describe('Property 10: State persistence across grid changes', () => {
  const gridConfigArbitrary = fc.constantFrom(...Object.values(GRID_CONFIGS));

  const accessibilityArbitrary: fc.Arbitrary<AccessibilitySettings> = fc.record(
    {
      highContrast: fc.boolean(),
      reducedMotion: fc.boolean(),
      screenReaderMode: fc.boolean(),
      largeText: fc.boolean(),
      audioFeedback: fc.boolean(),
      keyboardNavigation: fc.boolean(),
    }
  );

  const progressStatsArbitrary: fc.Arbitrary<ProgressStats> = fc.record({
    puzzlesCompleted: fc.nat(100),
    totalTime: fc.nat(10000),
    averageTime: fc.nat(1000),
    bestTime: fc.nat(1000),
    hintsUsed: fc.nat(50),
    achievements: fc.array(fc.string(), { maxLength: 10 }),
    streakCount: fc.nat(20),
    lastPlayed: fc.option(fc.date(), { nil: null }),
  });

  it('should preserve accessibility settings when changing grid sizes', () => {
    fc.assert(
      fc.property(
        gridConfigArbitrary,
        gridConfigArbitrary,
        accessibilityArbitrary,
        (initialGrid, newGrid, accessibilitySettings) => {
          const { result } = renderHook(() => useGameState());

          // Set initial accessibility settings
          act(() => {
            result.current.dispatch({
              type: 'UPDATE_ACCESSIBILITY',
              payload: accessibilitySettings,
            });
          });

          // Set initial grid config
          act(() => {
            result.current.dispatch({
              type: 'SET_GRID_CONFIG',
              payload: initialGrid,
            });
          });

          const accessibilityBeforeChange = result.current.state.accessibility;

          // Change grid size
          act(() => {
            result.current.dispatch({
              type: 'CHANGE_GRID_SIZE',
              payload: newGrid,
            });
          });

          const accessibilityAfterChange = result.current.state.accessibility;

          // Accessibility settings should be preserved
          expect(accessibilityAfterChange).toEqual(accessibilityBeforeChange);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve progress tracking for all grid sizes when changing grids', () => {
    fc.assert(
      fc.property(
        gridConfigArbitrary,
        gridConfigArbitrary,
        fc.record({
          '4x4': progressStatsArbitrary,
          '6x6': progressStatsArbitrary,
          '9x9': progressStatsArbitrary,
        }),
        (initialGrid, newGrid, progressData) => {
          const { result } = renderHook(() => useGameState());

          // Set initial progress data for all grid sizes
          act(() => {
            Object.entries(progressData).forEach(([gridSize, stats]) => {
              result.current.dispatch({
                type: 'UPDATE_PROGRESS',
                payload: { gridSize, stats },
              });
            });
          });

          // Set initial grid config
          act(() => {
            result.current.dispatch({
              type: 'SET_GRID_CONFIG',
              payload: initialGrid,
            });
          });

          const progressBeforeChange = result.current.state.progress;

          // Change grid size
          act(() => {
            result.current.dispatch({
              type: 'CHANGE_GRID_SIZE',
              payload: newGrid,
            });
          });

          const progressAfterChange = result.current.state.progress;

          // Progress data should be preserved for all grid sizes
          expect(progressAfterChange).toEqual(progressBeforeChange);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reset game state but preserve user preferences when changing grid sizes', () => {
    fc.assert(
      fc.property(
        gridConfigArbitrary,
        gridConfigArbitrary,
        fc.boolean(),
        fc.nat(10),
        (initialGrid, newGrid, childModePreference, difficulty) => {
          const { result } = renderHook(() => useGameState());

          // Set initial state with game in progress
          act(() => {
            result.current.dispatch({
              type: 'SET_CHILD_MODE',
              payload: childModePreference,
            });
            result.current.dispatch({
              type: 'SET_DIFFICULTY',
              payload: difficulty,
            });
            result.current.dispatch({
              type: 'SET_GRID_CONFIG',
              payload: initialGrid,
            });
          });

          // Simulate game in progress
          act(() => {
            result.current.dispatch({
              type: 'SET_PUZZLE',
              payload: {
                puzzle: Array(initialGrid.size)
                  .fill(null)
                  .map(() => Array(initialGrid.size).fill(0)),
                solution: Array(initialGrid.size)
                  .fill(null)
                  .map(() => Array(initialGrid.size).fill(1)),
                difficulty: 1,
              },
            });
          });

          // Verify game state exists
          expect(result.current.state.puzzle).not.toBeNull();
          expect(result.current.state.time).toBeGreaterThanOrEqual(0);

          const difficultyBeforeChange = result.current.state.difficulty;

          // Change grid size
          act(() => {
            result.current.dispatch({
              type: 'CHANGE_GRID_SIZE',
              payload: newGrid,
            });
          });

          // Game state should be reset
          expect(result.current.state.puzzle).toBeNull();
          expect(result.current.state.solution).toBeNull();
          expect(result.current.state.time).toBe(0);
          expect(result.current.state.userInput).toEqual([]);
          expect(result.current.state.history).toEqual([]);
          expect(result.current.state.isCorrect).toBeNull();
          expect(result.current.state.hintsUsed).toBe(0);

          // Grid config should be updated
          expect(result.current.state.gridConfig).toEqual(newGrid);

          // Difficulty should be adjusted to new grid's max if necessary
          const expectedDifficulty = Math.max(
            1,
            Math.min(difficultyBeforeChange, newGrid.difficultyLevels)
          );
          expect(result.current.state.difficulty).toBe(expectedDifficulty);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle child mode appropriately when changing to child-friendly grids', () => {
    fc.assert(
      fc.property(fc.boolean(), initialChildMode => {
        const { result } = renderHook(() => useGameState());

        // Set initial child mode
        act(() => {
          result.current.dispatch({
            type: 'SET_CHILD_MODE',
            payload: initialChildMode,
          });
        });

        // Change to 4x4 grid (child-friendly)
        const childFriendlyGrid = GRID_CONFIGS[4];
        act(() => {
          result.current.dispatch({
            type: 'CHANGE_GRID_SIZE',
            payload: childFriendlyGrid,
          });
        });

        // Child mode should be enabled for child-friendly grids
        if (childFriendlyGrid.childFriendly.enableAnimations) {
          expect(result.current.state.childMode).toBe(true);
        }

        // Reset child mode to initial preference before testing 9x9
        act(() => {
          result.current.dispatch({
            type: 'SET_CHILD_MODE',
            payload: initialChildMode,
          });
        });

        // Change to 9x9 grid (not child-friendly by default)
        const adultGrid = GRID_CONFIGS[9];
        act(() => {
          result.current.dispatch({
            type: 'CHANGE_GRID_SIZE',
            payload: adultGrid,
          });
        });

        // Child mode should preserve user preference for non-child-friendly grids
        if (!adultGrid.childFriendly.enableAnimations) {
          expect(result.current.state.childMode).toBe(initialChildMode);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain state consistency across multiple grid changes', () => {
    fc.assert(
      fc.property(
        fc.array(gridConfigArbitrary, { minLength: 2, maxLength: 5 }),
        accessibilityArbitrary,
        (gridSequence, accessibilitySettings) => {
          const { result } = renderHook(() => useGameState());

          // Set initial accessibility settings
          act(() => {
            result.current.dispatch({
              type: 'UPDATE_ACCESSIBILITY',
              payload: accessibilitySettings,
            });
          });

          const initialAccessibility = result.current.state.accessibility;
          const initialProgress = result.current.state.progress;

          // Apply sequence of grid changes
          gridSequence.forEach(grid => {
            act(() => {
              result.current.dispatch({
                type: 'CHANGE_GRID_SIZE',
                payload: grid,
              });
            });

            // After each change, verify persistence
            expect(result.current.state.accessibility).toEqual(
              initialAccessibility
            );
            expect(result.current.state.progress).toEqual(initialProgress);
            expect(result.current.state.gridConfig).toEqual(grid);
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});
