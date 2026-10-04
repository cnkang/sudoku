import { useCallback, useEffect, useRef, useState } from 'react';
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
  trackTransition,
  visualFeedback,
  optimisticUpdateCell,
  fetchPuzzleData = fetchWithCache,
  parsePuzzle = parseSudokuPuzzle,
  now = Date.now,
  performanceNow = performance.now.bind(performance),
}: PuzzleActionOptions): PuzzleActions {
  const lastFetchTimeRef = useRef<number | null>(null);
  const requestRef = useRef<{ id: number; controller?: AbortController }>({ id: 0 });
  const completedPuzzleRef = useRef<number[][] | null>(null);
  useEffect(
    () => () => {
      requestRef.current.id++;
      requestRef.current.controller?.abort();
    },
    [],
  );
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    gridTransitionTime: 0,
    puzzleLoadTime: 0,
  });
  const currentGridConfig = state.gridConfig;

  const loadPuzzle = useCallback(
    async (difficulty: number, size: GridSize, force: boolean, changeSize: boolean) => {
      if (force && lastFetchTimeRef.current !== null && now() - lastFetchTimeRef.current < 10_000) {
        handleError(new Error('Please wait 10 seconds before resetting'));
        return;
      }
      requestRef.current.controller?.abort();
      const controller = new AbortController();
      const id = requestRef.current.id + 1;
      requestRef.current = { id, controller };
      const started = performanceNow();
      const targetDifficulty = Math.min(
        Math.max(difficulty, 1),
        GRID_CONFIGS[size].difficultyLevels,
      );
      if (changeSize) dispatch({ type: 'CHANGE_GRID_SIZE', payload: GRID_CONFIGS[size] });
      else if (targetDifficulty !== state.difficulty)
        dispatch({ type: 'SET_DIFFICULTY', payload: targetDifficulty });
      dispatch({ type: 'SET_LOADING', payload: true });
      clearError();
      try {
        const data = await fetchPuzzleData(
          `/api/solveSudoku?difficulty=${targetDifficulty}&gridSize=${size}${force ? '&force=true' : ''}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
          },
          force || changeSize,
        );
        if (requestRef.current.id !== id) return;
        const puzzle = parsePuzzle(data);
        if (puzzle.puzzle.length !== size || puzzle.difficulty !== targetDifficulty)
          throw new Error('The puzzle does not match the selected settings');
        dispatch({ type: 'SET_PUZZLE', payload: puzzle });
        lastFetchTimeRef.current = now();
        const elapsed = performanceNow() - started;
        setPerformanceMetrics((previous) => ({
          ...previous,
          puzzleLoadTime: elapsed,
          ...(changeSize ? { gridTransitionTime: elapsed } : {}),
        }));
        if (changeSize) trackTransition(elapsed);
        if (state.childMode)
          visualFeedback.triggerEncouragement("New puzzle ready! Let's solve it together! 🧩");
      } catch (error) {
        if (requestRef.current.id !== id || controller.signal.aborted) return;
        dispatch({ type: 'SET_LOADING', payload: false });
        handleError(error);
      }
    },
    [
      now,
      performanceNow,
      state.difficulty,
      state.childMode,
      dispatch,
      clearError,
      fetchPuzzleData,
      parsePuzzle,
      trackTransition,
      visualFeedback,
      handleError,
    ],
  );

  const fetchPuzzle = useCallback(
    (difficulty?: number, forceRefresh = false, isGridSizeChange = false) =>
      loadPuzzle(
        difficulty ?? state.difficulty,
        currentGridConfig.size,
        forceRefresh,
        isGridSizeChange,
      ),
    [loadPuzzle, state.difficulty, currentGridConfig.size],
  );

  const handleGridSizeChange = useCallback(
    async (size: GridSize) => {
      if (size === currentGridConfig.size) return;
      await loadPuzzle(state.difficulty, size, false, true);
    },
    [loadPuzzle, state.difficulty, currentGridConfig.size],
  );

  const handleInputChange = useCallback(
    (row: number, col: number, value: number) => {
      if (state.isCorrect || state.isPaused || state.isLoading) return;
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
      state.isCorrect,
      state.isPaused,
      state.isLoading,
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
    if (
      state.isCorrect ||
      state.isPaused ||
      state.isLoading ||
      completedPuzzleRef.current === state.puzzle
    )
      return;
    if (!state.userInput || !state.solution) {
      handleError(new Error('Cannot check answer when puzzle is not loaded'));
      return;
    }

    try {
      dispatch({ type: 'CHECK_ANSWER' });
      const isCorrect =
        state.userInput.length === state.solution.length &&
        state.userInput.every(
          (row, rowIndex) =>
            row.length === state.solution?.[rowIndex]?.length &&
            row.every((cell, columnIndex) => cell === state.solution?.[rowIndex]?.[columnIndex]),
        );

      if (isCorrect) {
        completedPuzzleRef.current = state.puzzle;
        updateStats(state.difficulty, state.time, true);
        const gridSizeKey = `${currentGridConfig.size}x${currentGridConfig.size}`;
        dispatch({
          type: 'COMPLETE_PUZZLE',
          payload: { gridSize: gridSizeKey, time: state.time, hintsUsed: state.hintsUsed },
        });
        if (state.childMode) visualFeedback.triggerCelebration('confetti');
      }
    } catch (error) {
      handleError(error);
    }
  }, [
    state.isCorrect,
    state.isPaused,
    state.isLoading,
    state.puzzle,
    state.userInput,
    state.solution,
    state.time,
    state.hintsUsed,
    state.difficulty,
    state.childMode,
    currentGridConfig.size,
    dispatch,
    visualFeedback,
    handleError,
  ]);

  const getGameHint = useCallback(() => {
    if (
      state.isCorrect ||
      state.isPaused ||
      state.isLoading ||
      !state.puzzle ||
      !state.solution ||
      !state.userInput
    )
      return;

    // Exclude the currently-shown hint so a repeated request advances to a new
    // cell. If the user already followed the previous hint, that cell is no
    // longer empty/incorrect and would be skipped anyway; passing it as exclude
    // also covers the case where they haven't applied it yet.
    const exclude = state.showHint
      ? { row: state.showHint.row, col: state.showHint.col }
      : undefined;

    const hint = getHint(state.puzzle, state.userInput, state.solution, currentGridConfig, exclude);
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
    state.isCorrect,
    state.isPaused,
    state.isLoading,
    state.puzzle,
    state.solution,
    state.userInput,
    state.showHint,
    state.childMode,
    currentGridConfig,
    dispatch,
    visualFeedback,
  ]);

  const resetGame = useCallback(() => {
    void fetchPuzzle(undefined, true);
  }, [fetchPuzzle]);

  const pauseResumeGame = useCallback(() => dispatch({ type: 'PAUSE_RESUME' }), [dispatch]);
  const undoMove = useCallback(() => dispatch({ type: 'UNDO' }), [dispatch]);
  const handleAccessibilityChange = useCallback(
    (settings: Partial<AccessibilitySettings>) => {
      dispatch({ type: 'UPDATE_ACCESSIBILITY', payload: settings });
    },
    [dispatch],
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
