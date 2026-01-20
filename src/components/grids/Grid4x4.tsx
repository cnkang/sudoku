/**
 * 4x4 Grid Component - Optimized for children and beginners
 * Implements Requirements 1.2, 2.1, 2.2 for child-friendly 4x4 Sudoku
 */

import React, { memo, useCallback, useMemo } from 'react';
import type { GridConfig } from '@/types';
import { usePerformanceTracking } from '@/utils/performance-monitoring';
import styles from '../SudokuGrid.module.css';

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
    gridConfig,
    puzzle,
    userInput,
    onInputChange,
    disabled = false,
    hintCell = null,
    childMode = true, // Default to child mode for 4x4
    accessibility = {},
  }) => {
    'use memo'; // React Compiler directive

    const { trackRender } = usePerformanceTracking('Grid4x4');
    const gridSize = 4;

    // Memoize grid configuration for 4x4
    const _grid4x4Config = useMemo(
      () => ({
        ...gridConfig,
        size: 4 as const,
        boxRows: 2,
        boxCols: 2,
        maxValue: 4,
        cellSize: {
          desktop: 80,
          tablet: 70,
          mobile: 60,
        },
        childFriendly: {
          enableAnimations: true,
          showHelpText: true,
          useExtraLargeTargets: true,
        },
      }),
      [gridConfig]
    );

    // Memoize accessibility settings
    const accessibilitySettings = useMemo(
      () => ({
        highContrast: false,
        reducedMotion: false,
        largeText: true, // Default to large text for 4x4
        ...accessibility,
      }),
      [accessibility]
    );

    // Track render performance
    React.useEffect(() => {
      const renderTime = performance.now();
      trackRender(renderTime, true); // Assume optimized due to memoization
    });

    const handleCellChange = useCallback(
      (row: number, col: number, value: string) => {
        const parsed = Number.parseInt(value, 10);
        if (Number.isNaN(parsed)) {
          onInputChange(row, col, 0);
          return;
        }

        if (parsed < 0 || parsed > gridSize) {
          return;
        }

        onInputChange(row, col, parsed);
      },
      [onInputChange]
    );

    const getCellClassName = useCallback(
      (isFixed: boolean, isHinted: boolean) =>
        [
          styles.sudokuCell,
          isFixed ? styles.fixedCell : styles.editableCell,
          isHinted ? styles.hinted : '',
          childMode ? styles.childFriendlyCell : '',
          accessibilitySettings.highContrast ? styles.highContrast : '',
          accessibilitySettings.largeText ? styles.largeText : '',
        ]
          .filter(Boolean)
          .join(' '),
      [
        childMode,
        accessibilitySettings.highContrast,
        accessibilitySettings.largeText,
      ]
    );

    const renderCell = useCallback(
      (row: number, col: number) => {
        const puzzleValue = puzzle[row]?.[col] || 0;
        const userValue = userInput[row]?.[col] || 0;
        const isFixed = puzzleValue !== 0;
        const isHinted = hintCell?.row === row && hintCell?.col === col;
        const cellClasses = getCellClassName(isFixed, isHinted);

        return (
          <td
            key={`${row}-${col}`}
            className={cellClasses}
            data-row={row}
            data-col={col}
            data-grid-size="4"
          >
            {isFixed ? (
              <div className={styles.fixedNumber}>{puzzleValue}</div>
            ) : (
              <input
                type="number"
                min="1"
                max="4"
                value={userValue || ''}
                onChange={event =>
                  handleCellChange(row, col, event.target.value)
                }
                disabled={disabled}
                className={styles.cellInput}
                aria-label={`Row ${row + 1}, Column ${col + 1}`}
                aria-describedby={isHinted ? 'hint-message' : undefined}
              />
            )}
          </td>
        );
      },
      [
        puzzle,
        userInput,
        hintCell,
        disabled,
        getCellClassName,
        handleCellChange,
      ]
    );

    const renderRow = useCallback(
      (row: number) => (
        <tr key={row} className={styles.sudokuRow}>
          {Array.from({ length: gridSize }, (_, col) => renderCell(row, col))}
        </tr>
      ),
      [renderCell]
    );

    const renderGrid = useMemo(
      () => Array.from({ length: gridSize }, (_, row) => renderRow(row)),
      [renderRow]
    );

    return (
      <div
        className={`${styles.sudokuContainer} sudoku-container-query`}
        data-grid-size="4"
        data-child-mode={childMode}
        data-high-contrast={accessibilitySettings.highContrast}
      >
        <table
          className={`${styles.sudokuGrid} sudoku-grid-4x4`}
          data-grid-size="4"
          aria-label="4x4 Sudoku Grid - Beginner Level"
        >
          <tbody>{renderGrid}</tbody>
        </table>

        {childMode && (
          <div className={styles.childFriendlyHints}>
            <p>🌟 Use numbers 1, 2, 3, and 4!</p>
            <p>🎯 Each row, column, and 2×2 box needs all four numbers!</p>
          </div>
        )}
      </div>
    );
  }
);

Grid4x4.displayName = 'Grid4x4';

export default Grid4x4;
