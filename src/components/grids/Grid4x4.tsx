/**
 * 4x4 Grid Component - Optimized for children and beginners
 * Implements Requirements 1.2, 2.1, 2.2 for child-friendly 4x4 Sudoku
 */

import { memo } from 'react';
import type { GridConfig } from '@/types';
import SharedSudokuGrid from './SharedSudokuGrid';

interface Grid4x4Props {
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

export const Grid4x4 = memo<Grid4x4Props>(
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
    return (
      <SharedSudokuGrid
        gridSize={4}
        maxValue={4}
        ariaLabel="4x4 Sudoku Grid - Beginner Level"
        performanceLabel="Grid4x4"
        tableClassName="sudoku-grid-4x4"
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
          largeText: true,
        }}
        childHints={[
          '🌟 Use numbers 1, 2, 3, and 4!',
          '🎯 Each row, column, and 2×2 box needs all four numbers!',
        ]}
      />
    );
  }
);

Grid4x4.displayName = 'Grid4x4';

export default Grid4x4;
