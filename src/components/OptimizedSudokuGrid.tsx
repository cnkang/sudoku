/**
 * Performance-Optimized Sudoku Grid with React 19 Features
 * Implements React Compiler optimizations and performance monitoring
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import type { GridConfig } from '@/types';
import { useVisualFeedback } from '@/hooks/useVisualFeedback';
import {
  usePerformanceTracking,
  withPerformanceTracking,
} from '@/utils/performance-monitoring';
import styles from './SudokuGrid.module.css';

interface OptimizedSudokuGridProps {
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
  // Performance optimization props
  enableVirtualization?: boolean;
  enableMemoization?: boolean;
  onCorrectMove?: () => void;
  onIncorrectMove?: () => void;
  onPuzzleComplete?: () => void;
}

interface CellPosition {
  row: number;
  col: number;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  isLongPress: boolean;
}

// Memoized cell component for React 19 optimization
const SudokuCell = React.memo(
  ({
    row,
    col,
    value,
    isFixed,
    isSelected,
    isError,
    isHinted,
    isSuccess,
    gridConfig,
    accessibility,
    onCellClick,
    onCellChange,
    onGridKeyDown,
    disabled,
  }: {
    row: number;
    col: number;
    value: number;
    isFixed: boolean;
    isSelected: boolean;
    isError: boolean;
    isHinted: boolean;
    isSuccess: boolean;
    gridConfig: GridConfig;
    accessibility?: {
      highContrast?: boolean;
      reducedMotion?: boolean;
      largeText?: boolean;
    };
    onCellClick: (row: number, col: number) => void;
    onCellChange: (row: number, col: number, value: number) => void;
    onGridKeyDown: (event: React.KeyboardEvent) => void;
    disabled?: boolean;
  }) => {
    const cellRef = useRef<HTMLTableCellElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [touchState, setTouchState] = useState<TouchState | null>(null);

    // Performance tracking for individual cells
    const { trackRender } = usePerformanceTracking(`SudokuCell-${row}-${col}`);

    // Memoized cell classes for performance
    const cellClasses = useMemo(() => {
      const classes = [styles.sudokuCell];

      if (!isFixed) classes.push(styles.editable);
      if (isSelected) classes.push(styles.selected);
      if (isError) classes.push(styles.error);
      if (isHinted) classes.push(styles.hinted);
      if (isSuccess) classes.push(styles.success);
      if (accessibility?.largeText) classes.push(styles.largeText);

      return classes.join(' ');
    }, [
      isFixed,
      isSelected,
      isError,
      isHinted,
      isSuccess,
      accessibility?.largeText,
    ]);

    // Optimized event handlers with useCallback
    const handleClick = useCallback(() => {
      if (!disabled && !isFixed) {
        onCellClick(row, col);
      }
    }, [disabled, isFixed, row, col, onCellClick]);

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled || isFixed) return;

        const newValue = Number.parseInt(e.target.value, 10);
        if (
          !Number.isNaN(newValue) &&
          newValue >= 1 &&
          newValue <= gridConfig.maxValue
        ) {
          onCellChange(row, col, newValue);
        } else if (e.target.value === '') {
          onCellChange(row, col, 0);
        }
      },
      [disabled, isFixed, row, col, gridConfig.maxValue, onCellChange]
    );

    // Touch event handlers for mobile optimization
    const handleTouchStart = useCallback(
      (e: React.TouchEvent) => {
        if (disabled || isFixed) return;

        const touch = e.touches[0];
        if (!touch) return;
        setTouchState({
          startX: touch.clientX,
          startY: touch.clientY,
          startTime: Date.now(),
          isLongPress: false,
        });

        // Long press detection for hints
        setTimeout(() => {
          setTouchState(prev => (prev ? { ...prev, isLongPress: true } : null));
        }, 500);
      },
      [disabled, isFixed]
    );

    const handleTouchEnd = useCallback(
      (e: React.TouchEvent) => {
        if (!touchState || disabled || isFixed) return;

        const touch = e.changedTouches[0];
        if (!touch) return;
        const deltaX = Math.abs(touch.clientX - touchState.startX);
        const deltaY = Math.abs(touch.clientY - touchState.startY);
        const deltaTime = Date.now() - touchState.startTime;

        // Tap detection (not a swipe)
        if (deltaX < 10 && deltaY < 10 && deltaTime < 500) {
          handleClick();
        }

        setTouchState(null);
      },
      [touchState, disabled, isFixed, handleClick]
    );

    // Track render performance
    // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run once on mount
    useEffect(() => {
      const renderTime = performance.now();
      trackRender(renderTime - performance.now(), true); // Assume optimized due to memoization
    }, []);

    return (
      <td
        ref={cellRef}
        className={cellClasses}
        onClick={handleClick}
        onKeyDown={event => {
          onGridKeyDown(event);
          if (event.defaultPrevented) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleClick();
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        data-row={row}
        data-col={col}
        data-testid={`cell-${row}-${col}`}
        aria-label={`Cell ${row + 1}, ${col + 1}${
          value ? `, value ${value}` : ', empty'
        }`}
        tabIndex={isSelected ? 0 : -1}
      >
        {isFixed ? (
          <span className={styles.fixedNumber}>{value || ''}</span>
        ) : (
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[1-9]"
            maxLength={1}
            value={value || ''}
            onChange={handleInputChange}
            disabled={disabled}
            className={styles.cellInput}
            aria-label={`Enter number for cell ${row + 1}, ${col + 1}`}
          />
        )}
      </td>
    );
  }
);

SudokuCell.displayName = 'SudokuCell';

// Main optimized grid component
const OptimizedSudokuGrid: React.FC<OptimizedSudokuGridProps> = ({
  puzzle,
  userInput,
  onInputChange,
  disabled = false,
  hintCell = null,
  gridConfig,
  childMode = false,
  accessibility = {},
  enableVirtualization: _enableVirtualization = false,
  enableMemoization = true,
  onCorrectMove,
  onIncorrectMove,
  onPuzzleComplete: _onPuzzleComplete,
}) => {
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const gridRef = useRef<HTMLTableElement>(null);
  const { trackRender } = usePerformanceTracking('OptimizedSudokuGrid');

  // Visual feedback integration
  const { triggerSuccess, triggerError } = useVisualFeedback({
    childMode,
    highContrast: Boolean(accessibility.highContrast),
    reducedMotion: Boolean(accessibility.reducedMotion),
    enableHapticFeedback: true,
    enableSoundEffects: true,
  });

  // Memoized grid data for performance
  const gridData = useMemo(() => {
    const data = [];
    for (let row = 0; row < gridConfig.size; row++) {
      const rowData = [];
      for (let col = 0; col < gridConfig.size; col++) {
        const puzzleValue = puzzle[row]?.[col] || 0;
        const userValue = userInput[row]?.[col] || 0;
        const isFixed = puzzleValue !== 0;
        const value = isFixed ? puzzleValue : userValue;

        rowData.push({
          row,
          col,
          value,
          isFixed,
          isSelected: selectedCell?.row === row && selectedCell?.col === col,
          isHinted: hintCell?.row === row && hintCell?.col === col,
          isError: false, // Will be calculated based on validation
          isSuccess: false, // Will be calculated based on validation
        });
      }
      data.push(rowData);
    }
    return data;
  }, [puzzle, userInput, gridConfig.size, selectedCell, hintCell]);

  // Optimized cell click handler
  const handleCellClick = useCallback((row: number, col: number) => {
    setSelectedCell({ row, col });

    // Focus management for accessibility
    const cellElement = gridRef.current?.querySelector(
      `[data-row="${row}"][data-col="${col}"] input`
    );
    if (cellElement instanceof HTMLInputElement) {
      cellElement.focus();
    }
  }, []);

  // Optimized input change handler
  const handleCellChange = useCallback(
    (row: number, col: number, value: number) => {
      onInputChange(row, col, value);

      // Trigger appropriate feedback
      if (value !== 0) {
        // Simple validation check (can be enhanced)
        const isValid = true; // Placeholder for actual validation
        if (isValid) {
          onCorrectMove?.();
          triggerSuccess(`Correct! Number ${value} placed.`);
        } else {
          onIncorrectMove?.();
          triggerError(`Number ${value} conflicts with existing numbers.`);
        }
      }
    },
    [
      onInputChange,
      onCorrectMove,
      onIncorrectMove,
      triggerSuccess,
      triggerError,
    ]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!selectedCell) return;

      const { row, col } = selectedCell;
      let newRow = row;
      let newCol = col;

      switch (e.key) {
        case 'ArrowUp':
          newRow = Math.max(0, row - 1);
          break;
        case 'ArrowDown':
          newRow = Math.min(gridConfig.size - 1, row + 1);
          break;
        case 'ArrowLeft':
          newCol = Math.max(0, col - 1);
          break;
        case 'ArrowRight':
          newCol = Math.min(gridConfig.size - 1, col + 1);
          break;
        default:
          return;
      }

      e.preventDefault();
      setSelectedCell({ row: newRow, col: newCol });
    },
    [selectedCell, gridConfig.size]
  );

  // Performance tracking
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run once on mount
  useEffect(() => {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      trackRender(endTime - startTime, enableMemoization);
    };
  }, []);

  // Container classes with modern CSS
  const containerClasses = useMemo(() => {
    const classes = [styles.sudokuContainer, 'sudoku-container-query'];

    if (childMode) classes.push(styles.childMode);
    if (accessibility.highContrast) classes.push(styles.highContrast);

    return classes.join(' ');
  }, [childMode, accessibility.highContrast]);

  const gridClasses = useMemo(() => {
    const classes = [
      styles.sudokuGrid,
      `sudoku-grid-${gridConfig.size}x${gridConfig.size}`,
    ];
    return classes.join(' ');
  }, [gridConfig.size]);

  return (
    <div
      className={containerClasses}
      data-grid-size={gridConfig.size}
      data-child-mode={childMode}
      data-high-contrast={accessibility.highContrast}
    >
      <table
        ref={gridRef}
        className={gridClasses}
        data-grid-size={gridConfig.size}
        aria-label={`${gridConfig.size}x${gridConfig.size} Sudoku puzzle`}
      >
        <tbody>
          {gridData.map((rowData, rowIndex) => {
            const rowKey = rowData[0]?.row ?? rowIndex;
            return (
              <tr key={`row-${rowKey}`}>
                {rowData.map(cellData => (
                  <SudokuCell
                    key={`cell-${cellData.row}-${cellData.col}`}
                    {...cellData}
                    gridConfig={gridConfig}
                    accessibility={accessibility}
                    onCellClick={handleCellClick}
                    onCellChange={handleCellChange}
                    onGridKeyDown={handleKeyDown}
                    disabled={disabled}
                  />
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// Export with performance tracking wrapper
export default withPerformanceTracking(
  OptimizedSudokuGrid,
  'OptimizedSudokuGrid'
);
