import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useGameState } from '../useGameState';

describe('useGameState - Hint and Undo Features', () => {
  it('should handle hint actions', () => {
    const { result } = renderHook(() => useGameState());

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
    const { result } = renderHook(() => useGameState());

    const mockPuzzle = {
      puzzle: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      solution: [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ],
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
    const { result } = renderHook(() => useGameState());

    const mockPuzzle = {
      puzzle: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      solution: [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ],
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

  it('should limit history to 10 entries', () => {
    const { result } = renderHook(() => useGameState());

    const mockPuzzle = {
      puzzle: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      solution: [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ],
      difficulty: 1,
    };

    act(() => {
      result.current.dispatch({ type: 'SET_PUZZLE', payload: mockPuzzle });
    });

    // Add 12 moves
    for (let i = 0; i < 12; i++) {
      act(() => {
        result.current.dispatch({
          type: 'UPDATE_USER_INPUT',
          payload: { row: 0, col: 0, value: (i % 9) + 1 },
        });
      });
    }

    expect(result.current.state.history.length).toBeLessThanOrEqual(10);
  });
});
