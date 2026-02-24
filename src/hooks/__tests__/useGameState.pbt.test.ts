import { act, renderHook } from '@testing-library/react';
import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { AccessibilitySettings, ProgressStats } from '../../types';
import { GRID_CONFIGS } from '../../utils/gridConfig';
import { useGameState } from '../useGameState';

const setAccessibility = (
  result: ReturnType<typeof renderHook<typeof useGameState>>['result'],
  accessibilitySettings: AccessibilitySettings
) => {
  act(() => {
    result.current.dispatch({
      type: 'UPDATE_ACCESSIBILITY',
      payload: accessibilitySettings,
    });
  });
};

const setGridConfig = (
  result: ReturnType<typeof renderHook<typeof useGameState>>['result'],
  gridConfig: (typeof GRID_CONFIGS)[keyof typeof GRID_CONFIGS]
) => {
  act(() => {
    result.current.dispatch({
      type: 'SET_GRID_CONFIG',
      payload: gridConfig,
    });
  });
};

const changeGridSize = (
  result: ReturnType<typeof renderHook<typeof useGameState>>['result'],
  gridConfig: (typeof GRID_CONFIGS)[keyof typeof GRID_CONFIGS]
) => {
  act(() => {
    result.current.dispatch({
      type: 'CHANGE_GRID_SIZE',
      payload: gridConfig,
    });
  });
};

const setChildMode = (
  result: ReturnType<typeof renderHook<typeof useGameState>>['result'],
  childMode: boolean
) => {
  act(() => {
    result.current.dispatch({
      type: 'SET_CHILD_MODE',
      payload: childMode,
    });
  });
};

const setDifficulty = (
  result: ReturnType<typeof renderHook<typeof useGameState>>['result'],
  difficulty: number
) => {
  act(() => {
    result.current.dispatch({
      type: 'SET_DIFFICULTY',
      payload: difficulty,
    });
  });
};

const setProgressData = (
  result: ReturnType<typeof renderHook<typeof useGameState>>['result'],
  progressData: Record<string, ProgressStats>
) => {
  act(() => {
    Object.entries(progressData).forEach(([gridSize, stats]) => {
      result.current.dispatch({
        type: 'UPDATE_PROGRESS',
        payload: { gridSize, stats },
      });
    });
  });
};

const buildFilledGrid = (size: number, value: number) =>
  Array.from({ length: size }, () => Array.from({ length: size }, () => value));

const setPuzzleInProgress = (
  result: ReturnType<typeof renderHook<typeof useGameState>>['result'],
  gridSize: number
) => {
  act(() => {
    result.current.dispatch({
      type: 'SET_PUZZLE',
      payload: {
        puzzle: buildFilledGrid(gridSize, 0),
        solution: buildFilledGrid(gridSize, 1),
        difficulty: 1,
      },
    });
  });
};

const assertChildModeForGridChange = (
  initialChildMode: boolean,
  childFriendlyGrid: (typeof GRID_CONFIGS)[4],
  adultGrid: (typeof GRID_CONFIGS)[9],
  result: ReturnType<typeof renderHook<typeof useGameState>>['result']
) => {
  changeGridSize(result, childFriendlyGrid);

  if (childFriendlyGrid.childFriendly.enableAnimations) {
    expect(result.current.state.childMode).toBe(true);
  }

  setChildMode(result, initialChildMode);
  changeGridSize(result, adultGrid);

  if (!adultGrid.childFriendly.enableAnimations) {
    expect(result.current.state.childMode).toBe(initialChildMode);
  }
};

const assertSequencePersistence = (
  gridSequence: Array<(typeof GRID_CONFIGS)[keyof typeof GRID_CONFIGS]>,
  result: ReturnType<typeof renderHook<typeof useGameState>>['result']
) => {
  const initialAccessibility = result.current.state.accessibility;
  const initialProgress = result.current.state.progress;

  gridSequence.forEach(grid => {
    changeGridSize(result, grid);
    expect(result.current.state.accessibility).toEqual(initialAccessibility);
    expect(result.current.state.progress).toEqual(initialProgress);
    expect(result.current.state.gridConfig).toEqual(grid);
  });
};

const assertAccessibilityPreserved = (
  initialGrid: (typeof GRID_CONFIGS)[keyof typeof GRID_CONFIGS],
  newGrid: (typeof GRID_CONFIGS)[keyof typeof GRID_CONFIGS],
  accessibilitySettings: AccessibilitySettings
) => {
  const { result } = renderHook(() => useGameState());

  setAccessibility(result, accessibilitySettings);
  setGridConfig(result, initialGrid);

  const accessibilityBeforeChange = result.current.state.accessibility;
  changeGridSize(result, newGrid);
  const accessibilityAfterChange = result.current.state.accessibility;

  expect(accessibilityAfterChange).toEqual(accessibilityBeforeChange);
};

const assertProgressPreserved = (
  initialGrid: (typeof GRID_CONFIGS)[keyof typeof GRID_CONFIGS],
  newGrid: (typeof GRID_CONFIGS)[keyof typeof GRID_CONFIGS],
  progressData: Record<string, ProgressStats>
) => {
  const { result } = renderHook(() => useGameState());

  setProgressData(result, progressData);
  setGridConfig(result, initialGrid);

  const progressBeforeChange = result.current.state.progress;
  act(() => {
    result.current.dispatch({
      type: 'CHANGE_GRID_SIZE',
      payload: newGrid,
    });
  });
  const progressAfterChange = result.current.state.progress;

  expect(progressAfterChange).toEqual(progressBeforeChange);
};

const assertStateResetOnGridChange = (
  initialGrid: (typeof GRID_CONFIGS)[keyof typeof GRID_CONFIGS],
  newGrid: (typeof GRID_CONFIGS)[keyof typeof GRID_CONFIGS],
  childModePreference: boolean,
  difficulty: number
) => {
  const { result } = renderHook(() => useGameState());

  setChildMode(result, childModePreference);
  setDifficulty(result, difficulty);
  setGridConfig(result, initialGrid);
  setPuzzleInProgress(result, initialGrid.size);

  expect(result.current.state.puzzle).not.toBeNull();
  expect(result.current.state.time).toBeGreaterThanOrEqual(0);

  const difficultyBeforeChange = result.current.state.difficulty;
  changeGridSize(result, newGrid);

  expect(result.current.state.puzzle).toBeNull();
  expect(result.current.state.solution).toBeNull();
  expect(result.current.state.time).toBe(0);
  expect(result.current.state.userInput).toEqual([]);
  expect(result.current.state.history).toEqual([]);
  expect(result.current.state.isCorrect).toBeNull();
  expect(result.current.state.hintsUsed).toBe(0);
  expect(result.current.state.gridConfig).toEqual(newGrid);

  const expectedDifficulty = Math.max(
    1,
    Math.min(difficultyBeforeChange, newGrid.difficultyLevels)
  );
  expect(result.current.state.difficulty).toBe(expectedDifficulty);
};

const assertChildModeHandling = (initialChildMode: boolean) => {
  const { result } = renderHook(() => useGameState());

  setChildMode(result, initialChildMode);

  const childFriendlyGrid = GRID_CONFIGS[4];
  const adultGrid = GRID_CONFIGS[9];
  assertChildModeForGridChange(
    initialChildMode,
    childFriendlyGrid,
    adultGrid,
    result
  );
};

const assertStateConsistency = (
  gridSequence: Array<(typeof GRID_CONFIGS)[keyof typeof GRID_CONFIGS]>,
  accessibilitySettings: AccessibilitySettings
) => {
  const { result } = renderHook(() => useGameState());

  setAccessibility(result, accessibilitySettings);
  assertSequencePersistence(gridSequence, result);
};

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
        assertAccessibilityPreserved
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
        assertProgressPreserved
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
        assertStateResetOnGridChange
      ),
      { numRuns: 100 }
    );
  });

  it('should handle child mode appropriately when changing to child-friendly grids', () => {
    fc.assert(fc.property(fc.boolean(), assertChildModeHandling), {
      numRuns: 100,
    });
  });

  it('should maintain state consistency across multiple grid changes', () => {
    fc.assert(
      fc.property(
        fc.array(gridConfigArbitrary, { minLength: 2, maxLength: 5 }),
        accessibilityArbitrary,
        assertStateConsistency
      ),
      { numRuns: 50 }
    );
  });
});
