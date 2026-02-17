/**
 * 6x6 Grid Component - Intermediate level for learning progression
 * Implements Requirements 1.2, 3.1, 3.2 for 6x6 Sudoku with 2x3 sub-grids
 */

import { memo, useCallback } from 'react';
import type { GridConfig } from '@/types';
import SharedSudokuGrid from './SharedSudokuGrid';

interface Grid6x6Props {
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

export const Grid6x6 = memo<Grid6x6Props>(
  ({
    gridConfig: _gridConfig,
    puzzle,
    userInput,
    onInputChange,
    disabled = false,
    hintCell = null,
    childMode = true,
    accessibility = {},
  }) => {
    const getSubGridBorders = useCallback(
      (row: number, col: number) => ({
        borderRight:
          col === 2 || col === 5 ? '3px solid #1f2937' : '1px solid #d1d5db',
        borderBottom:
          row === 1 || row === 3 || row === 5
            ? '3px solid #1f2937'
            : '1px solid #d1d5db',
      }),
      []
    );

    return (
      <SharedSudokuGrid
        gridSize={6}
        maxValue={6}
        ariaLabel="6x6 Sudoku Grid - Intermediate Level"
        performanceLabel="Grid6x6"
        tableClassName="sudoku-grid-6x6"
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
        getSubGridBorders={getSubGridBorders}
        childHints={[
          '🌟 Use numbers 1, 2, 3, 4, 5, and 6!',
          '🎯 Each row, column, and 2×3 rectangle needs all six numbers!',
          '💡 Look for the thick borders - they show the 2×3 rectangles!',
        ]}
      />
    );
  }
);

Grid6x6.displayName = 'Grid6x6';

export default Grid6x6;
