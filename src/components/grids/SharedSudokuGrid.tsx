import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePerformanceTracking } from '@/utils/performance-monitoring';
import { GRID_CONFIGS, validateMove } from '@/utils/gridConfig';
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
  selectedCell?: { row: number; col: number } | null;
  onSelectionChange?: (cell: { row: number; col: number } | null) => void;
}

type Cell = { row: number; col: number };

const boxDimensions = (gridSize: 4 | 6 | 9): { rows: number; cols: number } => {
  if (gridSize === 4) return { rows: 2, cols: 2 };
  if (gridSize === 6) return { rows: 2, cols: 3 };
  return { rows: 3, cols: 3 };
};

const SharedSudokuGrid = memo<SharedSudokuGridProps>(
  ({
    gridSize,
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
    useAriaInvalid = true,
    selectedCell: selectedCellProp = null,
    onSelectionChange,
  }) => {
    'use memo';

    const { trackRender } = usePerformanceTracking(performanceLabel);
    const tableRef = useRef<HTMLTableElement>(null);

    const accessibilitySettings = useMemo(
      () => ({ ...accessibilityDefaults, ...accessibility }),
      [accessibility, accessibilityDefaults],
    );

    const [selectedCellInternal, setSelectedCellInternal] = useState<Cell | null>(null);
    const selectedCell = selectedCellProp ?? selectedCellInternal;
    const setSelectedCell = useCallback(
      (cell: Cell | null) => {
        if (onSelectionChange) onSelectionChange(cell);
        else setSelectedCellInternal(cell);
      },
      [onSelectionChange],
    );

    // Coarse-pointer detection is client-only (SSR-safe).
    const [coarsePointer, setCoarsePointer] = useState(false);
    useEffect(() => {
      const media = window.matchMedia?.('(pointer: coarse)');
      if (!media) return undefined;
      const update = () => setCoarsePointer(media.matches);
      update();
      media.addEventListener?.('change', update);
      return () => media.removeEventListener?.('change', update);
    }, []);

    const { rows: boxRows, cols: boxCols } = boxDimensions(gridSize);

    const isRelated = useCallback(
      (row: number, col: number): boolean => {
        if (!selectedCell) return false;
        if (row === selectedCell.row || col === selectedCell.col) return true;
        return (
          Math.floor(row / boxRows) === Math.floor(selectedCell.row / boxRows) &&
          Math.floor(col / boxCols) === Math.floor(selectedCell.col / boxCols)
        );
      },
      [boxCols, boxRows, selectedCell],
    );

    const isSameValue = useCallback(
      (value: number): boolean => {
        if (!selectedCell || value === 0) return false;
        return (userInput[selectedCell.row]?.[selectedCell.col] ?? 0) === value;
      },
      [selectedCell, userInput],
    );

    const findNextEmpty = useCallback(
      (fromRow: number, fromCol: number): Cell | null => {
        const start = fromRow * gridSize + fromCol + 1;
        for (let offset = 0; offset < gridSize * gridSize; offset++) {
          const position = (start + offset) % (gridSize * gridSize);
          const row = Math.floor(position / gridSize);
          const col = position % gridSize;
          if (puzzle[row]?.[col] === 0 && (userInput[row]?.[col] ?? 0) === 0) {
            return { row, col };
          }
        }
        return null;
      },
      [gridSize, puzzle, userInput],
    );

    const focusCell = useCallback((row: number, col: number) => {
      const input = tableRef.current?.querySelector<HTMLInputElement>(
        `td[data-row="${row}"][data-col="${col}"] input`,
      );
      input?.focus();
    }, []);

    const handleCellInput = useCallback(
      (row: number, col: number, value: string) => {
        const parsed = value.trim() === '' ? 0 : Number(value);
        if (!Number.isInteger(parsed) || parsed < 0 || parsed > gridSize) return;

        onInputChange(row, col, parsed);

        if (parsed !== 0 && (userInput[row]?.[col] ?? 0) !== parsed) {
          const next = findNextEmpty(row, col);
          if (next) {
            setSelectedCell(next);
            requestAnimationFrame(() => focusCell(next.row, next.col));
          } else {
            setSelectedCell({ row, col });
          }
        }
      },
      [findNextEmpty, focusCell, gridSize, onInputChange, setSelectedCell, userInput],
    );

    const handleCellKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
        const offsets: Record<string, number> = {
          ArrowLeft: -1,
          ArrowRight: 1,
          ArrowUp: -gridSize,
          ArrowDown: gridSize,
        };
        const step = offsets[event.key];
        if (step === undefined) return;
        event.preventDefault();
        let position = row * gridSize + col;
        for (let attempt = 0; attempt < gridSize * gridSize; attempt++) {
          position = (position + step + gridSize * gridSize) % (gridSize * gridSize);
          const targetRow = Math.floor(position / gridSize);
          const targetCol = position % gridSize;
          if (puzzle[targetRow]?.[targetCol] === 0) {
            focusCell(targetRow, targetCol);
            return;
          }
        }
      },
      [focusCell, gridSize, puzzle],
    );

    const getCellClassName = useCallback(
      (
        isFixed: boolean,
        isHinted: boolean,
        hasError: boolean,
        isSelected: boolean,
        related: boolean,
        sameValue: boolean,
      ) =>
        [
          styles.sudokuCell,
          isFixed ? styles.fixedCell : styles.editableCell,
          isHinted ? styles.hintedCell : '',
          hasError ? styles.errorCell : '',
          related ? styles.relatedCell : '',
          sameValue ? styles.sameValueCell : '',
          isSelected ? styles.selectedCell : '',
          childMode ? styles.childModeCell : '',
          accessibilitySettings.highContrast ? styles.highContrastCell : '',
          accessibilitySettings.largeText ? styles.largeText : '',
        ]
          .filter(Boolean)
          .join(' '),
      [accessibilitySettings.highContrast, accessibilitySettings.largeText, childMode],
    );

    const renderCell = useCallback(
      (row: number, col: number) => {
        const puzzleValue = puzzle[row]?.[col] ?? 0;
        const userValue = userInput[row]?.[col] ?? 0;
        const isFixed = puzzleValue !== 0;
        const isHinted = hintCell?.row === row && hintCell?.col === col;
        const hasError =
          !isFixed &&
          userValue > 0 &&
          (hasConflict
            ? hasConflict(row, col, userValue)
            : !validateMove(GRID_CONFIGS[gridSize], userInput, row, col, userValue));
        const isSelected = selectedCell?.row === row && selectedCell?.col === col;
        const cellClasses = getCellClassName(
          isFixed,
          isHinted,
          hasError,
          isSelected,
          isRelated(row, col),
          isSameValue(userValue),
        );

        return (
          <td
            key={`${row}-${col}`}
            className={cellClasses}
            data-testid={`cell-${row}-${col}`}
            data-row={row}
            data-col={col}
            data-grid-size={String(gridSize)}
            data-selected={isSelected || undefined}
            style={getSubGridBorders?.(row, col)}
            onClick={() => !isFixed && setSelectedCell({ row, col })}
          >
            {isFixed ? (
              <div
                className={styles.fixedNumber}
                aria-label={`Row ${row + 1}, Column ${col + 1}, given ${puzzleValue}`}
              >
                {puzzleValue}
              </div>
            ) : (
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                autoComplete="off"
                value={userValue || ''}
                onKeyDown={(event) => handleCellKeyDown(event, row, col)}
                onChange={(event) => handleCellInput(row, col, event.target.value)}
                onFocus={() => setSelectedCell({ row, col })}
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
        handleCellInput,
        handleCellKeyDown,
        hasConflict,
        hintCell,
        isRelated,
        isSameValue,
        puzzle,
        selectedCell,
        setSelectedCell,
        useAriaInvalid,
        userInput,
      ],
    );

    const renderRow = useCallback(
      (row: number) => (
        <tr key={row} className={styles.sudokuRow}>
          {Array.from({ length: gridSize }, (_, col) => renderCell(row, col))}
        </tr>
      ),
      [gridSize, renderCell],
    );

    const renderGrid = useMemo(
      () => Array.from({ length: gridSize }, (_, row) => renderRow(row)),
      [gridSize, renderRow],
    );

    return (
      <React.Profiler
        id={performanceLabel}
        onRender={(_, _phase, duration) => trackRender(duration, false)}
      >
        <div
          className={`${styles.sudokuContainer} sudoku-container-query`}
          data-grid-size={String(gridSize)}
          data-child-mode={childMode}
          data-high-contrast={accessibilitySettings.highContrast}
        >
          <table
            ref={tableRef}
            className={`${styles.sudokuGrid} ${tableClassName}`}
            data-grid-size={String(gridSize)}
            aria-label={ariaLabel}
          >
            <tbody>{renderGrid}</tbody>
          </table>

          {childMode && childHints.length > 0 && (
            <div className={styles.childFriendlyHints}>
              {childHints.map((hint) => (
                <p key={hint}>{hint}</p>
              ))}
            </div>
          )}

          {(childMode || coarsePointer) && (
            <NumberPad
              gridSize={gridSize}
              selectedCell={selectedCell}
              disabled={disabled}
              onKeyPress={handleCellInput}
            />
          )}
        </div>
      </React.Profiler>
    );
  },
);

SharedSudokuGrid.displayName = 'SharedSudokuGrid';

/* -------------------------------------------------------------------------- */
/* Number pad (mobile/child)                                                  */
/* -------------------------------------------------------------------------- */

interface NumberPadProps {
  gridSize: number;
  selectedCell: Cell | null;
  disabled: boolean;
  onKeyPress: (row: number, col: number, value: string) => void;
}

const NumberPad = memo<NumberPadProps>(({ gridSize, selectedCell, disabled, onKeyPress }) => {
  if (!selectedCell) return null;

  return (
    <div className={styles.numberPad} role="group" aria-label="Number pad">
      {Array.from({ length: gridSize }, (_, i) => i + 1).map((num) => (
        <button
          key={num}
          type="button"
          className={styles.numberPadKey}
          onClick={() => onKeyPress(selectedCell.row, selectedCell.col, String(num))}
          disabled={disabled}
          aria-label={`Enter ${num}`}
        >
          {num}
        </button>
      ))}
      <button
        type="button"
        className={`${styles.numberPadKey} ${styles.numberPadErase}`}
        onClick={() => onKeyPress(selectedCell.row, selectedCell.col, '')}
        disabled={disabled}
        aria-label="Erase"
      >
        ⌫
      </button>
    </div>
  );
});

NumberPad.displayName = 'NumberPad';

export default SharedSudokuGrid;
