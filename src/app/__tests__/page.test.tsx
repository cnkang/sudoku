import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Home from '../page';

// Mock the components with proper props
vi.mock('../../components/SudokuGrid', () => ({
  default: ({ onInputChange, hintCell }: any) => (
    <div data-testid="sudoku-grid">
      <button onClick={() => onInputChange?.(0, 0, 5)}>Mock Input</button>
      {hintCell && (
        <div data-testid="hint-cell">
          Hint at {hintCell.row},{hintCell.col}
        </div>
      )}
    </div>
  ),
}));

vi.mock('../../components/Timer', () => ({
  default: ({ time, isActive, isPaused }: any) => (
    <div
      data-testid="timer"
      data-time={time}
      data-active={isActive}
      data-paused={isPaused}
    >
      Timer: {time}s
    </div>
  ),
}));

vi.mock('../../components/DifficultySelector', () => ({
  default: ({
    difficulty: _difficulty,
    onChange,
    disabled,
    isLoading,
  }: any) => (
    <div data-testid="difficulty-selector">
      <button onClick={() => onChange?.(5)} disabled={disabled || isLoading}>
        Change Difficulty
      </button>
    </div>
  ),
}));

vi.mock('../../components/GameControls', () => ({
  default: ({
    onSubmit,
    onReset,
    onPauseResume,
    onUndo,
    onHint,
    isCorrect,
  }: any) => (
    <div data-testid="game-controls">
      <button onClick={onSubmit}>Check</button>
      <button onClick={onReset}>Reset</button>
      <button onClick={onPauseResume}>Pause</button>
      <button onClick={onUndo}>Undo</button>
      <button onClick={onHint}>Hint</button>
      {isCorrect !== null && (
        <div data-testid="result">{isCorrect ? 'Correct' : 'Wrong'}</div>
      )}
    </div>
  ),
}));

// Mock utils
vi.mock('../../utils/hints', () => ({
  getHint: vi.fn(() => ({ row: 1, col: 1, reason: 'Test hint' })),
}));

vi.mock('../../utils/stats', () => ({
  updateStats: vi.fn(),
}));

vi.mock('../../utils/apiCache', () => ({
  fetchWithCache: vi.fn(),
}));

// Mock useGameState with proper factory function
vi.mock('../../hooks/useGameState', () => ({
  useGameState: vi.fn(),
}));

// Get mock functions after import
const mockDispatch = vi.fn();
const mockHandleError = vi.fn();
const mockClearError = vi.fn();

describe('Home Page', () => {
  const mockPuzzle = Array(9)
    .fill(null)
    .map(() => Array(9).fill(0));
  const mockSolution = Array(9)
    .fill(null)
    .map(() => Array(9).fill(1));
  const mockUserInput = Array(9)
    .fill(null)
    .map(() => Array(9).fill(0));

  beforeEach(async () => {
    vi.clearAllMocks();
    const { useGameState } = await import('../../hooks/useGameState');
    (useGameState as any).mockReturnValue({
      state: {
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
      },
      dispatch: mockDispatch,
      handleError: mockHandleError,
      clearError: mockClearError,
    });
  });

  describe('Initial Rendering', () => {
    it('should render the main page structure', () => {
      render(<Home />);

      expect(screen.getByText('Sudoku Challenge')).toBeInTheDocument();
      expect(
        screen.getByText('Test your logic and patience')
      ).toBeInTheDocument();
      expect(screen.getByTestId('difficulty-selector')).toBeInTheDocument();
    });

    it('should show loading state when no puzzle', () => {
      render(<Home />);

      expect(screen.getByText('Generating your puzzle...')).toBeInTheDocument();
    });
  });

  describe('Game State Interactions', () => {
    it('should render game area when puzzle is loaded', async () => {
      const { useGameState } = await import('../../hooks/useGameState');
      (useGameState as any).mockReturnValue({
        state: {
          puzzle: mockPuzzle,
          solution: mockSolution,
          userInput: mockUserInput,
          difficulty: 1,
          error: null,
          history: [mockUserInput],
          time: 120,
          timerActive: true,
          isCorrect: null,
          isPaused: false,
          isLoading: false,
          hintsUsed: 2,
          showHint: null,
        },
        dispatch: mockDispatch,
        handleError: mockHandleError,
        clearError: mockClearError,
      });

      render(<Home />);

      expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      expect(screen.getByTestId('timer')).toBeInTheDocument();
      expect(screen.getByTestId('game-controls')).toBeInTheDocument();
    });

    it('should display error message when error exists', async () => {
      const { useGameState } = await import('../../hooks/useGameState');
      (useGameState as any).mockReturnValue({
        state: {
          puzzle: null,
          error: 'Test error message',
          difficulty: 1,
          userInput: [],
          history: [],
          time: 0,
          timerActive: false,
          isCorrect: null,
          isPaused: false,
          isLoading: false,
          hintsUsed: 0,
          showHint: null,
        },
        dispatch: mockDispatch,
        handleError: mockHandleError,
        clearError: mockClearError,
      });

      render(<Home />);

      expect(screen.getByText('⚠️ Test error message')).toBeInTheDocument();

      const dismissButton = screen.getByText('×');
      fireEvent.click(dismissButton);
      expect(mockClearError).toHaveBeenCalled();
    });

    it('should display hint message when hint is shown', async () => {
      const { useGameState } = await import('../../hooks/useGameState');
      (useGameState as any).mockReturnValue({
        state: {
          puzzle: mockPuzzle,
          solution: mockSolution,
          userInput: mockUserInput,
          difficulty: 1,
          error: null,
          history: [mockUserInput],
          time: 0,
          timerActive: false,
          isCorrect: null,
          isPaused: false,
          isLoading: false,
          hintsUsed: 0,
          showHint: { row: 1, col: 1, message: 'Test hint message' },
        },
        dispatch: mockDispatch,
        handleError: mockHandleError,
        clearError: mockClearError,
      });

      render(<Home />);

      expect(screen.getByText('💡 Test hint message')).toBeInTheDocument();
    });
  });

  describe('Game Controls', () => {
    beforeEach(async () => {
      const { useGameState } = await import('../../hooks/useGameState');
      (useGameState as any).mockReturnValue({
        state: {
          puzzle: mockPuzzle,
          solution: mockSolution,
          userInput: mockUserInput,
          difficulty: 1,
          error: null,
          history: [mockUserInput],
          time: 0,
          timerActive: false,
          isCorrect: null,
          isPaused: false,
          isLoading: false,
          hintsUsed: 0,
          showHint: null,
        },
        dispatch: mockDispatch,
        handleError: mockHandleError,
        clearError: mockClearError,
      });
    });

    it('should handle input change', () => {
      render(<Home />);

      const inputButton = screen.getByText('Mock Input');
      act(() => {
        fireEvent.click(inputButton);
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_USER_INPUT',
        payload: { row: 0, col: 0, value: 5 },
      });
    });

    it('should handle difficulty change', () => {
      render(<Home />);

      const difficultyButton = screen.getByText('Change Difficulty');
      act(() => {
        fireEvent.click(difficultyButton);
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_DIFFICULTY',
        payload: 5,
      });
    });

    it('should handle pause/resume', () => {
      render(<Home />);

      const pauseButton = screen.getByText('Pause');
      act(() => {
        fireEvent.click(pauseButton);
      });

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'PAUSE_RESUME' });
    });

    it('should handle undo', () => {
      render(<Home />);

      const undoButton = screen.getByText('Undo');
      act(() => {
        fireEvent.click(undoButton);
      });

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'UNDO' });
    });

    it('should handle hint request', () => {
      render(<Home />);

      const hintButton = screen.getByText('Hint');
      act(() => {
        fireEvent.click(hintButton);
      });

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'USE_HINT' });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SHOW_HINT',
        payload: { row: 1, col: 1, message: 'Test hint' },
      });
    });

    it('should handle check answer', async () => {
      const { updateStats } = await import('../../utils/stats');

      render(<Home />);

      const checkButton = screen.getByText('Check');
      act(() => {
        fireEvent.click(checkButton);
      });

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'CHECK_ANSWER' });
      expect(updateStats).toHaveBeenCalled();
    });

    it('should handle reset game', () => {
      render(<Home />);

      const resetButton = screen.getByText('Reset');
      act(() => {
        fireEvent.click(resetButton);
      });

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'RESET_AND_FETCH' });
    });
  });

  describe('Error Handling', () => {
    it('should handle input change error when no puzzle', async () => {
      const { useGameState } = await import('../../hooks/useGameState');
      (useGameState as any).mockReturnValue({
        state: {
          puzzle: mockPuzzle,
          userInput: null,
          difficulty: 1,
          error: null,
          history: [],
          time: 0,
          timerActive: false,
          isCorrect: null,
          isPaused: false,
          isLoading: false,
          hintsUsed: 0,
          showHint: null,
        },
        dispatch: mockDispatch,
        handleError: mockHandleError,
        clearError: mockClearError,
      });

      render(<Home />);

      const inputButton = screen.getByText('Mock Input');
      act(() => {
        fireEvent.click(inputButton);
      });

      expect(mockHandleError).toHaveBeenCalledWith(
        new Error('Cannot update user input when puzzle is not loaded')
      );
    });

    it('should handle check answer error when no puzzle data', async () => {
      const { useGameState } = await import('../../hooks/useGameState');
      (useGameState as any).mockReturnValue({
        state: {
          puzzle: mockPuzzle,
          solution: null,
          userInput: null,
          difficulty: 1,
          error: null,
          history: [],
          time: 0,
          timerActive: false,
          isCorrect: null,
          isPaused: false,
          isLoading: false,
          hintsUsed: 0,
          showHint: null,
        },
        dispatch: mockDispatch,
        handleError: mockHandleError,
        clearError: mockClearError,
      });

      render(<Home />);

      const checkButton = screen.getByText('Check');
      act(() => {
        fireEvent.click(checkButton);
      });

      expect(mockHandleError).toHaveBeenCalledWith(
        new Error('Cannot check answer when puzzle is not loaded')
      );
    });
  });
});
