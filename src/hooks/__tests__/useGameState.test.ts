import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useGameState } from '../useGameState';
import { useOptimisticSudoku } from '../useOptimisticSudoku';
import { usePuzzleLoader } from '../usePuzzleLoader';
import { SudokuPuzzle } from '../../types';

describe('useGameState', () => {
  let result: ReturnType<
    typeof renderHook<ReturnType<typeof useGameState>, unknown>
  >['result'];

  beforeEach(() => {
    const { result: hookResult } = renderHook(() => useGameState());
    result = hookResult;
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      expect(result.current.state).toEqual({
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
      });
    });

    it('should provide dispatch, handleError, and clearError functions', () => {
      expect(typeof result.current.dispatch).toBe('function');
      expect(typeof result.current.handleError).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('SET_PUZZLE Action', () => {
    it('should set puzzle and initialize game state', () => {
      const mockPuzzle: SudokuPuzzle = {
        puzzle: [
          [1, 0, 3],
          [0, 2, 0],
          [3, 0, 1],
        ],
        solution: [
          [1, 2, 3],
          [4, 2, 5],
          [3, 6, 1],
        ],
        difficulty: 3,
      };

      act(() => {
        result.current.dispatch({ type: 'SET_PUZZLE', payload: mockPuzzle });
      });

      expect(result.current.state.puzzle).toEqual(mockPuzzle.puzzle);
      expect(result.current.state.solution).toEqual(mockPuzzle.solution);
      expect(result.current.state.userInput).toEqual([
        [1, 0, 3],
        [0, 2, 0],
        [3, 0, 1],
      ]);
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.isCorrect).toBeNull();
      expect(result.current.state.time).toBe(0);
      expect(result.current.state.timerActive).toBe(true);
      expect(result.current.state.isPaused).toBe(false);
      expect(result.current.state.isLoading).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should set error message from Error object', () => {
      const error = new Error('Test error message');

      act(() => {
        result.current.handleError(error);
      });

      expect(result.current.state.error).toBe('Test error message');
    });

    it('should set generic error message for non-Error objects', () => {
      act(() => {
        result.current.handleError('string error');
      });

      expect(result.current.state.error).toBe('An unexpected error occurred');
    });

    it('should clear error', () => {
      act(() => {
        result.current.dispatch({ type: 'SET_ERROR', payload: 'Test error' });
      });

      expect(result.current.state.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.state.error).toBeNull();
    });
  });

  describe('User Input Updates', () => {
    beforeEach(() => {
      const mockPuzzle: SudokuPuzzle = {
        puzzle: [
          [1, 0, 3],
          [0, 2, 0],
          [3, 0, 1],
        ],
        solution: [
          [1, 2, 3],
          [4, 2, 5],
          [3, 6, 1],
        ],
        difficulty: 3,
      };

      act(() => {
        result.current.dispatch({ type: 'SET_PUZZLE', payload: mockPuzzle });
      });
    });

    it('should update user input at specific position', () => {
      act(() => {
        result.current.dispatch({
          type: 'UPDATE_USER_INPUT',
          payload: { row: 0, col: 1, value: 5 },
        });
      });

      expect(result.current.state.userInput[0][1]).toBe(5);
    });

    it('should not affect other cells when updating', () => {
      const originalInput = [...result.current.state.userInput];

      act(() => {
        result.current.dispatch({
          type: 'UPDATE_USER_INPUT',
          payload: { row: 1, col: 0, value: 7 },
        });
      });

      expect(result.current.state.userInput[1][0]).toBe(7);
      expect(result.current.state.userInput[0]).toEqual(originalInput[0]);
      expect(result.current.state.userInput[2]).toEqual(originalInput[2]);
    });
  });

  describe('Difficulty Management', () => {
    it('should set difficulty and reset game state', () => {
      // First set a puzzle
      const mockPuzzle: SudokuPuzzle = {
        puzzle: [[1, 0, 3]],
        solution: [[1, 2, 3]],
        difficulty: 3,
      };

      act(() => {
        result.current.dispatch({ type: 'SET_PUZZLE', payload: mockPuzzle });
      });

      // Then change difficulty
      act(() => {
        result.current.dispatch({ type: 'SET_DIFFICULTY', payload: 5 });
      });

      expect(result.current.state.difficulty).toBe(5);
      expect(result.current.state.timerActive).toBe(false);
      expect(result.current.state.isPaused).toBe(false);
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.puzzle).toBeNull();
      expect(result.current.state.solution).toBeNull();
      expect(result.current.state.userInput).toEqual([]);
      expect(result.current.state.isCorrect).toBeNull();
    });
  });

  describe('Answer Checking', () => {
    beforeEach(() => {
      const mockPuzzle: SudokuPuzzle = {
        puzzle: [
          [1, 0],
          [0, 2],
        ],
        solution: [
          [1, 3],
          [4, 2],
        ],
        difficulty: 2,
      };

      act(() => {
        result.current.dispatch({ type: 'SET_PUZZLE', payload: mockPuzzle });
      });
    });

    it('should mark as correct when solution matches', () => {
      // Set user input to match solution
      act(() => {
        result.current.dispatch({
          type: 'UPDATE_USER_INPUT',
          payload: { row: 0, col: 1, value: 3 },
        });
      });

      act(() => {
        result.current.dispatch({
          type: 'UPDATE_USER_INPUT',
          payload: { row: 1, col: 0, value: 4 },
        });
      });

      act(() => {
        result.current.dispatch({ type: 'CHECK_ANSWER' });
      });

      expect(result.current.state.isCorrect).toBe(true);
      expect(result.current.state.timerActive).toBe(false);
      expect(result.current.state.isPaused).toBe(false);
    });

    it('should mark as incorrect when solution does not match', () => {
      // Set user input to not match solution
      act(() => {
        result.current.dispatch({
          type: 'UPDATE_USER_INPUT',
          payload: { row: 0, col: 1, value: 9 },
        });
      });

      act(() => {
        result.current.dispatch({ type: 'CHECK_ANSWER' });
      });

      expect(result.current.state.isCorrect).toBe(false);
      expect(result.current.state.timerActive).toBe(true);
      expect(result.current.state.isPaused).toBe(false);
    });
  });

  describe('Timer Management', () => {
    it('should increment time when timer is active and not paused', () => {
      act(() => {
        result.current.dispatch({
          type: 'SET_PUZZLE',
          payload: {
            puzzle: [[1]],
            solution: [[1]],
            difficulty: 1,
          },
        });
      });

      act(() => {
        result.current.dispatch({ type: 'TICK' });
      });

      expect(result.current.state.time).toBe(1);
    });

    it('should not increment time when timer is not active', () => {
      act(() => {
        result.current.dispatch({ type: 'TICK' });
      });

      expect(result.current.state.time).toBe(0);
    });

    it('should not increment time when paused', () => {
      act(() => {
        result.current.dispatch({
          type: 'SET_PUZZLE',
          payload: {
            puzzle: [[1]],
            solution: [[1]],
            difficulty: 1,
          },
        });
      });

      act(() => {
        result.current.dispatch({ type: 'PAUSE_RESUME' });
      });

      act(() => {
        result.current.dispatch({ type: 'TICK' });
      });

      expect(result.current.state.time).toBe(0);
    });
  });

  describe('Pause/Resume Functionality', () => {
    it('should toggle pause state', () => {
      expect(result.current.state.isPaused).toBe(false);

      act(() => {
        result.current.dispatch({ type: 'PAUSE_RESUME' });
      });

      expect(result.current.state.isPaused).toBe(true);

      act(() => {
        result.current.dispatch({ type: 'PAUSE_RESUME' });
      });

      expect(result.current.state.isPaused).toBe(false);
    });

    it('should handle timer activation correctly when resuming', () => {
      // Start with active timer
      act(() => {
        result.current.dispatch({
          type: 'SET_PUZZLE',
          payload: {
            puzzle: [[1]],
            solution: [[1]],
            difficulty: 1,
          },
        });
      });

      expect(result.current.state.timerActive).toBe(true);

      // Pause
      act(() => {
        result.current.dispatch({ type: 'PAUSE_RESUME' });
      });

      expect(result.current.state.isPaused).toBe(true);
      expect(result.current.state.timerActive).toBe(true);

      // Resume
      act(() => {
        result.current.dispatch({ type: 'PAUSE_RESUME' });
      });

      expect(result.current.state.isPaused).toBe(false);
      expect(result.current.state.timerActive).toBe(true);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to initial state but keep difficulty', () => {
      // Set up some state
      act(() => {
        result.current.dispatch({ type: 'SET_DIFFICULTY', payload: 5 });
      });

      act(() => {
        result.current.dispatch({
          type: 'SET_PUZZLE',
          payload: {
            puzzle: [[1]],
            solution: [[1]],
            difficulty: 5,
          },
        });
      });

      act(() => {
        result.current.dispatch({ type: 'TICK' });
      });

      // Reset
      act(() => {
        result.current.dispatch({ type: 'RESET' });
      });

      expect(result.current.state.difficulty).toBe(5);
      expect(result.current.state.puzzle).toBeNull();
      expect(result.current.state.solution).toBeNull();
      expect(result.current.state.userInput).toEqual([]);
      expect(result.current.state.time).toBe(0);
      expect(result.current.state.timerActive).toBe(false);
      expect(result.current.state.isCorrect).toBeNull();
      expect(result.current.state.isPaused).toBe(false);
      expect(result.current.state.error).toBeNull();
    });

    it('should reset and set loading state for fetch', () => {
      act(() => {
        result.current.dispatch({ type: 'SET_DIFFICULTY', payload: 3 });
      });

      act(() => {
        result.current.dispatch({ type: 'RESET_AND_FETCH' });
      });

      expect(result.current.state.difficulty).toBe(3);
      expect(result.current.state.isLoading).toBe(true);
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.puzzle).toBeNull();
    });
  });

  describe('Loading State', () => {
    it('should set loading state', () => {
      act(() => {
        result.current.dispatch({ type: 'SET_LOADING', payload: true });
      });

      expect(result.current.state.isLoading).toBe(true);

      act(() => {
        result.current.dispatch({ type: 'SET_LOADING', payload: false });
      });

      expect(result.current.state.isLoading).toBe(false);
    });
  });

  describe('Unknown Actions', () => {
    it('should return current state for unknown actions', () => {
      const initialState = result.current.state;

      act(() => {
        result.current.dispatch({ type: 'UNKNOWN_ACTION' } as never);
      });

      expect(result.current.state).toEqual(initialState);
    });
  });

  describe('Hint and Undo Features', () => {
    it('should handle hint actions', () => {
      act(() => {
        result.current.dispatch({ type: 'USE_HINT' });
      });

      expect(result.current.state.hintsUsed).toBe(1);

      act(() => {
        result.current.dispatch({
          type: 'SHOW_HINT',
          payload: { row: 0, col: 2, message: 'Try 4 here' },
        });
      });

      expect(result.current.state.showHint).toEqual({
        row: 0,
        col: 2,
        message: 'Try 4 here',
      });

      act(() => {
        result.current.dispatch({ type: 'CLEAR_HINT' });
      });

      expect(result.current.state.showHint).toBeNull();
    });

    it('should handle undo functionality', () => {
      const mockPuzzle = {
        puzzle: [[0, 0, 0]],
        solution: [[1, 2, 3]],
        difficulty: 1,
      };

      act(() => {
        result.current.dispatch({ type: 'SET_PUZZLE', payload: mockPuzzle });
      });

      expect(result.current.state.history).toHaveLength(1);

      act(() => {
        result.current.dispatch({
          type: 'UPDATE_USER_INPUT',
          payload: { row: 0, col: 0, value: 1 },
        });
      });

      expect(result.current.state.history).toHaveLength(2);
      expect(result.current.state.userInput[0][0]).toBe(1);

      act(() => {
        result.current.dispatch({ type: 'UNDO' });
      });

      expect(result.current.state.history).toHaveLength(1);
      expect(result.current.state.userInput[0][0]).toBe(0);
    });

    it('should clear hint when undoing', () => {
      const mockPuzzle = {
        puzzle: [[0]],
        solution: [[1]],
        difficulty: 1,
      };

      act(() => {
        result.current.dispatch({ type: 'SET_PUZZLE', payload: mockPuzzle });
      });

      act(() => {
        result.current.dispatch({
          type: 'UPDATE_USER_INPUT',
          payload: { row: 0, col: 0, value: 1 },
        });
      });

      act(() => {
        result.current.dispatch({
          type: 'SHOW_HINT',
          payload: { row: 0, col: 0, message: 'Test hint' },
        });
      });

      expect(result.current.state.showHint).not.toBeNull();

      act(() => {
        result.current.dispatch({ type: 'UNDO' });
      });

      expect(result.current.state.showHint).toBeNull();
    });
  });

  describe('Optimistic Updates (useOptimisticSudoku)', () => {
    const initialUserInput = [
      [1, 0, 3],
      [0, 2, 0],
      [3, 0, 1],
    ];

    it('should initialize with correct state', () => {
      const { result } = renderHook(() =>
        useOptimisticSudoku(initialUserInput)
      );

      expect(result.current.userInput).toEqual(initialUserInput);
      expect(result.current.isValidating).toBe(false);
      expect(typeof result.current.updateCell).toBe('function');
    });

    it('should handle optimistic updates', () => {
      const { result } = renderHook(() =>
        useOptimisticSudoku(initialUserInput)
      );

      act(() => {
        result.current.updateCell(0, 1, 5);
      });

      expect(result.current.userInput[0][1]).toBe(5);
      expect(result.current.isValidating).toBe(true);
    });

    it('should handle multiple updates', () => {
      const { result } = renderHook(() =>
        useOptimisticSudoku(initialUserInput)
      );

      act(() => {
        result.current.updateCell(0, 1, 5);
        result.current.updateCell(1, 0, 4);
      });

      expect(result.current.userInput[0][1]).toBe(5);
      expect(result.current.userInput[1][0]).toBe(4);
      expect(result.current.isValidating).toBe(true);
    });
  });

  describe('Puzzle Loading (usePuzzleLoader)', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return null data when shouldFetch is false', () => {
      const { result } = renderHook(() => usePuzzleLoader(5, false));
      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should start loading when shouldFetch is true', () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ puzzle: [[1]], solution: [[1]] }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePuzzleLoader(5, true));
      expect(result.current.loading).toBe(true);
    });

    it('should include force parameter in URL when specified', () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ puzzle: [[1]], solution: [[1]] }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      renderHook(() => usePuzzleLoader(5, true, true));

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/solveSudoku?difficulty=5&force=true',
        { method: 'POST' }
      );
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      expect(() => {
        renderHook(() => usePuzzleLoader(5, true));
      }).not.toThrow();
    });
  });
});
