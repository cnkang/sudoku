import { useCallback, useState } from 'react';
import type { Dispatch } from 'react';
import type { AccessibilitySettings, GameAction, GameState, GridSize, SudokuPuzzle } from '@/types';
import type { VisualFeedbackHook } from '@/hooks/useVisualFeedback';
import { fetchWithCache } from '@/utils/apiCache';
import { GRID_CONFIGS } from '@/utils/gridConfig';
import { getHint } from '@/utils/hints';
import { updateStats } from '@/utils/stats';
import { parseSudokuPuzzle } from '@/utils/sudokuPuzzleSchema';

interface PerformanceMetrics {
  gridTransitionTime: number;
  puzzleLoadTime: number;
}

export interface PuzzleActionOptions {
  state: GameState;
  dispatch: Dispatch<GameAction>;
  handleError: (error: unknown) => void;
  clearError: () => void;
  savePreferences: () => void;
  trackTransition: (duration: number) => void;
  visualFeedback: Pick<VisualFeedbackHook, 'triggerEncouragement' | 'triggerCelebration'>;
  optimisticUpdateCell: (row: number, col: number, value: number) => void;
  fetchPuzzleData?: typeof fetchWithCache;
  parsePuzzle?: (value: unknown) => SudokuPuzzle;
  now?: () => number;
  performanceNow?: () => number;
}

export interface PuzzleActions {
  fetchPuzzle: (
    difficulty?: number,
    forceRefresh?: boolean,
    isGridSizeChange?: boolean,
  ) => Promise<void>;
  handleGridSizeChange: (newSize: GridSize) => Promise<void>;
  handleInputChange: (row: number, col: number, value: number) => void;
  checkAnswer: () => void;
  getGameHint: () => void;
  resetGame: () => void;
  pauseResumeGame: () => void;
  undoMove: () => void;
  handleAccessibilityChange: (settings: Partial<AccessibilitySettings>) => void;
  performanceMetrics: PerformanceMetrics;
}

export function usePuzzleActions({
  state,
  dispatch,
  handleError,
  clearError,
  savePreferences,
  trackTransition,
  visualFeedback,
  optimisticUpdateCell,
  fetchPuzzleData = fetchWithCache,
  parsePuzzle = parseSudokuPuzzle,
  now = Date.now,
  performanceNow = performance.now.bind(performance),
}: PuzzleActionOptions): PuzzleActions {
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    gridTransitionTime: 0,
    puzzleLoadTime: 0,
  });
  const currentGridConfig = state.gridConfig;

  const handleGridSizeChange = useCallback(
    async (newSize: GridSize) => {
      if (newSize === currentGridConfig.size) return;

      const transitionStart = performanceNow();

      try {
        const newConfig = GRID_CONFIGS[newSize];
        dispatch({ type: 'CHANGE_GRID_SIZE', payload: newConfig });

        const targetDifficulty = Math.min(state.difficulty ?? 1, newConfig.difficultyLevels);
        const url = `/api/solveSudoku?difficulty=${targetDifficulty}&gridSize=${newSize}`;

        clearError();
        const fetchPromise = fetchPuzzleData(
          url,
          { method: 'POST', headers: { 'Content-Type': 'application/json' } },
          true,
        );
        const [data] = await Promise.all([fetchPromise, Promise.resolve(savePreferences())]);
        const puzzle = parsePuzzle(data);
        dispatch({ type: 'SET_PUZZLE', payload: puzzle });

        const transitionTime = performanceNow() - transitionStart;
        trackTransition(transitionTime);
        setPerformanceMetrics((previous) => ({
          ...previous,
          gridTransitionTime: transitionTime,
        }));
      } catch (error) {
        dispatch({ type: 'SET_LOADING', payload: false });
        handleError(error);
      }
    },
    [
      currentGridConfig.size,
      state.difficulty,
      dispatch,
      clearError,
      fetchPuzzleData,
      savePreferences,
      parsePuzzle,
      performanceNow,
      trackTransition,
      handleError,
    ],
  );

  const fetchPuzzle = useCallback(
    async (difficulty?: number, forceRefresh = false, isGridSizeChange = false) => {
      const currentTime = now();

      if (!isGridSizeChange && !forceRefresh && currentTime - lastFetchTime < 5_000) return;

      if (!isGridSizeChange && forceRefresh && currentTime - lastFetchTime < 10_000) {
        handleError(new Error('Please wait 10 seconds before resetting'));
        return;
      }

      setLastFetchTime(currentTime);
      const fetchStart = performanceNow();

      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        clearError();

        const targetDifficulty = difficulty ?? state.difficulty;
        const gridSize = currentGridConfig.size;
        const url = `/api/solveSudoku?difficulty=${targetDifficulty}&gridSize=${gridSize}${
          forceRefresh || isGridSizeChange ? '&force=true' : ''
        }`;
        const data = await fetchPuzzleData(
          url,
          { method: 'POST', headers: { 'Content-Type': 'application/json' } },
          forceRefresh || isGridSizeChange,
        );
        const puzzle = parsePuzzle(data);
        dispatch({ type: 'SET_PUZZLE', payload: puzzle });

        const loadTime = performanceNow() - fetchStart;
        setPerformanceMetrics((previous) => ({ ...previous, puzzleLoadTime: loadTime }));

        if (state.childMode) {
          visualFeedback.triggerEncouragement("New puzzle ready! Let's solve it together! 🧩");
        }
      } catch (error) {
        dispatch({ type: 'SET_LOADING', payload: false });
        handleError(error);
      }
    },
    [
      now,
      lastFetchTime,
      performanceNow,
      dispatch,
      clearError,
      state.difficulty,
      state.childMode,
      currentGridConfig.size,
      fetchPuzzleData,
      parsePuzzle,
      visualFeedback,
      handleError,
    ],
  );

  const handleInputChange = useCallback(
    (row: number, col: number, value: number) => {
      if (!state.userInput) {
        handleError(new Error('Cannot update user input when puzzle is not loaded'));
        return;
      }

      try {
        optimisticUpdateCell(row, col, value);
        dispatch({ type: 'UPDATE_USER_INPUT', payload: { row, col, value } });
        if (state.showHint?.row === row && state.showHint?.col === col) {
          dispatch({ type: 'CLEAR_HINT' });
        }
        if (state.childMode && value !== 0) {
          visualFeedback.triggerEncouragement('Great move! Keep going! ⭐');
        }
      } catch (error) {
        handleError(error);
      }
    },
    [
      state.userInput,
      state.showHint,
      state.childMode,
      optimisticUpdateCell,
      dispatch,
      visualFeedback,
      handleError,
    ],
  );

  const checkAnswer = useCallback(() => {
    if (!state.userInput || !state.solution) {
      handleError(new Error('Cannot check answer when puzzle is not loaded'));
      return;
    }

    try {
      dispatch({ type: 'CHECK_ANSWER' });
      const isCorrect = state.userInput.every((row, rowIndex) =>
        row.every((cell, columnIndex) => cell === state.solution?.[rowIndex]?.[columnIndex]),
      );

      if (isCorrect) {
        const gridSizeKey = `${currentGridConfig.size}x${currentGridConfig.size}`;
        dispatch({
          type: 'COMPLETE_PUZZLE',
          payload: { gridSize: gridSizeKey, time: state.time, hintsUsed: state.hintsUsed },
        });
        if (state.childMode) visualFeedback.triggerCelebration('confetti');
        savePreferences();
      }

      updateStats(state.difficulty, state.time, isCorrect);
    } catch (error) {
      handleError(error);
    }
  }, [
    state.userInput,
    state.solution,
    state.time,
    state.hintsUsed,
    state.difficulty,
    state.childMode,
    currentGridConfig.size,
    dispatch,
    visualFeedback,
    savePreferences,
    handleError,
  ]);

  const getGameHint = useCallback(() => {
    if (!state.puzzle || !state.solution || !state.userInput) return;

    const hint = getHint(state.puzzle, state.userInput, state.solution, currentGridConfig);
    if (!hint) return;

    dispatch({ type: 'USE_HINT' });
    dispatch({
      type: 'SHOW_HINT',
      payload: {
        row: hint.row,
        col: hint.col,
        message: state.childMode
          ? `Try putting ${hint.value} here! It fits perfectly! ✨`
          : hint.reason,
      },
    });
    if (state.childMode) {
      visualFeedback.triggerEncouragement("Here's a helpful hint! You've got this! 💡");
    }
  }, [
    state.puzzle,
    state.solution,
    state.userInput,
    state.childMode,
    currentGridConfig,
    dispatch,
    visualFeedback,
  ]);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_AND_FETCH' });
    void fetchPuzzle(undefined, true);
  }, [dispatch, fetchPuzzle]);

  const pauseResumeGame = useCallback(() => dispatch({ type: 'PAUSE_RESUME' }), [dispatch]);
  const undoMove = useCallback(() => dispatch({ type: 'UNDO' }), [dispatch]);
  const handleAccessibilityChange = useCallback(
    (settings: Partial<AccessibilitySettings>) => {
      dispatch({ type: 'UPDATE_ACCESSIBILITY', payload: settings });
      savePreferences();
    },
    [dispatch, savePreferences],
  );

  return {
    fetchPuzzle,
    handleGridSizeChange,
    handleInputChange,
    checkAnswer,
    getGameHint,
    resetGame,
    pauseResumeGame,
    undoMove,
    handleAccessibilityChange,
    performanceMetrics,
  };
}
