import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SudokuGrid from '../SudokuGrid';

describe('SudokuGrid - Hint Feature', () => {
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

  const mockUserInput = mockPuzzle.map(row => [...row]);
  const mockOnInputChange = vi.fn();

  it('should highlight hinted cell', () => {
    const hintCell = { row: 0, col: 2 };

    render(
      <SudokuGrid
        puzzle={mockPuzzle}
        userInput={mockUserInput}
        onInputChange={mockOnInputChange}
        hintCell={hintCell}
      />
    );

    const hintedCell = document.getElementById('cell-0-2');
    expect(hintedCell?.closest('td')).toHaveClass('hinted');
  });

  it('should not highlight any cell when no hint is provided', () => {
    render(
      <SudokuGrid
        puzzle={mockPuzzle}
        userInput={mockUserInput}
        onInputChange={mockOnInputChange}
        hintCell={null}
      />
    );

    const cells = document.querySelectorAll('.hinted');
    expect(cells).toHaveLength(0);
  });

  it('should apply hinted class along with other classes', () => {
    const hintCell = { row: 0, col: 2 };

    render(
      <SudokuGrid
        puzzle={mockPuzzle}
        userInput={mockUserInput}
        onInputChange={mockOnInputChange}
        hintCell={hintCell}
      />
    );

    const hintedCell = document.getElementById('cell-0-2');
    const cellElement = hintedCell?.closest('td');
    expect(cellElement).toHaveClass('sudoku-cell');
    expect(cellElement).toHaveClass('editable');
    expect(cellElement).toHaveClass('hinted');
  });
});
