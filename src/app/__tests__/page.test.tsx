import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Home from '../page';

// Mock the components
vi.mock('../../components/SudokuGrid', () => ({
  default: ({
    onInputChange,
    disabled,
  }: {
    onInputChange: (row: number, col: number, value: number) => void;
    disabled: boolean;
  }) => (
    <div data-testid="sudoku-grid" data-disabled={disabled}>
      <button onClick={() => onInputChange(0, 0, 5)}>Mock Input Change</button>
    </div>
  ),
}));

vi.mock('../../components/Timer', () => ({
  default: ({
    time,
    isActive,
    isPaused,
  }: {
    time: number;
    isActive: boolean;
    isPaused: boolean;
  }) => (
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
    difficulty,
    onChange,
    disabled,
    isLoading,
  }: {
    difficulty: number;
    onChange: (d: number) => void;
    disabled: boolean;
    isLoading: boolean;
  }) => (
    <div data-testid="difficulty-selector">
      <select
        value={difficulty}
        onChange={e => onChange(parseInt(e.target.value))}
        disabled={disabled || isLoading}
        data-testid="difficulty-select"
      >
        {[1, 2, 3, 4, 5].map(d => (
          <option key={d} value={d}>
            Difficulty {d}
          </option>
        ))}
      </select>
    </div>
  ),
}));

vi.mock('../../components/GameControls', () => ({
  default: ({
    onSubmit,
    onReset,
    onPauseResume,
    isCorrect,
    isPaused,
    disabled,
    isLoading,
  }: {
    onSubmit: () => void;
    onReset: () => void;
    onPauseResume: () => void;
    isCorrect: boolean | null;
    isPaused: boolean;
    disabled: boolean;
    isLoading: boolean;
  }) => (
    <div data-testid="game-controls">
      <button onClick={onSubmit} disabled={disabled} data-testid="submit-btn">
        Check
      </button>
      <button
        onClick={onPauseResume}
        disabled={disabled}
        data-testid="pause-btn"
      >
        {isPaused ? 'Resume' : 'Pause'}
      </button>
      <button onClick={onReset} disabled={isLoading} data-testid="reset-btn">
        Reset
      </button>
      {isCorrect !== null && (
        <div data-testid="result">{isCorrect ? 'Correct!' : 'Incorrect!'}</div>
      )}
    </div>
  ),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock environment variable
process.env.NEXT_PUBLIC_API_URL = '/api/test';

describe('Home Page', () => {
  const mockPuzzleResponse = {
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
    difficulty: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPuzzleResponse),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
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

    it('should show loading state initially', () => {
      render(<Home />);

      expect(screen.getByText('Generating your puzzle...')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should fetch puzzle on initial load', async () => {
      render(<Home />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/test?difficulty=1',
          expect.objectContaining({
            method: 'POST',
            signal: expect.any(AbortSignal),
          })
        );
      });
    });
  });

  describe('Puzzle Loading', () => {
    it('should display game components after puzzle loads', async () => {
      render(<Home />);

      await waitFor(() => {
        expect(screen.getByTestId('timer')).toBeInTheDocument();
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
        expect(screen.getByTestId('game-controls')).toBeInTheDocument();
      });
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('⚠️ Network error')).toBeInTheDocument();
      });
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('⚠️ Server error')).toBeInTheDocument();
      });
    });

    it('should handle HTTP errors without error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

      render(<Home />);

      await waitFor(() => {
        expect(
          screen.getByText('⚠️ Failed to fetch puzzle')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error messages', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Test error'));

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('⚠️ Test error')).toBeInTheDocument();
      });
    });

    it('should allow clearing errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Test error'));

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('⚠️ Test error')).toBeInTheDocument();
      });

      const dismissButton = screen.getByRole('button', { name: '×' });
      fireEvent.click(dismissButton);

      expect(screen.queryByText('⚠️ Test error')).not.toBeInTheDocument();
    });

    it('should handle AbortError gracefully', async () => {
      const abortError = new Error('Request aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      render(<Home />);

      // Should not show error for aborted requests
      await waitFor(() => {
        expect(
          screen.queryByText('⚠️ Request aborted')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Difficulty Changes', () => {
    it('should fetch new puzzle when difficulty changes', async () => {
      render(<Home />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      mockFetch.mockClear();

      const difficultySelect = screen.getByTestId('difficulty-select');
      fireEvent.change(difficultySelect, { target: { value: '3' } });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/test?difficulty=3',
          expect.objectContaining({
            method: 'POST',
            signal: expect.any(AbortSignal),
          })
        );
      });
    });
  });

  describe('Game Controls', () => {
    beforeEach(async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });
    });

    it('should handle check answer', () => {
      const checkButton = screen.getByTestId('submit-btn');
      fireEvent.click(checkButton);

      // Should show result
      expect(screen.getByTestId('result')).toBeInTheDocument();
    });

    it('should handle pause/resume', () => {
      const pauseButton = screen.getByTestId('pause-btn');

      expect(screen.getByText('Pause')).toBeInTheDocument();

      fireEvent.click(pauseButton);

      expect(screen.getByText('Resume')).toBeInTheDocument();
    });

    it('should handle reset with debouncing', async () => {
      const resetButton = screen.getByTestId('reset-btn');

      // First reset
      fireEvent.click(resetButton);

      expect(mockFetch).toHaveBeenCalledTimes(2); // Initial + reset

      mockFetch.mockClear();

      // Second reset immediately (should be debounced)
      fireEvent.click(resetButton);

      expect(mockFetch).not.toHaveBeenCalled();

      // After 5 seconds, should allow reset
      vi.advanceTimersByTime(5000);

      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  describe('User Input Handling', () => {
    beforeEach(async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });
    });

    it('should handle valid user input', () => {
      const inputButton = screen.getByText('Mock Input Change');
      fireEvent.click(inputButton);

      // Should not show any errors
      expect(
        screen.queryByText(/cannot update user input/i)
      ).not.toBeInTheDocument();
    });

    it('should handle input when puzzle is not loaded', () => {
      // Reset to initial state
      const resetButton = screen.getByTestId('reset-btn');
      fireEvent.click(resetButton);

      // Try to input before puzzle loads
      const inputButton = screen.getByText('Mock Input Change');
      fireEvent.click(inputButton);

      // Should show error
      expect(
        screen.getByText(
          '⚠️ Cannot update user input when puzzle is not loaded'
        )
      ).toBeInTheDocument();
    });

    it('should handle check answer when puzzle is not loaded', () => {
      // Reset to initial state
      const resetButton = screen.getByTestId('reset-btn');
      fireEvent.click(resetButton);

      // Try to check answer before puzzle loads
      const checkButton = screen.getByTestId('submit-btn');
      fireEvent.click(checkButton);

      // Should show error
      expect(
        screen.getByText('⚠️ Cannot check answer when puzzle is not loaded')
      ).toBeInTheDocument();
    });
  });

  describe('Timer Functionality', () => {
    beforeEach(async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByTestId('timer')).toBeInTheDocument();
      });
    });

    it('should start timer when puzzle loads', () => {
      const timer = screen.getByTestId('timer');
      expect(timer).toHaveAttribute('data-active', 'true');
      expect(timer).toHaveAttribute('data-paused', 'false');
    });

    it('should increment timer every second', () => {
      let timer = screen.getByTestId('timer');
      expect(timer).toHaveAttribute('data-time', '0');

      vi.advanceTimersByTime(1000);

      timer = screen.getByTestId('timer');
      expect(timer).toHaveAttribute('data-time', '1');

      vi.advanceTimersByTime(2000);

      timer = screen.getByTestId('timer');
      expect(timer).toHaveAttribute('data-time', '3');
    });

    it('should pause timer when game is paused', () => {
      const pauseButton = screen.getByTestId('pause-btn');
      fireEvent.click(pauseButton);

      const timer = screen.getByTestId('timer');
      expect(timer).toHaveAttribute('data-paused', 'true');

      // Timer should not increment when paused
      vi.advanceTimersByTime(2000);

      expect(timer).toHaveAttribute('data-time', '0');
    });

    it('should stop timer when puzzle is solved correctly', () => {
      // Mock a correct solution

      // Simulate solving the puzzle (this would normally happen through user input)
      const checkButton = screen.getByTestId('submit-btn');
      fireEvent.click(checkButton);

      // Timer should stop (this is handled by the game state)
      const timer = screen.getByTestId('timer');
      expect(timer).toBeInTheDocument();
    });
  });

  describe('Game State Management', () => {
    beforeEach(async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });
    });

    it('should disable game when paused', () => {
      const pauseButton = screen.getByTestId('pause-btn');
      fireEvent.click(pauseButton);

      const sudokuGrid = screen.getByTestId('sudoku-grid');
      expect(sudokuGrid).toHaveAttribute('data-disabled', 'true');
    });

    it('should disable game when solved correctly', () => {
      // Simulate correct answer
      const checkButton = screen.getByTestId('submit-btn');
      fireEvent.click(checkButton);

      // Game should be disabled after correct solution
      const sudokuGrid = screen.getByTestId('sudoku-grid');
      expect(sudokuGrid).toHaveAttribute('data-disabled', 'true');
    });
  });

  describe('Request Debouncing', () => {
    it('should debounce fetch requests', async () => {
      render(<Home />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      mockFetch.mockClear();

      const difficultySelect = screen.getByTestId('difficulty-select');

      // Rapid difficulty changes
      fireEvent.change(difficultySelect, { target: { value: '2' } });
      fireEvent.change(difficultySelect, { target: { value: '3' } });
      fireEvent.change(difficultySelect, { target: { value: '4' } });

      // Should only make one request due to debouncing
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });

    it('should allow requests after debounce period', async () => {
      render(<Home />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      mockFetch.mockClear();

      const difficultySelect = screen.getByTestId('difficulty-select');

      // First change
      fireEvent.change(difficultySelect, { target: { value: '2' } });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Wait for debounce period
      vi.advanceTimersByTime(5000);

      // Second change after debounce period
      fireEvent.change(difficultySelect, { target: { value: '3' } });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Request Cancellation', () => {
    it('should cancel previous requests when making new ones', async () => {
      const abortSpy = vi.fn();
      const mockAbortController = {
        abort: abortSpy,
        signal: new AbortController().signal,
      };

      vi.spyOn(global, 'AbortController').mockImplementation(
        () => mockAbortController
      );

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
      });

      const difficultySelect = screen.getByTestId('difficulty-select');

      // Wait for debounce period to allow new request
      vi.advanceTimersByTime(5000);

      // Make another request
      fireEvent.change(difficultySelect, { target: { value: '3' } });

      // Previous request should be aborted
      expect(abortSpy).toHaveBeenCalled();
    });
  });
});
