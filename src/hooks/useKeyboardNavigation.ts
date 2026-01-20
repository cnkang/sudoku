/**
 * Keyboard Navigation Hook - Enhanced keyboard support for Sudoku grid
 * Provides logical tab order, arrow key navigation, and screen reader integration
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { GridConfig } from '@/types';
import { getAccessibilityManager } from '@/utils/accessibilityManager';

const advancePosition = (
  row: number,
  col: number,
  size: number,
  direction: 'forward' | 'backward'
) => {
  let nextRow = row;
  let nextCol = col;

  if (direction === 'forward') {
    nextCol += 1;
    if (nextCol >= size) {
      nextCol = 0;
      nextRow += 1;
    }
    if (nextRow >= size) {
      nextRow = 0;
    }
  } else {
    nextCol -= 1;
    if (nextCol < 0) {
      nextCol = size - 1;
      nextRow -= 1;
    }
    if (nextRow < 0) {
      nextRow = size - 1;
    }
  }

  return { row: nextRow, col: nextCol };
};

const isEditableCell = (cellElement?: HTMLElement) =>
  cellElement?.tagName === 'INPUT';

export interface KeyboardNavigationOptions {
  gridConfig: GridConfig;
  disabled?: boolean;
  onCellFocus?: (row: number, col: number) => void;
  onCellActivate?: (row: number, col: number) => void;
  onValueInput?: (row: number, col: number, value: number) => void;
  onNavigateToControls?: () => void;
  onNavigateToGrid?: () => void;
}

export interface KeyboardNavigationState {
  currentCell: { row: number; col: number } | null;
  focusMode: 'grid' | 'controls';
  isNavigating: boolean;
}

export interface KeyboardNavigationHandlers {
  handleKeyDown: (event: KeyboardEvent) => void;
  handleCellKeyDown: (
    event: React.KeyboardEvent,
    row: number,
    col: number
  ) => void;
  handleControlKeyDown: (event: React.KeyboardEvent, controlId: string) => void;
  focusCell: (row: number, col: number) => void;
  focusNextCell: () => void;
  focusPreviousCell: () => void;
  focusFirstEditableCell: () => void;
  announceNavigation: (message: string) => void;
  registerCellRef: (
    row: number,
    col: number,
    element: HTMLElement | null
  ) => void;
  registerControlRef: (controlId: string, element: HTMLElement | null) => void;
}

export const useKeyboardNavigation = (
  options: KeyboardNavigationOptions
): [KeyboardNavigationState, KeyboardNavigationHandlers] => {
  const {
    gridConfig,
    disabled = false,
    onCellFocus,
    onCellActivate,
    onValueInput,
    onNavigateToControls: _onNavigateToControls,
    onNavigateToGrid,
  } = options;

  const [state, setState] = useState<KeyboardNavigationState>({
    currentCell: null,
    focusMode: 'grid',
    isNavigating: false,
  });

  const accessibilityManager = useRef(getAccessibilityManager());
  const cellRefs = useRef<Map<string, HTMLElement>>(new Map());
  const controlRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Generate cell key for consistent referencing
  const getCellKey = useCallback(
    (row: number, col: number) => `cell-${row}-${col}`,
    []
  );

  // Check if a cell is within grid bounds
  const isValidCell = useCallback(
    (row: number, col: number) => {
      return (
        row >= 0 && row < gridConfig.size && col >= 0 && col < gridConfig.size
      );
    },
    [gridConfig.size]
  );

  // Find next editable cell in reading order (left-to-right, top-to-bottom)
  const findNextEditableCell = useCallback(
    (
      startRow: number,
      startCol: number,
      direction: 'forward' | 'backward' = 'forward'
    ): { row: number; col: number } | null => {
      const { size } = gridConfig;
      let { row, col } = advancePosition(startRow, startCol, size, direction);

      // Search for editable cell
      for (let attempts = 0; attempts < size * size; attempts++) {
        if (isValidCell(row, col)) {
          const cellKey = getCellKey(row, col);
          const cellElement = cellRefs.current.get(cellKey);

          // Check if cell is editable (has input element)
          if (isEditableCell(cellElement)) {
            return { row, col };
          }
        }

        // Move to next position
        ({ row, col } = advancePosition(row, col, size, direction));
      }

      return null; // No editable cell found
    },
    [gridConfig, getCellKey, isValidCell]
  );

  // Focus a specific cell
  const focusCell = useCallback(
    (row: number, col: number) => {
      if (!isValidCell(row, col) || disabled) return;

      const cellKey = getCellKey(row, col);
      const cellElement = cellRefs.current.get(cellKey);

      if (cellElement) {
        cellElement.focus();
        setState(prev => ({
          ...prev,
          currentCell: { row, col },
          focusMode: 'grid',
        }));

        // Update accessibility manager
        accessibilityManager.current.updateKeyboardNavigation({
          currentCell: { row, col },
          navigationMode: 'grid',
        });

        // Announce cell focus to screen readers
        const cellDescription = accessibilityManager.current.describeSudokuCell(
          row,
          col,
          0, // Value will be read by input's aria-label
          cellElement.tagName !== 'INPUT',
          gridConfig
        );

        accessibilityManager.current.announce({
          message: cellDescription,
          priority: 'polite',
          category: 'navigation',
        });

        onCellFocus?.(row, col);
      }
    },
    [isValidCell, disabled, getCellKey, gridConfig, onCellFocus]
  );

  // Focus first editable cell
  const focusFirstEditableCell = useCallback(() => {
    const firstCell = findNextEditableCell(-1, gridConfig.size - 1, 'forward');
    if (firstCell) {
      focusCell(firstCell.row, firstCell.col);
    }
  }, [findNextEditableCell, gridConfig.size, focusCell]);

  // Focus next editable cell
  const focusNextCell = useCallback(() => {
    if (!state.currentCell) {
      focusFirstEditableCell();
      return;
    }

    const nextCell = findNextEditableCell(
      state.currentCell.row,
      state.currentCell.col,
      'forward'
    );

    if (nextCell) {
      focusCell(nextCell.row, nextCell.col);
    }
  }, [
    state.currentCell,
    findNextEditableCell,
    focusCell,
    focusFirstEditableCell,
  ]);

  // Focus previous editable cell
  const focusPreviousCell = useCallback(() => {
    if (!state.currentCell) {
      focusFirstEditableCell();
      return;
    }

    const prevCell = findNextEditableCell(
      state.currentCell.row,
      state.currentCell.col,
      'backward'
    );

    if (prevCell) {
      focusCell(prevCell.row, prevCell.col);
    }
  }, [
    state.currentCell,
    findNextEditableCell,
    focusCell,
    focusFirstEditableCell,
  ]);

  // Handle arrow key navigation within grid
  const handleArrowNavigation = useCallback(
    (event: KeyboardEvent, currentRow: number, currentCol: number) => {
      event.preventDefault();

      let newRow = currentRow;
      let newCol = currentCol;

      switch (event.key) {
        case 'ArrowUp':
          newRow = Math.max(0, currentRow - 1);
          break;
        case 'ArrowDown':
          newRow = Math.min(gridConfig.size - 1, currentRow + 1);
          break;
        case 'ArrowLeft':
          newCol = Math.max(0, currentCol - 1);
          break;
        case 'ArrowRight':
          newCol = Math.min(gridConfig.size - 1, currentCol + 1);
          break;
      }

      if (newRow !== currentRow || newCol !== currentCol) {
        focusCell(newRow, newCol);
      }
    },
    [gridConfig.size, focusCell]
  );

  // Handle number input
  const handleNumberInput = useCallback(
    (event: KeyboardEvent, row: number, col: number) => {
      const { key } = event;
      const { maxValue } = gridConfig;

      // Check for valid number input
      const numberMatch = key.match(/^[0-9]$/);
      if (numberMatch) {
        const value = Number.parseInt(key, 10);

        if (value >= 1 && value <= maxValue) {
          event.preventDefault();
          onValueInput?.(row, col, value);

          // Announce the input
          accessibilityManager.current.announce({
            message: `Number ${value} entered in row ${row + 1}, column ${
              col + 1
            }`,
            priority: 'polite',
            category: 'game-state',
          });
        } else if (value === 0) {
          // Clear cell
          event.preventDefault();
          onValueInput?.(row, col, 0);

          accessibilityManager.current.announce({
            message: `Cell cleared in row ${row + 1}, column ${col + 1}`,
            priority: 'polite',
            category: 'game-state',
          });
        }
      }
      // Handle deletion
      else if (key === 'Backspace' || key === 'Delete') {
        event.preventDefault();
        onValueInput?.(row, col, 0);

        accessibilityManager.current.announce({
          message: `Cell cleared in row ${row + 1}, column ${col + 1}`,
          priority: 'polite',
          category: 'game-state',
        });
      }
    },
    [gridConfig, onValueInput]
  );

  // Main keyboard event handler for grid cells
  const handleCellKeyDown = useCallback(
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: input handling is complex
    (event: React.KeyboardEvent, row: number, col: number) => {
      if (disabled) return;

      const { key, ctrlKey, shiftKey } = event.nativeEvent;

      // Handle arrow navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        handleArrowNavigation(event.nativeEvent, row, col);
        return;
      }

      // Handle Tab navigation
      if (key === 'Tab') {
        if (shiftKey) {
          // Shift+Tab: go to previous cell or controls
          event.preventDefault();
          focusPreviousCell();
        } else {
          // Tab: go to next cell or controls
          event.preventDefault();
          focusNextCell();
        }
        return;
      }

      // Handle Enter/Space activation
      if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        onCellActivate?.(row, col);
        return;
      }

      // Handle Escape - return to grid navigation
      if (key === 'Escape') {
        event.preventDefault();
        setState(prev => ({ ...prev, focusMode: 'grid' }));
        onNavigateToGrid?.();
        return;
      }

      // Handle number input and deletion
      handleNumberInput(event.nativeEvent, row, col);

      // Handle keyboard shortcuts
      if (ctrlKey) {
        switch (key.toLowerCase()) {
          case 'h':
            event.preventDefault();
            accessibilityManager.current.announce({
              message:
                accessibilityManager.current.getKeyboardInstructions(
                  gridConfig
                ),
              priority: 'polite',
              category: 'navigation',
            });
            break;
        }
      }
    },
    [
      disabled,
      handleArrowNavigation,
      focusNextCell,
      focusPreviousCell,
      onCellActivate,
      onNavigateToGrid,
      handleNumberInput,
      gridConfig,
    ]
  );

  // Handle keyboard events for control elements
  const handleControlKeyDown = useCallback(
    (event: React.KeyboardEvent, controlId: string) => {
      const { key, shiftKey } = event.nativeEvent;

      if (key === 'Tab') {
        // Handle tab navigation between controls
        event.preventDefault();

        if (shiftKey) {
          // Navigate backwards
          if (controlId === 'first-control') {
            focusFirstEditableCell();
          }
        } else {
          // Navigate forwards
          // Implementation depends on control layout
        }
      } else if (key === 'Escape') {
        event.preventDefault();
        focusFirstEditableCell();
        onNavigateToGrid?.();
      }
    },
    [focusFirstEditableCell, onNavigateToGrid]
  );

  // Global keyboard handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return;

      // Global shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'h':
            event.preventDefault();
            accessibilityManager.current.announce({
              message:
                accessibilityManager.current.getKeyboardInstructions(
                  gridConfig
                ),
              priority: 'assertive',
              category: 'navigation',
            });
            break;
        }
      }
    },
    [disabled, gridConfig]
  );

  // Announce navigation messages
  const announceNavigation = useCallback((message: string) => {
    accessibilityManager.current.announce({
      message,
      priority: 'polite',
      category: 'navigation',
    });
  }, []);

  // Register cell and control references
  const registerCellRef = useCallback(
    (row: number, col: number, element: HTMLElement | null) => {
      const key = getCellKey(row, col);
      if (element) {
        cellRefs.current.set(key, element);
      } else {
        cellRefs.current.delete(key);
      }
    },
    [getCellKey]
  );

  const registerControlRef = useCallback(
    (controlId: string, element: HTMLElement | null) => {
      if (element) {
        controlRefs.current.set(controlId, element);
      } else {
        controlRefs.current.delete(controlId);
      }
    },
    []
  );

  // Set up global keyboard listeners
  useEffect(() => {
    if (disabled) return;

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, disabled]);

  // Initialize keyboard navigation instructions
  useEffect(() => {
    if (!disabled) {
      accessibilityManager.current.updateKeyboardNavigation({
        navigationMode: 'grid',
        tabOrder: [], // Will be populated as elements register
      });
    }
  }, [disabled]);

  return [
    state,
    {
      handleKeyDown,
      handleCellKeyDown,
      handleControlKeyDown,
      focusCell,
      focusNextCell,
      focusPreviousCell,
      focusFirstEditableCell,
      announceNavigation,
      registerCellRef,
      registerControlRef,
    } as KeyboardNavigationHandlers & {
      registerCellRef: (
        row: number,
        col: number,
        element: HTMLElement | null
      ) => void;
      registerControlRef: (
        controlId: string,
        element: HTMLElement | null
      ) => void;
    },
  ];
};
