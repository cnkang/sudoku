import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import type { GameAction, GameState, SudokuPuzzle } from '@/types';
import { GRID_CONFIGS } from '@/utils/gridConfig';
import { usePuzzleActions } from '../usePuzzleActions';

const puzzle: SudokuPuzzle = {
  puzzle: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0)),
  solution: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 1)),
  difficulty: 1,
};

const createState = (overrides: Partial<GameState> = {}): GameState => ({
  puzzle: null,
  solution: null,
  difficulty: 1,
  error: null,
  userInput: [],
  history: [],
  time: 0,
  timerActive: false,
  isCorrect: null,
  isPaused: false,
  isLoading: false,
  hintsUsed: 0,
  showHint: null,
  gridConfig: GRID_CONFIGS[9],
  childMode: false,
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    screenReaderMode: false,
    largeText: false,
    audioFeedback: false,
    keyboardNavigation: false,
    voiceInput: false,
    adaptiveTouchTargets: false,
  },
  progress: {},
  ...overrides,
});

const setup = (state = createState()) => {
  const dispatch = vi.fn<(action: GameAction) => void>();
  const fetchPuzzleData = vi.fn().mockResolvedValue(puzzle);
  const parsePuzzle = vi.fn((value: unknown) => value as SudokuPuzzle);
  const handleError = vi.fn();
  const options = {
    state,
    dispatch,
    handleError,
    clearError: vi.fn(),
    savePreferences: vi.fn(),
    trackTransition: vi.fn(),
    visualFeedback: {
      triggerEncouragement: vi.fn(),
      triggerCelebration: vi.fn(),
    },
    optimisticUpdateCell: vi.fn(),
    fetchPuzzleData,
    parsePuzzle,
    now: vi.fn(() => 20_000),
    performanceNow: vi.fn(() => 100),
  };

  return {
    ...renderHook(() => usePuzzleActions(options)),
    dispatch,
    fetchPuzzleData,
    parsePuzzle,
    handleError,
    options,
  };
};

describe('usePuzzleActions', () => {
  it('parses fetched data before dispatching the puzzle', async () => {
    const { result, dispatch, parsePuzzle } = setup();

    await act(() => result.current.fetchPuzzle());

    expect(parsePuzzle).toHaveBeenCalledWith(puzzle);
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_LOADING', payload: true });
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_PUZZLE', payload: puzzle });
  });

  it('resets loading and reports fetch errors', async () => {
    const context = setup();
    context.fetchPuzzleData.mockRejectedValueOnce(new Error('offline'));

    await act(() => context.result.current.fetchPuzzle());

    expect(context.dispatch).toHaveBeenCalledWith({ type: 'SET_LOADING', payload: false });
    expect(context.handleError).toHaveBeenCalledWith(new Error('offline'));
  });

  it('does nothing when selecting the current grid size', async () => {
    const { result, dispatch, fetchPuzzleData } = setup();

    await act(() => result.current.handleGridSizeChange(9));

    expect(dispatch).not.toHaveBeenCalled();
    expect(fetchPuzzleData).not.toHaveBeenCalled();
  });

  it('updates a cell and clears a hint on the same cell', () => {
    const state = createState({
      userInput: puzzle.puzzle,
      showHint: { row: 1, col: 2, message: 'hint' },
    });
    const { result, dispatch, options } = setup(state);

    act(() => result.current.handleInputChange(1, 2, 4));

    expect(options.optimisticUpdateCell).toHaveBeenCalledWith(1, 2, 4);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'UPDATE_USER_INPUT',
      payload: { row: 1, col: 2, value: 4 },
    });
    expect(dispatch).toHaveBeenCalledWith({ type: 'CLEAR_HINT' });
  });

  it('exposes pause and undo actions', () => {
    const { result, dispatch } = setup();

    act(() => {
      result.current.pauseResumeGame();
      result.current.undoMove();
    });

    expect(dispatch).toHaveBeenNthCalledWith(1, { type: 'PAUSE_RESUME' });
    expect(dispatch).toHaveBeenNthCalledWith(2, { type: 'UNDO' });
  });
});
