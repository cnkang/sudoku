/**
 * 9x9 Grid Component - Traditional Sudoku with full complexity
 * Implements Requirements 1.2, 7.1, 7.2 for standard 9x9 Sudoku
 */

import { memo, useCallback } from 'react';
import type { GridConfig } from '@/types';
import SharedSudokuGrid from './SharedSudokuGrid';

interface Grid9x9Props {
  gridConfig: GridConfig;
  puzzle: number[][];
  userInput: number[][];
  onInputChange: (row: number, col: number, value: number) => void;
  disabled?: boolean;
  hintCell?: { row: number; col: number } | null;
  childMode?: boolean;
  accessibility?: {
    highContrast?: boolean;
    reducedMotion?: boolean;
    largeText?: boolean;
  };
}

const hasRowConflict = (
  userInput: number[][],
  row: number,
  col: number,
  value: number
) => {
  for (let c = 0; c < 9; c++) {
    if (c !== col && userInput[row]?.[c] === value) return true;
  }
  return false;
};

const hasColumnConflict = (
  userInput: number[][],
  row: number,
  col: number,
  value: number
) => {
  for (let r = 0; r < 9; r++) {
    if (r !== row && userInput[r]?.[col] === value) return true;
  }
  return false;
};

const hasBoxConflict = (
  userInput: number[][],
  row: number,
  col: number,
  value: number
) => {
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if ((r !== row || c !== col) && userInput[r]?.[c] === value) return true;
    }
  }
  return false;
};

export const Grid9x9 = memo<Grid9x9Props>(
  ({
    gridConfig: _gridConfig,
    puzzle,
    userInput,
    onInputChange,
    disabled = false,
    hintCell = null,
    childMode = false,
    accessibility = {},
  }) => {
    const hasConflict = useCallback(
      (row: number, col: number, value: number) => {
        if (value === 0) return false;
        return (
          hasRowConflict(userInput, row, col, value) ||
          hasColumnConflict(userInput, row, col, value) ||
          hasBoxConflict(userInput, row, col, value)
        );
      },
      [userInput]
    );

    const getSubGridBorders = useCallback(
      (row: number, col: number) => ({
        borderRight:
          col === 2 || col === 5 || col === 8
            ? '3px solid #1f2937'
            : '1px solid #d1d5db',
        borderBottom:
          row === 2 || row === 5 || row === 8
            ? '3px solid #1f2937'
            : '1px solid #d1d5db',
      }),
      []
    );

    return (
      <SharedSudokuGrid
        gridSize={9}
        maxValue={9}
        ariaLabel="9x9 Sudoku Grid - Expert Level"
        performanceLabel="Grid9x9"
        tableClassName="sudoku-grid-9x9"
        puzzle={puzzle}
        userInput={userInput}
        onInputChange={onInputChange}
        disabled={disabled}
        hintCell={hintCell}
        childMode={childMode}
        accessibility={accessibility}
        accessibilityDefaults={{
          highContrast: false,
          reducedMotion: false,
          largeText: false,
        }}
        hasConflict={hasConflict}
        getSubGridBorders={getSubGridBorders}
        childHints={[
          '🌟 Use numbers 1 through 9!',
          '🎯 Each row, column, and 3×3 box needs all nine numbers!',
          '💡 Look for the thick borders - they show the 3×3 boxes!',
          '🧠 This is the classic Sudoku challenge!',
        ]}
        useAriaInvalid={true}
      />
    );
  }
);

Grid9x9.displayName = 'Grid9x9';

export default Grid9x9;
