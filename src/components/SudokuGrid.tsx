import React, { useState, useCallback, useRef } from 'react';
import styles from './SudokuGrid.module.css';
import { VALIDATION_CONSTANTS } from '@/utils/validation';

interface SudokuGridProps {
  puzzle: number[][];
  userInput: number[][];
  onInputChange: (row: number, col: number, value: number) => void;
  disabled?: boolean;
  hintCell?: { row: number; col: number } | null;
}

interface CellPosition {
  row: number;
  col: number;
}

const generateCellKey = (row: number, col: number) => `cell-${row}-${col}`;

const getCellBorderStyle = (row: number, col: number) => {
  const borderStyle = {
    borderTop: row % 3 === 0 ? '4px solid #1f2937' : '1px solid #d1d5db',
    borderLeft: col % 3 === 0 ? '4px solid #1f2937' : '1px solid #d1d5db',
    borderRight:
      col === 8
        ? '4px solid #1f2937'
        : col % 3 === 2
          ? '4px solid #1f2937'
          : '1px solid #d1d5db',
    borderBottom:
      row === 8
        ? '4px solid #1f2937'
        : row % 3 === 2
          ? '4px solid #1f2937'
          : '1px solid #d1d5db',
  };
  return borderStyle;
};

const hasConflict = (
  userInput: number[][],
  row: number,
  col: number,
  value: number
): boolean => {
  if (value === 0) return false;

  const { SUDOKU_SIZE, BOX_SIZE } = VALIDATION_CONSTANTS;

  // Check row
  for (let c = 0; c < SUDOKU_SIZE; c++) {
    if (c !== col && userInput[row][c] === value) return true;
  }

  // Check column
  for (let r = 0; r < SUDOKU_SIZE; r++) {
    if (r !== row && userInput[r][col] === value) return true;
  }

  // Check 3x3 box
  const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
  for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
    for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
      if ((r !== row || c !== col) && userInput[r][c] === value) return true;
    }
  }

  return false;
};

/**
 * Enhanced Sudoku grid component with visual improvements and conflict detection
 */
const SudokuGrid = React.memo<SudokuGridProps>(
  ({ puzzle, userInput, onInputChange, disabled = false, hintCell = null }) => {
    const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
    const cellRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const setCellRef = useCallback((key: string) => {
      return (element: HTMLInputElement | null) => {
        if (element) {
          cellRefs.current[key] = element;
        } else {
          delete cellRefs.current[key];
        }
      };
    }, []);

    const handleCellClick = useCallback(
      (row: number, col: number) => {
        if (puzzle[row][col] === 0) {
          // Only select editable cells
          setSelectedCell({ row, col });
        }
      },
      [puzzle]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent, row: number, col: number) => {
        if (disabled) return;

        const { key } = e;

        // Handle number input
        if (/[1-9]/.test(key)) {
          e.preventDefault();
          const value = parseInt(key, 10);
          onInputChange(row, col, value);
        }
        // Handle deletion
        else if (key === 'Backspace' || key === 'Delete' || key === '0') {
          e.preventDefault();
          onInputChange(row, col, 0);
        }
        // Handle navigation
        else if (
          ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)
        ) {
          e.preventDefault();
          let newRow = row;
          let newCol = col;
          const maxIndex = VALIDATION_CONSTANTS.SUDOKU_SIZE - 1;

          switch (key) {
            case 'ArrowUp':
              newRow = Math.max(0, row - 1);
              break;
            case 'ArrowDown':
              newRow = Math.min(maxIndex, row + 1);
              break;
            case 'ArrowLeft':
              newCol = Math.max(0, col - 1);
              break;
            case 'ArrowRight':
              newCol = Math.min(maxIndex, col + 1);
              break;
          }

          setSelectedCell({ row: newRow, col: newCol });
          // Focus the new cell using ref
          const newCellKey = generateCellKey(newRow, newCol);
          const newCell = cellRefs.current[newCellKey];
          newCell?.focus();
        }
      },
      [disabled, onInputChange]
    );
    return (
      <div className={styles.sudokuContainer} data-testid="sudoku-container">
        <table
          className={styles.sudokuGrid}
          aria-label="Sudoku puzzle grid"
          data-testid="sudoku-grid"
        >
          <tbody>
            {puzzle.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                {row.map((num, colIndex) => {
                  const isFixed = num !== 0;
                  const cellKey = generateCellKey(rowIndex, colIndex);
                  const currentValue = userInput[rowIndex][colIndex];
                  const isSelected =
                    selectedCell?.row === rowIndex &&
                    selectedCell?.col === colIndex;
                  const isHinted =
                    hintCell?.row === rowIndex && hintCell?.col === colIndex;
                  const hasError =
                    !isFixed &&
                    currentValue !== 0 &&
                    hasConflict(userInput, rowIndex, colIndex, currentValue);
                  const borderStyle = getCellBorderStyle(rowIndex, colIndex);

                  return (
                    <td
                      key={cellKey}
                      className={`${styles.sudokuCell} ${isFixed ? 'fixed' : 'editable'} ${isSelected ? styles.selected : ''} ${hasError ? styles.error : ''} ${isHinted ? styles.hinted : ''}`}
                      style={borderStyle}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      data-testid={`sudoku-cell-${rowIndex}-${colIndex}`}
                      data-cell-type={isFixed ? 'fixed' : 'editable'}
                      data-has-error={hasError}
                      data-is-hinted={isHinted}
                      data-is-selected={isSelected}
                    >
                      {isFixed ? (
                        <span
                          className={styles.fixedNumber}
                          data-testid="fixed-number"
                        >
                          {num}
                        </span>
                      ) : (
                        <input
                          ref={setCellRef(cellKey)}
                          id={cellKey}
                          type="text"
                          inputMode="numeric"
                          value={currentValue || ''}
                          onChange={e => {
                            const value = e.target.value;
                            if (value === '' || /^[1-9]$/.test(value)) {
                              onInputChange(
                                rowIndex,
                                colIndex,
                                value === '' ? 0 : parseInt(value, 10)
                              );
                            }
                          }}
                          onKeyDown={e => handleKeyDown(e, rowIndex, colIndex)}
                          onFocus={() =>
                            setSelectedCell({ row: rowIndex, col: colIndex })
                          }
                          onBlur={() => setSelectedCell(null)}
                          disabled={disabled}
                          className={styles.cellInput}
                          aria-label={`Editable cell. Row ${rowIndex + 1} Column ${colIndex + 1}`}
                          maxLength={1}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
);

SudokuGrid.displayName = 'SudokuGrid';

export default SudokuGrid;
