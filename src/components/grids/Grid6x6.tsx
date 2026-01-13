/**
 * 6x6 Grid Component - Intermediate level for learning progression
 * Implements Requirements 1.2, 3.1, 3.2 for 6x6 Sudoku with 2x3 sub-grids
 */

import React, { memo, useMemo } from "react";
import type { GridConfig } from "@/types";
import { usePerformanceTracking } from "@/utils/performance-monitoring";
import styles from "../SudokuGrid.module.css";

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
    gridConfig,
    puzzle,
    userInput,
    onInputChange,
    disabled = false,
    hintCell = null,
    childMode = true, // Default to child mode for 6x6
    accessibility = {},
  }) => {
    "use memo"; // React Compiler directive

    const { trackRender } = usePerformanceTracking("Grid6x6");

    // Memoize grid configuration for 6x6
    const _grid6x6Config = useMemo(
      () => ({
        ...gridConfig,
        size: 6 as const,
        boxRows: 2,
        boxCols: 3,
        maxValue: 6,
        cellSize: {
          desktop: 65,
          tablet: 55,
          mobile: 45,
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

    // Calculate sub-grid borders for 2x3 layout
    const getSubGridBorders = useMemo(
      () => (row: number, col: number) => {
        const isRightBorder = col === 2 || col === 5; // After columns 2 and 5
        const isBottomBorder = row === 1 || row === 3 || row === 5; // After rows 1, 3, and 5

        return {
          borderRight: isRightBorder
            ? "3px solid #1f2937"
            : "1px solid #d1d5db",
          borderBottom: isBottomBorder
            ? "3px solid #1f2937"
            : "1px solid #d1d5db",
        };
      },
      []
    );

    // Render 6x6 grid with 2x3 sub-grids
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: grid rendering is complex
    const renderGrid = useMemo(() => {
      const grid = [];

      for (let row = 0; row < 6; row++) {
        const rowCells = [];

        for (let col = 0; col < 6; col++) {
          const puzzleValue = puzzle[row]?.[col] || 0;
          const userValue = userInput[row]?.[col] || 0;
          const isFixed = puzzleValue !== 0;
          const isHinted = hintCell?.row === row && hintCell?.col === col;
          const subGridBorders = getSubGridBorders(row, col);

          // Cell classes for 6x6 grid
          const cellClasses = [
            styles.sudokuCell,
            isFixed ? styles.fixedCell : styles.editableCell,
            isHinted ? styles.hinted : "",
            childMode ? styles.childFriendlyCell : "",
            accessibilitySettings.highContrast ? styles.highContrast : "",
            accessibilitySettings.largeText ? styles.largeText : "",
          ]
            .filter(Boolean)
            .join(" ");

          rowCells.push(
            <td
              key={`${row}-${col}`}
              className={cellClasses}
              data-row={row}
              data-col={col}
              data-grid-size="6"
              style={subGridBorders}
            >
              {isFixed ? (
                <div className={styles.fixedNumber}>{puzzleValue}</div>
              ) : (
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={userValue || ""}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10) || 0;
                    if (value >= 0 && value <= 6) {
                      onInputChange(row, col, value);
                    }
                  }}
                  disabled={disabled}
                  className={styles.cellInput}
                  aria-label={`Row ${row + 1}, Column ${col + 1}`}
                  aria-describedby={isHinted ? "hint-message" : undefined}
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
    ]);

    return (
      <div
        className={`${styles.sudokuContainer} sudoku-container-query`}
        data-grid-size="6"
        data-child-mode={childMode}
        data-high-contrast={accessibilitySettings.highContrast}
      >
        <table
          className={`${styles.sudokuGrid} sudoku-grid-6x6`}
          data-grid-size="6"
          aria-label="6x6 Sudoku Grid - Intermediate Level"
        >
          <tbody>{renderGrid}</tbody>
        </table>

        {childMode && (
          <div className={styles.childFriendlyHints}>
            <p>🌟 Use numbers 1, 2, 3, 4, 5, and 6!</p>
            <p>🎯 Each row, column, and 2×3 rectangle needs all six numbers!</p>
            <p>💡 Look for the thick borders - they show the 2×3 rectangles!</p>
          </div>
        )}
      </div>
    );
  }
);

Grid6x6.displayName = "Grid6x6";

export default Grid6x6;
