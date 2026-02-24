import React, { memo, useCallback, useMemo } from 'react';
import { usePerformanceTracking } from '@/utils/performance-monitoring';
import styles from '../SudokuGrid.module.css';

type AccessibilityOptions = {
  highContrast?: boolean;
  reducedMotion?: boolean;
  largeText?: boolean;
};

type AccessibilityDefaults = {
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
};

export interface SharedSudokuGridProps {
  gridSize: 4 | 6 | 9;
  maxValue: number;
  ariaLabel: string;
  performanceLabel: string;
  tableClassName: string;
  puzzle: number[][];
  userInput: number[][];
  onInputChange: (row: number, col: number, value: number) => void;
  disabled?: boolean;
  hintCell?: { row: number; col: number } | null;
  childMode?: boolean;
  accessibility?: AccessibilityOptions;
  accessibilityDefaults: AccessibilityDefaults;
  getSubGridBorders?: (row: number, col: number) => React.CSSProperties;
  hasConflict?: (row: number, col: number, value: number) => boolean;
  childHints?: string[];
  useAriaInvalid?: boolean;
}

const SharedSudokuGrid = memo<SharedSudokuGridProps>(
  ({
    gridSize,
    maxValue,
    ariaLabel,
    performanceLabel,
    tableClassName,
    puzzle,
    userInput,
    onInputChange,
    disabled = false,
    hintCell = null,
    childMode = false,
    accessibility = {},
    accessibilityDefaults,
    getSubGridBorders,
    hasConflict,
    childHints = [],
    useAriaInvalid = false,
  }) => {
    'use memo';

    const { trackRender } = usePerformanceTracking(performanceLabel);

    const accessibilitySettings = useMemo(
      () => ({
        ...accessibilityDefaults,
        ...accessibility,
      }),
      [accessibility, accessibilityDefaults]
    );

    // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run once on mount
    React.useEffect(() => {
      const renderTime = performance.now();
      trackRender(renderTime, true);
    }, []);

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
      [gridSize, onInputChange]
    );

    const getCellClassName = useCallback(
      (isFixed: boolean, isHinted: boolean, hasError: boolean) =>
        [
          styles.sudokuCell,
          isFixed ? styles.fixedCell : styles.editableCell,
          isHinted ? styles.hinted : '',
          hasError ? styles.error : '',
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
      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: cell rendering logic requires complexity
      (row: number, col: number) => {
        const puzzleValue = puzzle[row]?.[col] || 0;
        const userValue = userInput[row]?.[col] || 0;
        const isFixed = puzzleValue !== 0;
        const isHinted = hintCell?.row === row && hintCell?.col === col;
        const hasError =
          !isFixed &&
          userValue > 0 &&
          (hasConflict ? hasConflict(row, col, userValue) : false);
        const cellClasses = getCellClassName(isFixed, isHinted, hasError);
        const subGridBorders = getSubGridBorders?.(row, col);

        return (
          <td
            key={`${row}-${col}`}
            className={cellClasses}
            data-testid={`cell-${row}-${col}`}
            data-row={row}
            data-col={col}
            data-grid-size={String(gridSize)}
            style={subGridBorders}
          >
            {isFixed ? (
              <div className={styles.fixedNumber}>{puzzleValue}</div>
            ) : (
              <input
                type="number"
                min="1"
                max={String(maxValue)}
                value={userValue || ''}
                onChange={event =>
                  handleCellChange(row, col, event.target.value)
                }
                disabled={disabled}
                className={styles.cellInput}
                aria-label={`Row ${row + 1}, Column ${col + 1}`}
                aria-describedby={isHinted ? 'hint-message' : undefined}
                aria-invalid={useAriaInvalid && hasError ? true : undefined}
              />
            )}
          </td>
        );
      },
      [
        disabled,
        getCellClassName,
        getSubGridBorders,
        gridSize,
        handleCellChange,
        hasConflict,
        hintCell,
        maxValue,
        puzzle,
        useAriaInvalid,
        userInput,
      ]
    );

    const renderRow = useCallback(
      (row: number) => (
        <tr key={row} className={styles.sudokuRow}>
          {Array.from({ length: gridSize }, (_, col) => renderCell(row, col))}
        </tr>
      ),
      [gridSize, renderCell]
    );

    const renderGrid = useMemo(
      () => Array.from({ length: gridSize }, (_, row) => renderRow(row)),
      [gridSize, renderRow]
    );

    return (
      <div
        className={`${styles.sudokuContainer} sudoku-container-query`}
        data-grid-size={String(gridSize)}
        data-child-mode={childMode}
        data-high-contrast={accessibilitySettings.highContrast}
      >
        <table
          className={`${styles.sudokuGrid} ${tableClassName}`}
          data-grid-size={String(gridSize)}
          aria-label={ariaLabel}
        >
          <tbody>{renderGrid}</tbody>
        </table>

        {childMode && childHints.length > 0 && (
          <div className={styles.childFriendlyHints}>
            {childHints.map(hint => (
              <p key={hint}>{hint}</p>
            ))}
          </div>
        )}
      </div>
    );
  }
);

SharedSudokuGrid.displayName = 'SharedSudokuGrid';

export default SharedSudokuGrid;
