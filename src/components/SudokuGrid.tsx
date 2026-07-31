'use client';

import React, {
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSpring, SPRING_PRESETS } from '@/hooks/useSpring';
import { useVisualFeedback } from '@/hooks/useVisualFeedback';
import type { GridConfig } from '@/types';
import styles from './SudokuGrid.module.css';

/* ==========================================================================
   SUDOKU GRID — Apple Design System
   Fluid, interruptible, WCAG 2.2 AAA compliant
   ========================================================================== */

interface SudokuGridProps {
  puzzle: number[][];
  solution?: number[][] | undefined; // optional for backward compatibility
  userInput: number[][];
  onInputChange: (row: number, col: number, value: number) => void;
  disabled?: boolean | undefined;
  hintCell?: { row: number; col: number } | null | undefined;
  gridConfig: GridConfig;
  childMode?: boolean | undefined;
  accessibility?:
    | {
        highContrast?: boolean;
        reducedMotion?: boolean;
        largeText?: boolean;
      }
    | undefined;
  onPuzzleComplete?: (() => void) | undefined;
}

type SudokuGridHandle = {
  focusCell: (row: number, col: number) => void;
  getCellState: (
    row: number,
    col: number,
  ) => {
    currentValue: number;
    isFixed: boolean;
    hasError: boolean;
    isHinted: boolean;
    isSelected: boolean;
  };
  getSelectedCell: () => { row: number; col: number } | null;
  selectCell: (row: number, col: number) => void;
  clearSelection: () => void;
  isCellSelected: (row: number, col: number) => boolean;
  isCellFixed: (row: number, col: number) => boolean;
  getCellValue: (row: number, col: number) => number;
  setCellValue: (row: number, col: number, value: number) => void;
  focusNextCell: (row: number, col: number) => void;
};

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

const hasConflictInLine = (
  userInput: number[][],
  row: number,
  col: number,
  value: number,
  size: number,
): boolean => {
  for (let c = 0; c < size; c++) {
    if (c !== col && userInput[row]?.[c] === value) return true;
  }
  for (let r = 0; r < size; r++) {
    if (r !== row && userInput[r]?.[col] === value) return true;
  }
  return false;
};

const hasConflictInBox = (
  userInput: number[][],
  row: number,
  col: number,
  value: number,
  boxRows: number,
  boxCols: number,
): boolean => {
  const boxRow = Math.floor(row / boxRows) * boxRows;
  const boxCol = Math.floor(col / boxCols) * boxCols;
  for (let r = boxRow; r < boxRow + boxRows; r++) {
    for (let c = boxCol; c < boxCol + boxCols; c++) {
      if ((r !== row || c !== col) && userInput[r]?.[c] === value) return true;
    }
  }
  return false;
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
  return (
    hasConflictInLine(userInput, row, col, value, size) ||
    hasConflictInBox(userInput, row, col, value, boxRows, boxCols)
  );
};

const isValidCellInput = (value: string, maxValue: number) =>
  value === '' || new RegExp(`^[1-${maxValue}]$`).test(value);

// --- Cell component (outside SudokuGrid to avoid closure issues) ---
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
  disabled: boolean;
  childMode: boolean;
  largeText: boolean;
  highContrast: boolean;
  cellKey: string;
  cellId: string;
  ariaLabel: string;
  borderStyles: React.CSSProperties;
  cellRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
}

type CellVisualState = Pick<
  CellProps,
  'fixed' | 'hasError' | 'isHinted' | 'isSelected' | 'childMode' | 'largeText' | 'highContrast'
>;

const getCellClasses = ({
  fixed,
  hasError,
  isHinted,
  isSelected,
  childMode,
  largeText,
  highContrast,
}: CellVisualState) =>
  [
    styles.sudokuCell,
    fixed ? styles.fixedCell : styles.editableCell,
    hasError && styles.errorCell,
    isHinted && styles.hintedCell,
    isSelected && styles.selectedCell,
    largeText && styles.largeText,
    highContrast && styles.highContrastCell,
    childMode && styles.childModeCell,
  ]
    .filter(Boolean)
    .join(' ');

const getCellDataAttrs = ({
  fixed,
  hasError,
  isHinted,
  isSelected,
  childMode,
  largeText,
  highContrast,
}: CellVisualState) => ({
  'data-is-fixed': fixed ? 'true' : undefined,
  'data-is-editable': !fixed ? 'true' : undefined,
  'data-cell-type': fixed ? 'fixed' : 'editable',
  'data-has-error': hasError ? 'true' : undefined,
  'data-is-hinted': isHinted ? 'true' : undefined,
  'data-is-selected': isSelected ? 'true' : undefined,
  'data-child-mode': childMode ? 'true' : undefined,
  'data-high-contrast': highContrast ? 'true' : undefined,
  'data-large-text': largeText ? 'true' : undefined,
});

const getCellStyle = (borderStyles: React.CSSProperties, pressScale: number) =>
  ({
    ...borderStyles,
    transform: `scale(${pressScale})`,
    transformOrigin: 'center',
    transition: 'transform 0.05s ease-out, background-color 0.1s ease',
  }) as React.CSSProperties;

const getCellInputValue = (currentValue: number) =>
  currentValue === 0 ? '' : String(currentValue);

const getCellFontSize = (childMode: boolean) =>
  childMode ? 'var(--text-mono-xl)' : 'var(--text-mono-lg)';

const renderCellError = (cellId: string, hasError: boolean) =>
  hasError ? (
    <span id={`${cellId}-error`} className={styles.srOnly}>
      Conflict detected with other numbers
    </span>
  ) : null;

const renderCellContent = ({
  fixed,
  currentValue,
  maxValue,
  onInputChange,
  onKeyDown,
  onFocus,
  disabled,
  childMode,
  cellKey,
  cellId,
  cellRefs,
  hasError,
}: Pick<
  CellProps,
  | 'fixed'
  | 'currentValue'
  | 'maxValue'
  | 'onInputChange'
  | 'onKeyDown'
  | 'onFocus'
  | 'disabled'
  | 'childMode'
  | 'cellKey'
  | 'cellId'
  | 'cellRefs'
  | 'hasError'
>) =>
  fixed ? (
    <span className={styles.fixedNumber} aria-hidden="true" data-testid="fixed-number">
      {currentValue}
    </span>
  ) : (
    <input
      ref={(el) => {
        cellRefs.current[cellKey] = el;
      }}
      type="text"
      inputMode="numeric"
      pattern={`[1-${maxValue}]`}
      maxLength={1}
      value={getCellInputValue(currentValue)}
      onChange={onInputChange}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      disabled={disabled}
      className={styles.cellInput}
      aria-describedby={hasError ? `${cellId}-error` : undefined}
      autoComplete="off"
      spellCheck={false}
      style={{ fontSize: getCellFontSize(childMode) }}
    />
  );

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
  disabled,
  childMode,
  largeText,
  highContrast,
  cellKey,
  cellId,
  ariaLabel,
  borderStyles,
  cellRefs,
}: CellProps) {
  const [isPressed, setIsPressed] = useState(false);
  const pressScale = isPressed ? 0.97 : 1;

  const visualState = { fixed, hasError, isHinted, isSelected, childMode, largeText, highContrast };
  const cellClasses = getCellClasses(visualState);
  const cellDataAttrs = getCellDataAttrs(visualState);

  const handlePointerDown = useCallback(() => {
    setIsPressed(true);
    onPressDown();
  }, [onPressDown]);

  const handlePointerUp = useCallback(() => {
    setIsPressed(false);
    onPressUp();
  }, [onPressUp]);

  return (
    <td
      key={cellKey}
      id={cellId}
      data-testid={cellId}
      role="gridcell"
      aria-label={ariaLabel}
      aria-selected={isSelected}
      aria-invalid={hasError}
      className={cellClasses}
      style={getCellStyle(borderStyles, pressScale)}
      {...cellDataAttrs}
      onMouseDown={handlePointerDown}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchEnd={handlePointerUp}
      onTouchCancel={handlePointerUp}
    >
      {renderCellContent({
        fixed,
        currentValue,
        maxValue,
        onInputChange,
        onKeyDown,
        onFocus,
        disabled,
        childMode,
        cellKey,
        cellId,
        cellRefs,
        hasError,
      })}
      {renderCellError(cellId, hasError)}
    </td>
  );
});

Cell.displayName = 'Cell';

function useSudokuGridLogic(props: SudokuGridProps, forwardedRef: React.Ref<SudokuGridHandle>) {
  const {
    puzzle,
    solution,
    userInput,
    onInputChange,
    disabled = false,
    hintCell = null,
    gridConfig,
    childMode = false,
    accessibility = {},
    onPuzzleComplete,
  } = props;

  const { highContrast = false, reducedMotion = false, largeText = false } = accessibility;
  const { size, boxRows, boxCols, maxValue } = gridConfig;

  const cellRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const selectedCellRef = useRef<{ row: number; col: number } | null>(null);
  const pressedCellRef = useRef<{ row: number; col: number } | null>(null);
  const isComposingRef = useRef(false);

  const _visualFeedback = useVisualFeedback({
    childMode,
    highContrast,
    reducedMotion,
    enableHapticFeedback: true,
    enableSoundEffects: false,
  });

  const pressSpring = useSpring(0, {
    config: SPRING_PRESETS.stiff,
    immediate: false,
  });

  const getCellElement = useCallback(
    (row: number, col: number) => cellRefs.current[generateCellKey(row, col)] ?? null,
    [],
  );

  const focusCell = useCallback(
    (row: number, col: number) => {
      const cellElement = getCellElement(row, col);
      if (cellElement) {
        cellElement.focus();
      }
    },
    [getCellElement],
  );

  const handleCellPressDown = useCallback(
    (row: number, col: number) => {
      if (disabled) return;
      const cell = cellRefs.current[generateCellKey(row, col)];
      if (cell && !cell.disabled) {
        pressedCellRef.current = { row, col };
        pressSpring.setTarget(1, 0);
        if ('vibrate' in navigator) {
          navigator.vibrate([10]);
        }
      }
    },
    [disabled, pressSpring],
  );

  const handleCellPressUp = useCallback(() => {
    pressedCellRef.current = null;
    pressSpring.setTarget(0, 0);
  }, [pressSpring]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) => {
      if (isComposingRef.current) return;
      const { value } = e.target;
      if (!isValidCellInput(value, maxValue)) return;
      const numValue = value === '' ? 0 : Number.parseInt(value, 10);
      onInputChange(row, col, numValue);
    },
    [onInputChange, maxValue],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
      if (disabled || isComposingRef.current) return;

      const actions: Record<string, () => void> = {
        ArrowRight: () => col < size - 1 && focusCell(row, col + 1),
        ArrowLeft: () => col > 0 && focusCell(row, col - 1),
        ArrowDown: () => row < size - 1 && focusCell(row + 1, col),
        ArrowUp: () => row > 0 && focusCell(row - 1, col),
        Home: () => focusCell(row, 0),
        End: () => focusCell(row, size - 1),
        Tab: () => {
          const shiftBack = e.shiftKey && (col > 0 || row > 0);
          const shiftFwd = !e.shiftKey && (col < size - 1 || row < size - 1);
          if (shiftBack) {
            focusCell(col > 0 ? row : row - 1, col > 0 ? col - 1 : size - 1);
          } else if (shiftFwd) {
            focusCell(col < size - 1 ? row : row + 1, col < size - 1 ? col + 1 : 0);
          }
        },
      };

      const action = actions[e.key];
      if (action) {
        e.preventDefault();
        action();
      }
    },
    [disabled, size, focusCell],
  );

  const handleFocus = useCallback((row: number, col: number) => {
    selectedCellRef.current = { row, col };
  }, []);

  const getCellState = useCallback(
    (row: number, col: number) => {
      const currentValue = userInput[row]?.[col] ?? 0;
      const isFixed = puzzle[row]?.[col] !== 0;
      const hasError =
        !isFixed && currentValue > 0 && hasConflict(userInput, row, col, currentValue, gridConfig);
      const isHinted = hintCell?.row === row && hintCell?.col === col;
      const isSelected =
        selectedCellRef.current?.row === row && selectedCellRef.current?.col === col;

      return { currentValue, isFixed, hasError, isHinted, isSelected };
    },
    [userInput, puzzle, gridConfig, hintCell],
  );

  const getSelectedCell = useCallback(() => selectedCellRef.current, []);

  const selectCell = useCallback((row: number, col: number) => {
    selectedCellRef.current = { row, col };
  }, []);

  const clearSelection = useCallback(() => {
    selectedCellRef.current = null;
  }, []);

  const isCellSelected = useCallback(
    (row: number, col: number) =>
      selectedCellRef.current?.row === row && selectedCellRef.current?.col === col,
    [],
  );

  const isCellFixed = useCallback((row: number, col: number) => puzzle[row]?.[col] !== 0, [puzzle]);

  const getCellValue = useCallback(
    (row: number, col: number) => userInput[row]?.[col] ?? 0,
    [userInput],
  );

  const setCellValue = useCallback(
    (row: number, col: number, value: number) => onInputChange(row, col, value),
    [onInputChange],
  );

  const focusNextCell = useCallback(
    (row: number, col: number) => {
      const nextRow = col < size - 1 ? row : row + 1;
      const nextCol = col < size - 1 ? col + 1 : 0;
      if (nextRow < size) focusCell(nextRow, nextCol);
    },
    [size, focusCell],
  );

  useImperativeHandle(forwardedRef, () => ({
    focusCell,
    getCellState,
    getSelectedCell,
    selectCell,
    clearSelection,
    isCellSelected,
    isCellFixed,
    getCellValue,
    setCellValue,
    focusNextCell,
  }));

  useEffect(() => {
    if (!onPuzzleComplete || !solution) return;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const userValue = userInput[r]?.[c];
        const solutionValue = solution[r]?.[c];
        if (userValue !== solutionValue || userValue === 0) return;
      }
    }
    onPuzzleComplete();
  }, [userInput, solution, size, onPuzzleComplete]);

  const getCellBorderStyles = useCallback(
    (row: number, col: number): React.CSSProperties => {
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
    },
    [size, boxRows, boxCols],
  );

  return {
    size,
    maxValue,
    childMode,
    highContrast,
    largeText,
    disabled,
    cellRefs,
    getCellState,
    handleInputChange,
    handleKeyDown,
    handleFocus,
    handleCellPressDown,
    handleCellPressUp,
    getCellBorderStyles,
  };
}

// --- SudokuGrid component ---
const SudokuGrid = React.forwardRef<SudokuGridHandle, SudokuGridProps>(function SudokuGrid(
  {
    puzzle,
    solution,
    userInput,
    onInputChange,
    disabled: gridDisabled,
    hintCell,
    gridConfig,
    childMode: gridChildMode,
    accessibility,
    onPuzzleComplete,
  },
  forwardedRef,
) {
  const {
    size,
    maxValue,
    childMode,
    highContrast,
    largeText,
    disabled,
    cellRefs,
    getCellState,
    handleInputChange,
    handleKeyDown,
    handleFocus,
    handleCellPressDown,
    handleCellPressUp,
    getCellBorderStyles,
  } = useSudokuGridLogic(
    {
      puzzle,
      solution,
      userInput,
      onInputChange,
      disabled: gridDisabled,
      hintCell,
      gridConfig,
      childMode: gridChildMode,
      accessibility,
      onPuzzleComplete,
    },
    forwardedRef,
  );

  // Render cell
  const renderCell = useCallback(
    (row: number, col: number) => {
      const { currentValue, isFixed, hasError, isHinted, isSelected } = getCellState(row, col);

      return (
        <Cell
          fixed={isFixed}
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
          disabled={disabled}
          childMode={childMode}
          largeText={largeText}
          highContrast={highContrast}
          cellKey={generateCellKey(row, col)}
          cellId={`sudoku-cell-${row}-${col}`}
          ariaLabel={getCellAriaLabel({
            rowIndex: row,
            colIndex: col,
            currentValue,
            maxValue,
            hasError,
            isHinted,
            isFixed,
          })}
          borderStyles={getCellBorderStyles(row, col)}
          cellRefs={cellRefs}
        />
      );
    },
    [
      getCellState,
      maxValue,
      handleInputChange,
      handleKeyDown,
      handleFocus,
      handleCellPressDown,
      handleCellPressUp,
      disabled,
      childMode,
      largeText,
      highContrast,
      getCellBorderStyles,
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
      data-testid="sudoku-grid"
      data-grid-size={size}
      data-child-mode={childMode}
      data-high-contrast={highContrast}
      role="grid"
      aria-label={`${size}×${size} Sudoku grid`}
    >
      <table
        className={styles.sudokuGrid}
        role="grid"
        aria-label={`${size}×${size} Sudoku grid cells`}
      >
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
});

SudokuGrid.displayName = 'SudokuGrid';

export default SudokuGrid;
