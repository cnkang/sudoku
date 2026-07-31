'use client';

import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSpring, SPRING_PRESETS } from '@/hooks/useSpring';
import { useVisualFeedback } from '@/hooks/useVisualFeedback';
import type { GridConfig } from '@/types';
import styles from './SudokuGrid.module.css';

interface SudokuGridProps {
  puzzle: number[][];
  userInput: number[][];
  onInputChange: (row: number, col: number, value: number) => void;
  disabled?: boolean;
  hintCell?: { row: number; col: number } | null;
  gridConfig: GridConfig;
  childMode?: boolean;
  accessibility?: {
    highContrast?: boolean;
    reducedMotion?: boolean;
    largeText?: boolean;
  };
  onCorrectMove?: () => void;
  onIncorrectMove?: () => void;
  onPuzzleComplete?: () => void;
}

const generateCellKey = (row: number, col: number) => `cell-${row}-${col}`;

const getCellAriaLabel = ({
  rowIndex,
  colIndex,
  currentValue,
  maxValue,
  hasError,
  isHinted,
  isFixed,
}: {
  rowIndex: number;
  colIndex: number;
  currentValue: number;
  maxValue: number;
  hasError: boolean;
  isHinted: boolean;
  isFixed: boolean;
}) => {
  const valueText = currentValue ? `Current value: ${currentValue}` : 'Empty cell';
  const fixedText = isFixed ? 'Fixed clue' : '';
  const errorText = hasError ? 'This cell has a conflict with other numbers.' : '';
  const hintText = isHinted ? 'This cell is highlighted as a hint.' : '';

  return `Editable cell in row ${rowIndex + 1}, column ${colIndex + 1}. Enter numbers 1 to ${maxValue}. ${valueText}. ${fixedText} ${errorText} ${hintText}`.trim();
};

const hasConflict = (
  userInput: number[][],
  row: number,
  col: number,
  value: number,
  gridConfig: GridConfig,
): boolean => {
  if (value === 0) return false;
  const { size, boxRows, boxCols } = gridConfig;

  // Row
  for (let c = 0; c < size; c++) {
    if (c !== col && userInput[row]?.[c] === value) return true;
  }
  // Column
  for (let r = 0; r < size; r++) {
    if (r !== row && userInput[r]?.[col] === value) return true;
  }
  // Box
  const boxRow = Math.floor(row / boxRows) * boxRows;
  const boxCol = Math.floor(col / boxCols) * boxCols;
  for (let r = boxRow; r < boxRow + boxRows; r++) {
    for (let c = boxCol; c < boxCol + boxCols; c++) {
      if ((r !== row || c !== col) && userInput[r]?.[c] === value) return true;
    }
  }
  return false;
};

const isValidCellInput = (value: string, maxValue: number) =>
  value === '' || new RegExp(`^[1-${maxValue}]$`).test(value);

// Cell component - defined outside to avoid closure issues
interface CellProps {
  fixed: boolean;
  currentValue: number;
  hasError: boolean;
  isHinted: boolean;
  isSelected: boolean;
  maxValue: number;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  onPressDown: () => void;
  onPressUp: () => void;
  onCompositionStart: () => void;
  onCompositionEnd: (e: React.CompositionEvent<HTMLInputElement>) => void;
  disabled: boolean;
  childMode: boolean;
  largeText: boolean;
  highContrast: boolean;
  getCellElement: () => HTMLInputElement | null;
  cellKey: string;
  cellId: string;
  ariaLabel: string;
  borderStyles: React.CSSProperties;
  cellRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
}

const Cell = memo(function Cell({
  fixed,
  currentValue,
  hasError,
  isHinted,
  isSelected,
  maxValue,
  onInputChange,
  onKeyDown,
  onFocus,
  onPressDown,
  onPressUp,
  onCompositionStart,
  onCompositionEnd,
  disabled,
  childMode,
  largeText,
  highContrast,
  getCellElement,
  cellKey,
  cellId,
  ariaLabel,
  borderStyles,
  cellRefs,
}: CellProps) {
  const pressSpring = useSpring(0, {
    config: SPRING_PRESETS.stiff,
    immediate: false,
  });
  const pressScale = pressSpring.value > 0 ? 1 - 0.03 * pressSpring.value : 1;

  const cellClasses = [
    styles.sudokuCell,
    fixed ? styles.fixedCell : styles.editableCell,
    hasError ? styles.errorCell : '',
    isHinted ? styles.hintedCell : '',
    isSelected ? styles.selectedCell : '',
    largeText ? styles.largeText : '',
    highContrast ? styles.highContrastCell : '',
    childMode ? styles.childModeCell : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <td
      key={cellKey}
      id={cellId}
      role="gridcell"
      aria-label={ariaLabel}
      aria-selected={isSelected}
      aria-invalid={hasError}
      className={cellClasses}
      style={
        {
          ...borderStyles,
          transform: `scale(${pressScale})`,
          transformOrigin: 'center',
          transition: 'transform 0.05s ease-out',
        } as React.CSSProperties
      }
    >
      {fixed ? (
        <span className={styles.fixedNumber} aria-hidden="true">
          {currentValue}
        </span>
      ) : (
        <input
          ref={(el) => {
            getCellElement();
            cellRefs.current[cellKey] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern={`[1-${maxValue}]`}
          maxLength={1}
          value={currentValue === 0 ? '' : String(currentValue)}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onMouseDown={onPressDown}
          onMouseUp={onPressUp}
          onMouseLeave={onPressUp}
          onTouchStart={onPressDown}
          onTouchEnd={onPressUp}
          onTouchCancel={onPressUp}
          onCompositionStart={onCompositionStart}
          onCompositionEnd={onCompositionEnd}
          disabled={disabled}
          className={styles.cellInput}
          aria-describedby={hasError ? `${cellId}-error` : undefined}
          autoComplete="off"
          spellCheck={false}
          style={
            {
              fontSize: childMode ? 'var(--text-mono-xl)' : 'var(--text-mono-lg)',
            } as React.CSSProperties
          }
        />
      )}
      {hasError && (
        <span id={`${cellId}-error`} className={styles.srOnly}>
          Conflict detected with other numbers
        </span>
      )}
    </td>
  );
});

Cell.displayName = 'Cell';

const SudokuGrid = memo(function SudokuGrid({
  puzzle,
  userInput,
  onInputChange,
  disabled = false,
  hintCell,
  gridConfig,
  childMode = false,
  accessibility = {},
  onCorrectMove,
  onIncorrectMove,
  onPuzzleComplete,
}: SudokuGridProps) {
  'use memo';

  const { highContrast = false, reducedMotion = false, largeText = false } = accessibility;

  const { size, boxRows, boxCols, maxValue } = gridConfig;

  // Refs
  const cellRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const selectedCellRef = useRef<{ row: number; col: number } | null>(null);
  const pressedCellRef = useRef<{ row: number; col: number } | null>(null);
  const isComposingRef = useRef(false);

  // Visual feedback system
  const _visualFeedback = useVisualFeedback({
    childMode,
    highContrast,
    reducedMotion,
    enableHapticFeedback: true,
    enableSoundEffects: false,
  });

  // Spring for cell press feedback (stiff spring)
  const pressSpring = useSpring(0, {
    config: SPRING_PRESETS.stiff,
    immediate: false,
  });

  // Get cell element helper
  const getCellElement = useCallback(
    (row: number, col: number) => cellRefs.current[generateCellKey(row, col)] ?? null,
    [],
  );

  // Handle cell press down
  const handleCellPressDown = useCallback(
    (row: number, col: number) => {
      if (disabled) return;
      const cell = cellRefs.current[generateCellKey(row, col)];
      if (cell && !cell.disabled) {
        pressedCellRef.current = { row, col };
        pressSpring.setTarget(1, 0); // animate to pressed state
      }
    },
    [disabled, pressSpring],
  );

  // Handle cell press up
  const handleCellPressUp = useCallback(() => {
    pressedCellRef.current = null;
    pressSpring.setTarget(0, 0); // animate back
  }, [pressSpring]);

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) => {
      if (isComposingRef.current) return;

      const { value } = e.target;
      if (!isValidCellInput(value, maxValue)) return;

      const numValue = value === '' ? 0 : Number.parseInt(value, 10);
      onInputChange(row, col, numValue);

      if (numValue > 0 && !reducedMotion) {
        // Haptic feedback on valid input
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
      }
    },
    [maxValue, onInputChange, reducedMotion],
  );

  // Handle key down on cell
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
      // Handle number input
      if (e.key >= '1' && e.key <= '9') {
        const num = Number.parseInt(e.key, 10);
        if (num <= maxValue) {
          onInputChange(row, col, num);
        }
        e.preventDefault();
      }

      // Backspace/Delete to clear
      if (e.key === 'Backspace' || e.key === 'Delete') {
        onInputChange(row, col, 0);
      }
    },
    [maxValue, onInputChange],
  );

  // Handle focus
  const handleFocus = useCallback((row: number, col: number) => {
    selectedCellRef.current = { row, col };
  }, []);

  // Handle composition events for IME
  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>, row: number, col: number) => {
      isComposingRef.current = false;
      const value = e.currentTarget.value;
      if (isValidCellInput(value, maxValue)) {
        const numValue = value === '' ? 0 : Number.parseInt(value, 10);
        onInputChange(row, col, numValue);
      }
    },
    [maxValue, onInputChange],
  );

  // Check for puzzle completion
  useEffect(() => {
    if (!puzzle || !onPuzzleComplete) return;

    let complete = true;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const puzzleVal = puzzle[r]?.[c];
        const inputVal = userInput[r]?.[c];
        if (puzzleVal === 0 && inputVal !== 0) continue;
        if (puzzleVal !== inputVal) {
          complete = false;
          break;
        }
      }
      if (!complete) break;
    }

    if (complete) {
      onPuzzleComplete();
    }
  }, [puzzle, userInput, size, onPuzzleComplete]);

  // Determine if a cell has a fixed (puzzle) value
  const isFixedCell = useCallback((row: number, col: number) => puzzle[row]?.[col] !== 0, [puzzle]);

  // Determine cell state
  const getCellState = useCallback(
    (row: number, col: number) => {
      const fixed = isFixedCell(row, col);
      const currentValue = fixed ? (puzzle[row]?.[col] ?? 0) : (userInput[row]?.[col] ?? 0);
      const hasError =
        !fixed && currentValue !== 0 && hasConflict(userInput, row, col, currentValue, gridConfig);
      const isHinted = hintCell?.row === row && hintCell?.col === col;
      const isSelected =
        selectedCellRef.current?.row === row && selectedCellRef.current?.col === col;

      return { fixed, currentValue, hasError, isHinted, isSelected };
    },
    [puzzle, userInput, gridConfig, hintCell, isFixedCell],
  );

  // Render cell - memoized
  const renderCell = useCallback(
    (row: number, col: number) => {
      const { fixed, currentValue, hasError, isHinted, isSelected } = getCellState(row, col);
      const cellKey = generateCellKey(row, col);
      const cellId = `sudoku-cell-${row}-${col}`;
      const ariaLabel = getCellAriaLabel({
        rowIndex: row,
        colIndex: col,
        currentValue,
        maxValue,
        hasError,
        isHinted,
        isFixed: fixed,
      });

      const borderStyles = useMemo(() => {
        const isRightBorder = col === size - 1 || col % boxCols === boxCols - 1;
        const isBottomBorder = row === size - 1 || row % boxRows === boxRows - 1;
        const isTopBorder = row % boxRows === 0;
        const isLeftBorder = col % boxCols === 0;

        return {
          borderTop: isTopBorder ? 'var(--cell-border-thick)' : 'var(--cell-border-thin)',
          borderLeft: isLeftBorder ? 'var(--cell-border-thick)' : 'var(--cell-border-thin)',
          borderRight: isRightBorder ? 'var(--cell-border-thick)' : 'var(--cell-border-thin)',
          borderBottom: isBottomBorder ? 'var(--cell-border-thick)' : 'var(--cell-border-thin)',
        };
      }, [row, col, size, boxRows, boxCols]);

      return (
        <Cell
          fixed={fixed}
          currentValue={currentValue}
          hasError={hasError}
          isHinted={isHinted}
          isSelected={isSelected}
          maxValue={maxValue}
          onInputChange={(e) => handleInputChange(e, row, col)}
          onKeyDown={(e) => handleKeyDown(e, row, col)}
          onFocus={() => handleFocus(row, col)}
          onPressDown={() => handleCellPressDown(row, col)}
          onPressUp={handleCellPressUp}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={(e) => handleCompositionEnd(e, row, col)}
          disabled={disabled}
          childMode={childMode}
          largeText={largeText}
          highContrast={highContrast}
          getCellElement={() => getCellElement(row, col)}
          cellKey={cellKey}
          cellId={cellId}
          ariaLabel={ariaLabel}
          borderStyles={borderStyles}
          cellRefs={cellRefs}
        />
      );
    },
    [
      size,
      boxRows,
      boxCols,
      maxValue,
      getCellState,
      handleInputChange,
      handleKeyDown,
      handleFocus,
      handleCellPressDown,
      handleCellPressUp,
      handleCompositionStart,
      handleCompositionEnd,
      disabled,
      childMode,
      largeText,
      highContrast,
      getCellElement,
      cellRefs,
    ],
  );

  // Render rows
  const rows = useMemo(() => {
    const result: React.ReactNode[] = [];
    for (let r = 0; r < size; r++) {
      const cells: React.ReactNode[] = [];
      for (let c = 0; c < size; c++) {
        cells.push(renderCell(r, c));
      }
      result.push(
        <tr key={`row-${r}`} role="row">
          {cells}
        </tr>,
      );
    }
    return result;
  }, [size, renderCell]);

  return (
    <div
      className={`${styles.sudokuContainer} ${childMode ? styles.childMode : ''}`}
      data-grid-size={size}
      data-child-mode={childMode}
      data-high-contrast={highContrast}
      role="grid"
      aria-label={`${size}×${size} Sudoku grid`}
    >
      <table className={styles.sudokuGrid} role="presentation">
        <tbody>{rows}</tbody>
      </table>

      {/* Screen reader announcements */}
      <div className={styles.srOnly} aria-live="polite" aria-atomic="true">
        {selectedCellRef.current && (
          <span>
            Row {selectedCellRef.current.row + 1}, Column {selectedCellRef.current.col + 1}
            {isFixedCell(selectedCellRef.current.row, selectedCellRef.current.col)
              ? ', fixed clue'
              : ', editable'}
          </span>
        )}
      </div>
    </div>
  );
});

SudokuGrid.displayName = 'SudokuGrid';

export default SudokuGrid;
