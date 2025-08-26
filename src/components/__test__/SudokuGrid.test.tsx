import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SudokuGrid from '../SudokuGrid';

describe('SudokuGrid', () => {
  it('renders the Sudoku grid correctly', () => {
    const puzzle = [
      [5, 3, 0, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ];

    // Initialize userInput with zeros for empty cells
    const userInput = puzzle.map(row =>
      row.map(value => (value === 0 ? 0 : value))
    );

    const mockOnInputChange = vi.fn();

    const { getAllByRole } = render(
      <SudokuGrid
        puzzle={puzzle}
        userInput={userInput}
        onInputChange={mockOnInputChange}
      />
    );

    const inputs = getAllByRole('textbox'); // Find all text inputs (changed from spinbutton)

    // Simulate input change in the first empty cell (which is at position 0,2)
    fireEvent.change(inputs[0], { target: { value: '4' } });
    expect(mockOnInputChange).toHaveBeenCalledWith(0, 2, 4);
  });
});
