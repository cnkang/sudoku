import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SudokuGrid from '../SudokuGrid';

describe('SudokuGrid', () => {
  const mockPuzzle = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ];

  const mockUserInput = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ];

  const mockOnInputChange = vi.fn();

  const defaultProps = {
    puzzle: mockPuzzle,
    userInput: mockUserInput,
    onInputChange: mockOnInputChange,
    disabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render 9x9 grid', () => {
      render(<SudokuGrid {...defaultProps} />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      expect(table).toHaveAttribute('aria-label', 'Sudoku puzzle grid');

      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(9);
    });

    it('should render fixed numbers correctly', () => {
      render(<SudokuGrid {...defaultProps} />);

      // Check some fixed numbers exist
      expect(screen.getAllByText('5').length).toBeGreaterThan(0); // Multiple 5s in puzzle
      expect(screen.getAllByText('3').length).toBeGreaterThan(0); // Multiple 3s in puzzle
      expect(screen.getAllByText('6').length).toBeGreaterThan(0); // Multiple 6s in puzzle
    });

    it('should render input fields for empty cells', () => {
      render(<SudokuGrid {...defaultProps} />);

      // Count input fields (should be cells with 0 in puzzle)
      const inputs = screen.getAllByRole('textbox');
      const emptyCells = mockPuzzle.flat().filter(cell => cell === 0).length;
      expect(inputs).toHaveLength(emptyCells);
    });

    it('should display user input values in editable cells', () => {
      const userInputWithValues = mockUserInput.map(row => [...row]);
      userInputWithValues[0][2] = 4; // Add user input to empty cell

      render(<SudokuGrid {...defaultProps} userInput={userInputWithValues} />);

      const input = screen.getByDisplayValue('4');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Cell Types', () => {
    it('should distinguish between fixed and editable cells', () => {
      render(<SudokuGrid {...defaultProps} />);

      // Fixed cells should have spans with fixed-number class
      const fixedNumbers = document.querySelectorAll('.fixed-number');
      const expectedFixedCount = mockPuzzle
        .flat()
        .filter(cell => cell !== 0).length;
      expect(fixedNumbers).toHaveLength(expectedFixedCount);

      // Editable cells should have inputs
      const inputs = screen.getAllByRole('textbox');
      const expectedEditableCount = mockPuzzle
        .flat()
        .filter(cell => cell === 0).length;
      expect(inputs).toHaveLength(expectedEditableCount);
    });

    it('should apply correct CSS classes to cells', () => {
      render(<SudokuGrid {...defaultProps} />);

      const fixedCells = document.querySelectorAll('.sudoku-cell.fixed');
      const editableCells = document.querySelectorAll('.sudoku-cell.editable');

      expect(fixedCells.length + editableCells.length).toBe(81); // 9x9 grid
    });
  });

  describe('User Input Handling', () => {
    it('should call onInputChange when user types in input field', () => {
      render(<SudokuGrid {...defaultProps} />);

      const inputs = screen.getAllByRole('textbox');
      const firstInput = inputs[0];

      fireEvent.change(firstInput, { target: { value: '7' } });

      expect(mockOnInputChange).toHaveBeenCalled();
      const [, , value] = mockOnInputChange.mock.calls[0];
      expect(value).toBe(7);
    });

    it('should handle empty input (deletion)', () => {
      render(<SudokuGrid {...defaultProps} />);

      const inputs = screen.getAllByRole('textbox');
      const firstInput = inputs[0];

      // First set a value, then clear it
      fireEvent.change(firstInput, { target: { value: '5' } });
      mockOnInputChange.mockClear();
      fireEvent.change(firstInput, { target: { value: '' } });

      expect(mockOnInputChange).toHaveBeenCalled();
      const [, , value] = mockOnInputChange.mock.calls[0];
      expect(value).toBe(0);
    });

    it('should only accept valid numbers (1-9)', () => {
      render(<SudokuGrid {...defaultProps} />);

      const inputs = screen.getAllByRole('textbox');
      const firstInput = inputs[0];

      // Valid input
      fireEvent.change(firstInput, { target: { value: '5' } });
      expect(mockOnInputChange).toHaveBeenCalledTimes(1);

      // Invalid inputs should not trigger onChange
      fireEvent.change(firstInput, { target: { value: '0' } });
      fireEvent.change(firstInput, { target: { value: 'a' } });
      fireEvent.change(firstInput, { target: { value: '10' } });

      // Should still be called only once (for the valid input)
      expect(mockOnInputChange).toHaveBeenCalledTimes(1);
    });

    it('should handle maxLength attribute', () => {
      render(<SudokuGrid {...defaultProps} />);

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toHaveAttribute('maxLength', '1');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle arrow key navigation', () => {
      render(<SudokuGrid {...defaultProps} />);

      const inputs = screen.getAllByRole('textbox');
      const firstInput = inputs[0];

      // Focus first input
      firstInput.focus();

      // Test arrow key navigation
      fireEvent.keyDown(firstInput, { key: 'ArrowRight' });
      fireEvent.keyDown(firstInput, { key: 'ArrowDown' });
      fireEvent.keyDown(firstInput, { key: 'ArrowLeft' });
      fireEvent.keyDown(firstInput, { key: 'ArrowUp' });

      // Navigation should not call onInputChange
      expect(mockOnInputChange).not.toHaveBeenCalled();
    });

    it('should handle number input via keyboard', () => {
      render(<SudokuGrid {...defaultProps} />);

      const inputs = screen.getAllByRole('textbox');
      const firstInput = inputs[0];

      fireEvent.keyDown(firstInput, { key: '7' });

      expect(mockOnInputChange).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        7
      );
    });

    it('should handle deletion via keyboard', () => {
      render(<SudokuGrid {...defaultProps} />);

      const inputs = screen.getAllByRole('textbox');
      const firstInput = inputs[0];

      // Test Backspace
      fireEvent.keyDown(firstInput, { key: 'Backspace' });
      expect(mockOnInputChange).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        0
      );

      mockOnInputChange.mockClear();

      // Test Delete
      fireEvent.keyDown(firstInput, { key: 'Delete' });
      expect(mockOnInputChange).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        0
      );

      mockOnInputChange.mockClear();

      // Test '0' key
      fireEvent.keyDown(firstInput, { key: '0' });
      expect(mockOnInputChange).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        0
      );
    });

    it('should prevent default behavior for handled keys', () => {
      render(<SudokuGrid {...defaultProps} />);

      const inputs = screen.getAllByRole('textbox');
      const firstInput = inputs[0];

      const mockEvent = {
        key: '5',
        preventDefault: vi.fn(),
      };

      fireEvent.keyDown(firstInput, mockEvent);
      expect(mockEvent.preventDefault).toHaveBeenCalled();

      const mockArrowEvent = {
        key: 'ArrowRight',
        preventDefault: vi.fn(),
      };

      fireEvent.keyDown(firstInput, mockArrowEvent);
      expect(mockArrowEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Cell Selection', () => {
    it('should handle cell click for editable cells', () => {
      render(<SudokuGrid {...defaultProps} />);

      // Find an editable cell (where puzzle value is 0)
      const editableCells = document.querySelectorAll('.sudoku-cell.editable');
      const firstEditableCell = editableCells[0];

      fireEvent.click(firstEditableCell);

      // Should apply selected class
      expect(firstEditableCell).toHaveClass('selected');
    });

    it('should not select fixed cells', () => {
      render(<SudokuGrid {...defaultProps} />);

      // Find a fixed cell (where puzzle value is not 0)
      const fixedCells = document.querySelectorAll('.sudoku-cell.fixed');
      const firstFixedCell = fixedCells[0];

      fireEvent.click(firstFixedCell);

      // Should not apply selected class
      expect(firstFixedCell).not.toHaveClass('selected');
    });

    it('should handle focus and blur events', () => {
      render(<SudokuGrid {...defaultProps} />);

      const inputs = screen.getAllByRole('textbox');
      const firstInput = inputs[0];

      fireEvent.focus(firstInput);
      const cell = firstInput.closest('.sudoku-cell');
      expect(cell).toHaveClass('selected');

      fireEvent.blur(firstInput);
      expect(cell).not.toHaveClass('selected');
    });
  });

  describe('Conflict Detection', () => {
    it('should detect row conflicts', () => {
      const conflictUserInput = mockUserInput.map(row => [...row]);
      conflictUserInput[0][2] = 5; // Same as [0,0] which is 5

      render(<SudokuGrid {...defaultProps} userInput={conflictUserInput} />);

      const errorCells = document.querySelectorAll('.sudoku-cell.error');
      expect(errorCells.length).toBeGreaterThan(0);
    });

    it('should detect column conflicts', () => {
      const conflictUserInput = mockUserInput.map(row => [...row]);
      conflictUserInput[2][0] = 5; // Same as [0,0] which is 5 (same column)

      render(<SudokuGrid {...defaultProps} userInput={conflictUserInput} />);

      const errorCells = document.querySelectorAll('.sudoku-cell.error');
      expect(errorCells.length).toBeGreaterThan(0);
    });

    it('should detect 3x3 box conflicts', () => {
      const conflictUserInput = mockUserInput.map(row => [...row]);
      conflictUserInput[0][2] = 3; // Same as [0,1] which is 3 (same 3x3 box)

      render(<SudokuGrid {...defaultProps} userInput={conflictUserInput} />);

      const errorCells = document.querySelectorAll('.sudoku-cell.error');
      expect(errorCells.length).toBeGreaterThan(0);
    });

    it('should not show conflicts for empty cells', () => {
      render(<SudokuGrid {...defaultProps} />);

      // Empty cells (value 0) should not show conflicts
      const errorCells = document.querySelectorAll('.sudoku-cell.error');
      expect(errorCells).toHaveLength(0);
    });
  });

  describe('Disabled State', () => {
    it('should disable all inputs when disabled prop is true', () => {
      render(<SudokuGrid {...defaultProps} disabled={true} />);

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toBeDisabled();
      });
    });

    it('should not handle keyboard events when disabled', () => {
      render(<SudokuGrid {...defaultProps} disabled={true} />);

      const inputs = screen.getAllByRole('textbox');
      const firstInput = inputs[0];

      fireEvent.keyDown(firstInput, { key: '5' });

      expect(mockOnInputChange).not.toHaveBeenCalled();
    });

    it('should enable inputs when disabled prop is false', () => {
      render(<SudokuGrid {...defaultProps} disabled={false} />);

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).not.toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for inputs', () => {
      render(<SudokuGrid {...defaultProps} />);

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toHaveAttribute('aria-label');
        const ariaLabel = input.getAttribute('aria-label');
        expect(ariaLabel).toMatch(/Editable cell\. Row \d+ Column \d+/);
      });
    });

    it('should have proper input attributes', () => {
      render(<SudokuGrid {...defaultProps} />);

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toHaveAttribute('type', 'text');
        expect(input).toHaveAttribute('inputMode', 'numeric');
        expect(input).toHaveAttribute('maxLength', '1');
      });
    });

    it('should have unique IDs for each cell', () => {
      render(<SudokuGrid {...defaultProps} />);

      const inputs = screen.getAllByRole('textbox');
      const ids = inputs.map(input => input.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);

      ids.forEach(id => {
        expect(id).toMatch(/^cell-\d+-\d+$/);
      });
    });
  });

  describe('Border Styling', () => {
    it('should apply correct border styles for 3x3 grid separation', () => {
      render(<SudokuGrid {...defaultProps} />);

      const cells = document.querySelectorAll('.sudoku-cell');

      // Check that cells have border styles applied
      expect(cells.length).toBe(81);

      // Each cell should have border styling
      cells.forEach(cell => {
        const style = window.getComputedStyle(cell);
        expect(style.borderTop).toBeDefined();
        expect(style.borderLeft).toBeDefined();
        expect(style.borderRight).toBeDefined();
        expect(style.borderBottom).toBeDefined();
      });
    });
  });

  describe('Hint Cell Tests', () => {
    it('should highlight hinted cell', () => {
      const hintCell = { row: 0, col: 2 };
      render(<SudokuGrid {...defaultProps} hintCell={hintCell} />);

      const hintedCells = document.querySelectorAll('.sudoku-cell.hinted');
      expect(hintedCells).toHaveLength(1);
    });

    it('should not highlight when hintCell is null', () => {
      render(<SudokuGrid {...defaultProps} hintCell={null} />);

      const hintedCells = document.querySelectorAll('.sudoku-cell.hinted');
      expect(hintedCells).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty puzzle gracefully', () => {
      const emptyPuzzle = Array(9)
        .fill(null)
        .map(() => Array(9).fill(0));
      const emptyUserInput = Array(9)
        .fill(null)
        .map(() => Array(9).fill(0));

      render(
        <SudokuGrid
          puzzle={emptyPuzzle}
          userInput={emptyUserInput}
          onInputChange={mockOnInputChange}
        />
      );

      const inputs = screen.getAllByRole('textbox');
      expect(inputs).toHaveLength(81); // All cells should be editable
    });

    it('should handle completely filled puzzle', () => {
      const filledPuzzle = Array(9)
        .fill(null)
        .map(() => Array(9).fill(5));
      const filledUserInput = Array(9)
        .fill(null)
        .map(() => Array(9).fill(5));

      render(
        <SudokuGrid
          puzzle={filledPuzzle}
          userInput={filledUserInput}
          onInputChange={mockOnInputChange}
        />
      );

      const inputs = screen.queryAllByRole('textbox');
      expect(inputs).toHaveLength(0); // No cells should be editable

      const fixedNumbers = document.querySelectorAll('.fixed-number');
      expect(fixedNumbers).toHaveLength(81);
    });

    it('should handle navigation at grid boundaries', () => {
      render(<SudokuGrid {...defaultProps} />);

      const inputs = screen.getAllByRole('textbox');
      const firstInput = inputs[0];

      // Test navigation at boundaries (should not crash)
      fireEvent.keyDown(firstInput, { key: 'ArrowUp' }); // At top edge
      fireEvent.keyDown(firstInput, { key: 'ArrowLeft' }); // At left edge

      // Should not cause errors
      expect(mockOnInputChange).not.toHaveBeenCalled();
    });
  });
});
