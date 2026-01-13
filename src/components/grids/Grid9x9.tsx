/**
 * 9x9 Grid Component - Traditional Sudoku with full complexity
 * Implements Requirements 1.2, 7.1, 7.2 for standard 9x9 Sudoku
 */

import React, { memo, useMemo } from 'react';
import type { GridConfig } from '@/types';
import { usePerformanceTracking } from '@/utils/performance-monitoring';
import styles from '../SudokuGrid.module.css';

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

export const Grid9x9 = memo<Grid9x9Props>(
  ({
    gridConfig,
    puzzle,
    userInput,
    onInputChange,
    disabled = false,
    hintCell = null,
    childMode = false, // Default to adult mode for 9x9
    accessibility = {},
  }) => {
    'use memo'; // React Compiler directive

    const { trackRender } = usePerformanceTracking('Grid9x9');

    // Memoize grid configuration for 9x9
    const _grid9x9Config = useMemo(
      () => ({
        ...gridConfig,
        size: 9 as const,
        boxRows: 3,
        boxCols: 3,
        maxValue: 9,
        cellSize: {
          desktop: 45,
          tablet: 40,
          mobile: 35,
        },
        childFriendly: {
          enableAnimations: false,
          showHelpText: false,
          useExtraLargeTargets: false,
        },
      }),
      [gridConfig]
    );

    // Memoize accessibility settings
    const accessibilitySettings = useMemo(
      () => ({
        highContrast: false,
        reducedMotion: false,
        largeText: false,
        ...accessibility,
      }),
      [accessibility]
    );

    // Track render performance
    React.useEffect(() => {
      const renderTime = performance.now();
      trackRender(renderTime, true); // Assume optimized due to memoization
    });

    // Calculate sub-grid borders for 3x3 layout
    const getSubGridBorders = useMemo(
      () => (row: number, col: number) => {
        const isRightBorder = col === 2 || col === 5 || col === 8; // After columns 2, 5, and 8
        const isBottomBorder = row === 2 || row === 5 || row === 8; // After rows 2, 5, and 8

        return {
          borderRight: isRightBorder
            ? '3px solid #1f2937'
            : '1px solid #d1d5db',
          borderBottom: isBottomBorder
            ? '3px solid #1f2937'
            : '1px solid #d1d5db',
        };
      },
      []
    );

    // Memoize conflict detection for performance
    const hasConflict = useMemo(
      () =>
        // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: conflict detection is complex
        (row: number, col: number, value: number): boolean => {
          if (value === 0) return false;

          // Check row conflicts
          for (let c = 0; c < 9; c++) {
            if (c !== col && userInput[row]?.[c] === value) return true;
          }

          // Check column conflicts
          for (let r = 0; r < 9; r++) {
            if (r !== row && userInput[r]?.[col] === value) return true;
          }

          // Check 3x3 box conflicts
          const boxRow = Math.floor(row / 3) * 3;
          const boxCol = Math.floor(col / 3) * 3;
          for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
              if ((r !== row || c !== col) && userInput[r]?.[c] === value)
                return true;
            }
          }

          return false;
        },
      [userInput]
    );

    // Render 9x9 grid with 3x3 sub-grids
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: grid rendering is complex
    const renderGrid = useMemo(() => {
      const grid = [];

      for (let row = 0; row < 9; row++) {
        const rowCells = [];

        for (let col = 0; col < 9; col++) {
          const puzzleValue = puzzle[row]?.[col] || 0;
          const userValue = userInput[row]?.[col] || 0;
          const isFixed = puzzleValue !== 0;
          const isHinted = hintCell?.row === row && hintCell?.col === col;
          const hasError = userValue > 0 && hasConflict(row, col, userValue);
          const subGridBorders = getSubGridBorders(row, col);

          // Cell classes for 9x9 grid
          const cellClasses = [
            styles.sudokuCell,
            isFixed ? styles.fixedCell : styles.editableCell,
            isHinted ? styles.hinted : '',
            hasError ? styles.error : '',
            childMode ? styles.childFriendlyCell : '',
            accessibilitySettings.highContrast ? styles.highContrast : '',
            accessibilitySettings.largeText ? styles.largeText : '',
          ]
            .filter(Boolean)
            .join(' ');

          rowCells.push(
            <td
              key={`${row}-${col}`}
              className={cellClasses}
              data-row={row}
              data-col={col}
              data-grid-size="9"
              style={subGridBorders}
            >
              {isFixed ? (
                <div className={styles.fixedNumber}>{puzzleValue}</div>
              ) : (
                <input
                  type="number"
                  min="1"
                  max="9"
                  value={userValue || ''}
                  onChange={e => {
                    const value = parseInt(e.target.value, 10) || 0;
                    if (value >= 0 && value <= 9) {
                      onInputChange(row, col, value);
                    }
                  }}
                  disabled={disabled}
                  className={styles.cellInput}
                  aria-label={`Row ${row + 1}, Column ${col + 1}`}
                  aria-describedby={isHinted ? 'hint-message' : undefined}
                  aria-invalid={hasError}
                />
              )}
            </td>
          );
        }

        grid.push(
          <tr key={row} className={styles.sudokuRow}>
            {rowCells}
          </tr>
        );
      }

      return grid;
    }, [
      puzzle,
      userInput,
      onInputChange,
      disabled,
      hintCell,
      childMode,
      accessibilitySettings,
      getSubGridBorders,
      hasConflict,
    ]);

    return (
      <div
        className={`${styles.sudokuContainer} sudoku-container-query`}
        data-grid-size="9"
        data-child-mode={childMode}
        data-high-contrast={accessibilitySettings.highContrast}
      >
        <table
          className={`${styles.sudokuGrid} sudoku-grid-9x9`}
          data-grid-size="9"
          aria-label="9x9 Sudoku Grid - Expert Level"
        >
          <tbody>{renderGrid}</tbody>
        </table>

        {childMode && (
          <div className={styles.childFriendlyHints}>
            <p>🌟 Use numbers 1 through 9!</p>
            <p>🎯 Each row, column, and 3×3 box needs all nine numbers!</p>
            <p>💡 Look for the thick borders - they show the 3×3 boxes!</p>
            <p>🧠 This is the classic Sudoku challenge!</p>
          </div>
        )}
      </div>
    );
  }
);

Grid9x9.displayName = 'Grid9x9';

export default Grid9x9;
