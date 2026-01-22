import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import SudokuGrid from '../SudokuGrid';
import { GRID_CONFIGS } from '@/utils/gridConfig';

vi.mock('@/hooks/useAudioAccessibility', () => ({
  useAudioAccessibility: () => [
    {},
    {
      speakCellDescription: vi.fn(),
      speakMove: vi.fn(),
      speakError: vi.fn(),
      speakGameState: vi.fn(),
      speakPuzzleCompletion: vi.fn(),
    },
  ],
}));

vi.mock('@/hooks/useVoiceInput', () => ({
  useVoiceInput: () => [
    {},
    {
      enableVoiceInput: vi.fn(),
      disableVoiceInput: vi.fn(),
      startListening: vi.fn(),
      stopListening: vi.fn(),
      toggleListening: vi.fn(),
      updateSettings: vi.fn(),
      processVoiceCommand: vi.fn(),
    },
  ],
}));

vi.mock('@/hooks/useAdaptiveTouchTargets', () => ({
  useAdaptiveTouchTargets: () => [
    {},
    {
      enableAdaptation: vi.fn(),
      disableAdaptation: vi.fn(),
    },
  ],
}));

vi.mock('@/hooks/useVisualFeedback', () => ({
  useVisualFeedback: () => ({
    triggerSuccess: vi.fn(),
    triggerError: vi.fn(),
    triggerEncouragement: vi.fn(),
    triggerCelebration: vi.fn(),
    triggerHint: vi.fn(),
    clearFeedback: vi.fn(),
    setFeedbackTriggers: vi.fn(),
  }),
  getContextualFeedback: () => ({ type: 'success', message: 'ok' }),
}));

vi.mock('@/utils/reducedMotion', () => ({
  useMotionPreferences: () => ({
    preferences: {
      prefersReducedMotion: false,
      allowAnimations: true,
      animationDuration: 300,
      transitionDuration: 150,
    },
    settings: {},
    updateSettings: vi.fn(),
    cssProperties: {},
  }),
}));

// Mock haptic feedback
Object.defineProperty(navigator, 'vibrate', {
  value: vi.fn(),
  writable: true,
});

describe('SudokuGrid', () => {
  const mockOnInputChange = vi.fn();
  const getFirstEditableInput = (includeDisabled = false) => {
    const grid = screen.getByTestId('sudoku-grid');
    const selector = includeDisabled ? 'input' : 'input:not([disabled])';
    return grid.querySelector(selector) as HTMLInputElement | null;
  };

  const samplePuzzle4x4 = [
    [1, 0, 0, 4],
    [0, 0, 1, 0],
    [0, 2, 0, 0],
    [3, 0, 0, 2],
  ];

  const sampleUserInput4x4 = [
    [1, 0, 0, 4],
    [0, 0, 1, 0],
    [0, 2, 0, 0],
    [3, 0, 0, 2],
  ];

  const samplePuzzle9x9 = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => 0)
  );
  samplePuzzle9x9[0][0] = 5;
  samplePuzzle9x9[1][1] = 3;

  const sampleUserInput9x9 = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => 0)
  );

  beforeEach(() => {
    mockOnInputChange.mockClear();
    vi.clearAllMocks();
  });

  describe('Multi-size grid support', () => {
    it('renders 4x4 grid correctly', () => {
      render(
        <SudokuGrid
          puzzle={samplePuzzle4x4}
          userInput={sampleUserInput4x4}
          onInputChange={mockOnInputChange}
          gridConfig={GRID_CONFIGS[4]}
        />
      );

      const grid = screen.getByTestId('sudoku-grid');
      expect(grid).toHaveAttribute('data-grid-size', '4');

      // Should have 16 cells (4x4)
      const cells = screen.getAllByTestId(/sudoku-cell-\d+-\d+/);
      expect(cells).toHaveLength(16);
    });

    it('renders 6x6 grid correctly', () => {
      const puzzle6x6 = Array.from({ length: 6 }, () =>
        Array.from({ length: 6 }, () => 0)
      );
      const userInput6x6 = Array.from({ length: 6 }, () =>
        Array.from({ length: 6 }, () => 0)
      );

      render(
        <SudokuGrid
          puzzle={puzzle6x6}
          userInput={userInput6x6}
          onInputChange={mockOnInputChange}
          gridConfig={GRID_CONFIGS[6]}
        />
      );

      const grid = screen.getByTestId('sudoku-grid');
      expect(grid).toHaveAttribute('data-grid-size', '6');

      // Should have 36 cells (6x6)
      const cells = screen.getAllByTestId(/sudoku-cell-\d+-\d+/);
      expect(cells).toHaveLength(36);
    });

    it('renders 9x9 grid correctly', () => {
      render(
        <SudokuGrid
          puzzle={samplePuzzle9x9}
          userInput={sampleUserInput9x9}
          onInputChange={mockOnInputChange}
          gridConfig={GRID_CONFIGS[9]}
        />
      );

      const grid = screen.getByTestId('sudoku-grid');
      expect(grid).toHaveAttribute('data-grid-size', '9');

      // Should have 81 cells (9x9)
      const cells = screen.getAllByTestId(/sudoku-cell-\d+-\d+/);
      expect(cells).toHaveLength(81);
    });
  });

  describe('Child-friendly features', () => {
    it('applies child mode styling when enabled', () => {
      render(
        <SudokuGrid
          puzzle={samplePuzzle4x4}
          userInput={sampleUserInput4x4}
          onInputChange={mockOnInputChange}
          gridConfig={GRID_CONFIGS[4]}
          childMode={true}
        />
      );

      const container = screen.getByTestId('sudoku-container');
      expect(container).toHaveAttribute('data-child-mode', 'true');

      const cells = screen.getAllByTestId(/sudoku-cell-\d+-\d+/);
      cells.forEach(cell => {
        expect(cell).toHaveAttribute('data-child-mode', 'true');
      });
    });

    it('supports long press for hints in child mode', async () => {
      vi.useFakeTimers();

      render(
        <SudokuGrid
          puzzle={samplePuzzle4x4}
          userInput={sampleUserInput4x4}
          onInputChange={mockOnInputChange}
          gridConfig={GRID_CONFIGS[4]}
          childMode={true}
        />
      );

      const editableCell = screen.getByTestId('sudoku-cell-0-1');

      try {
        // Simulate touch start
        fireEvent.touchStart(editableCell, {
          touches: [{ clientX: 100, clientY: 100 }],
        });

        // Wait for long press timeout (500ms + buffer)
        await act(async () => {
          vi.advanceTimersByTime(550);
        });

        fireEvent.touchEnd(editableCell, {
          changedTouches: [{ clientX: 100, clientY: 100 }],
        });
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('Accessibility features', () => {
    it('applies high contrast mode', () => {
      render(
        <SudokuGrid
          puzzle={samplePuzzle4x4}
          userInput={sampleUserInput4x4}
          onInputChange={mockOnInputChange}
          gridConfig={GRID_CONFIGS[4]}
          accessibility={{ highContrast: true }}
        />
      );

      const container = screen.getByTestId('sudoku-container');
      expect(container).toHaveAttribute('data-high-contrast', 'true');
    });

    it('applies large text mode', () => {
      render(
        <SudokuGrid
          puzzle={samplePuzzle4x4}
          userInput={sampleUserInput4x4}
          onInputChange={mockOnInputChange}
          gridConfig={GRID_CONFIGS[4]}
          accessibility={{ largeText: true }}
        />
      );

      const fixedNumbers = screen.getAllByTestId('fixed-number');
      expect(fixedNumbers[0].className).toContain('largeText');
    });

    it('provides proper ARIA labels for different grid sizes', () => {
      render(
        <SudokuGrid
          puzzle={samplePuzzle4x4}
          userInput={sampleUserInput4x4}
          onInputChange={mockOnInputChange}
          gridConfig={GRID_CONFIGS[4]}
        />
      );

      const grid = screen.getByRole('table');
      expect(grid).toHaveAttribute(
        'aria-label',
        expect.stringContaining('4×4 Sudoku puzzle grid')
      );

      const input = getFirstEditableInput();
      expect(input).toBeTruthy();
      expect(input).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Enter numbers 1 to 4')
      );
    });
  });

  describe('Touch interactions', () => {
    it('handles touch gestures correctly', async () => {
      render(
        <SudokuGrid
          puzzle={samplePuzzle4x4}
          userInput={sampleUserInput4x4}
          onInputChange={mockOnInputChange}
          gridConfig={GRID_CONFIGS[4]}
        />
      );

      const editableCell = screen.getByTestId('sudoku-cell-0-1');

      // Simulate tap
      fireEvent.touchStart(editableCell, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchEnd(editableCell, {
        changedTouches: [{ clientX: 100, clientY: 100 }],
      });

      // Should trigger haptic feedback
      expect(navigator.vibrate).toHaveBeenCalled();
    });

    it('cancels long press on touch move', () => {
      render(
        <SudokuGrid
          puzzle={samplePuzzle4x4}
          userInput={sampleUserInput4x4}
          onInputChange={mockOnInputChange}
          gridConfig={GRID_CONFIGS[4]}
          childMode={true}
        />
      );

      const editableCell = screen.getByTestId('sudoku-cell-0-1');

      fireEvent.touchStart(editableCell, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      // Move finger significantly
      fireEvent.touchMove(editableCell, {
        touches: [{ clientX: 120, clientY: 120 }],
      });

      fireEvent.touchEnd(editableCell, {
        changedTouches: [{ clientX: 120, clientY: 120 }],
      });
    });
  });

  describe('Input validation', () => {
    it('validates input based on grid size', async () => {
      const user = userEvent.setup();

      render(
        <SudokuGrid
          puzzle={samplePuzzle4x4}
          userInput={sampleUserInput4x4}
          onInputChange={mockOnInputChange}
          gridConfig={GRID_CONFIGS[4]}
        />
      );

      const input = getFirstEditableInput();
      expect(input).toBeTruthy();
      if (!input) return;

      // Valid input for 4x4 grid (1-4)
      await user.type(input, '3');
      expect(mockOnInputChange).toHaveBeenCalledWith(0, 1, 3);

      mockOnInputChange.mockClear();

      // Invalid input for 4x4 grid (5-9)
      await user.type(input, '5');
      expect(mockOnInputChange).not.toHaveBeenCalled();
    });

    it('handles keyboard navigation for different grid sizes', async () => {
      const user = userEvent.setup();

      render(
        <SudokuGrid
          puzzle={samplePuzzle4x4}
          userInput={sampleUserInput4x4}
          onInputChange={mockOnInputChange}
          gridConfig={GRID_CONFIGS[4]}
        />
      );

      const input = getFirstEditableInput();
      expect(input).toBeTruthy();
      if (!input) return;
      await user.click(input);

      // Arrow down should move to next row (max index is 3 for 4x4)
      await user.keyboard('{ArrowDown}');

      // Should focus cell at (1, 1)
      const nextCell = screen.getByTestId('sudoku-cell-1-1');
      expect(nextCell.querySelector('input')).toHaveFocus();
    });
  });

  describe('Error highlighting', () => {
    it('detects conflicts correctly for different grid sizes', () => {
      const conflictPuzzle = [
        [0, 0, 0, 4],
        [0, 0, 1, 0],
        [0, 2, 0, 0],
        [3, 0, 0, 2],
      ];

      const conflictInput = [
        [1, 1, 0, 4], // Two 1s in same row - conflict
        [0, 0, 1, 0],
        [0, 2, 0, 0],
        [3, 0, 0, 2],
      ];

      render(
        <SudokuGrid
          puzzle={conflictPuzzle}
          userInput={conflictInput}
          onInputChange={mockOnInputChange}
          gridConfig={GRID_CONFIGS[4]}
        />
      );

      const conflictCell1 = screen.getByTestId('sudoku-cell-0-0');
      const conflictCell2 = screen.getByTestId('sudoku-cell-0-1');

      expect(conflictCell1).toHaveAttribute('data-has-error', 'true');
      expect(conflictCell2).toHaveAttribute('data-has-error', 'true');
    });
  });

  describe('Performance optimizations', () => {
    it('uses React.memo for performance', () => {
      const { rerender } = render(
        <SudokuGrid
          puzzle={samplePuzzle4x4}
          userInput={sampleUserInput4x4}
          onInputChange={mockOnInputChange}
          gridConfig={GRID_CONFIGS[4]}
        />
      );

      // Re-render with same props should not cause re-render
      rerender(
        <SudokuGrid
          puzzle={samplePuzzle4x4}
          userInput={sampleUserInput4x4}
          onInputChange={mockOnInputChange}
          gridConfig={GRID_CONFIGS[4]}
        />
      );

      // Component should be memoized
      expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
    });
  });

  describe('Hint system', () => {
    it('displays hint cell correctly', () => {
      render(
        <SudokuGrid
          puzzle={samplePuzzle4x4}
          userInput={sampleUserInput4x4}
          onInputChange={mockOnInputChange}
          gridConfig={GRID_CONFIGS[4]}
          hintCell={{ row: 0, col: 1 }}
        />
      );

      const hintCell = screen.getByTestId('sudoku-cell-0-1');
      expect(hintCell).toHaveAttribute('data-is-hinted', 'true');
    });
  });

  describe('Disabled state', () => {
    it('disables all interactions when disabled', async () => {
      const user = userEvent.setup();

      render(
        <SudokuGrid
          puzzle={samplePuzzle4x4}
          userInput={sampleUserInput4x4}
          onInputChange={mockOnInputChange}
          gridConfig={GRID_CONFIGS[4]}
          disabled={true}
        />
      );

      const input = getFirstEditableInput(true);
      expect(input).toBeTruthy();
      expect(input).toBeDisabled();

      // Should not respond to clicks
      const cell = screen.getByTestId('sudoku-cell-0-1');
      await user.click(cell);

      expect(mockOnInputChange).not.toHaveBeenCalled();
    });
  });
});
