import React, { useState, useCallback, useRef } from 'react';

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

  // Check row
  for (let c = 0; c < 9; c++) {
    if (c !== col && userInput[row][c] === value) return true;
  }

  // Check column
  for (let r = 0; r < 9; r++) {
    if (r !== row && userInput[r][col] === value) return true;
  }

  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
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
    const cellRefs = useRef<Map<string, HTMLInputElement>>(new Map());

    const setCellRef = useCallback((key: string) => {
      return (element: HTMLInputElement | null) => {
        if (element) {
          cellRefs.current.set(key, element);
        } else {
          cellRefs.current.delete(key);
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

          switch (key) {
            case 'ArrowUp':
              newRow = Math.max(0, row - 1);
              break;
            case 'ArrowDown':
              newRow = Math.min(8, row + 1);
              break;
            case 'ArrowLeft':
              newCol = Math.max(0, col - 1);
              break;
            case 'ArrowRight':
              newCol = Math.min(8, col + 1);
              break;
          }

          setSelectedCell({ row: newRow, col: newCol });
          // Focus the new cell using ref
          const newCellKey = generateCellKey(newRow, newCol);
          const newCell = cellRefs.current.get(newCellKey);
          newCell?.focus();
        }
      },
      [disabled, onInputChange]
    );
    return (
      <div className="sudoku-container">
        <table className="sudoku-grid" aria-label="Sudoku puzzle grid">
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
                      className={`sudoku-cell ${isFixed ? 'fixed' : 'editable'} ${isSelected ? 'selected' : ''} ${hasError ? 'error' : ''} ${isHinted ? 'hinted' : ''}`}
                      style={borderStyle}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                    >
                      {isFixed ? (
                        <span className="fixed-number">{num}</span>
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
                          className="cell-input"
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

        <style jsx>{`
          .sudoku-container {
            display: flex;
            justify-content: center;
            margin: 2rem 0;
          }

          .sudoku-grid {
            border-collapse: collapse;
            background-color: white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            overflow: hidden;
          }

          .sudoku-cell {
            width: 45px;
            height: 45px;
            position: relative;
            background-color: white;
            transition: background-color 0.2s;
          }

          .sudoku-cell:nth-child(3n) {
            border-right: 4px solid #1f2937;
          }

          tr:nth-child(3n) .sudoku-cell {
            border-bottom: 4px solid #1f2937;
          }

          .sudoku-cell.editable:hover {
            background-color: #f3f4f6;
          }

          .sudoku-cell.selected {
            background-color: #dbeafe !important;
          }

          .sudoku-cell.error {
            background-color: #fee2e2 !important;
          }

          .sudoku-cell.hinted {
            background-color: #fef3c7 !important;
            animation: pulse 1s ease-in-out 3;
          }

          @keyframes pulse {
            0%,
            100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }

          .fixed-number {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            font-size: 1.25rem;
            font-weight: 700;
            color: #1f2937;
          }

          .cell-input {
            width: 100%;
            height: 100%;
            border: none;
            outline: none;
            text-align: center;
            font-size: 1.25rem;
            font-weight: 600;
            color: #3b82f6;
            background: transparent;
            cursor: pointer;
          }

          .cell-input:disabled {
            cursor: not-allowed;
            opacity: 0.5;
          }

          .cell-input:focus {
            background-color: #dbeafe;
          }

          /* Highlight same numbers */
          .sudoku-grid:hover .sudoku-cell {
            transition: background-color 0.1s;
          }

          /* 移动端优化 */
          @media (max-width: 640px) {
            .sudoku-container {
              margin: 1rem 0;
              padding: 0 0.5rem;
            }

            .sudoku-grid {
              border-radius: 6px;
            }

            .sudoku-cell {
              width: 35px;
              height: 35px;
            }

            .fixed-number,
            .cell-input {
              font-size: 1rem;
            }
          }

          @media (max-width: 480px) {
            .sudoku-container {
              margin: 0.75rem 0;
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
            }

            .sudoku-grid {
              min-width: 270px;
              margin: 0 auto;
            }

            .sudoku-cell {
              width: 30px;
              height: 30px;
              min-width: 30px;
              min-height: 30px;
            }

            .fixed-number,
            .cell-input {
              font-size: 0.75rem;
              font-weight: 600;
            }
          }

          /* 触摸设备优化 */
          @media (hover: none) and (pointer: coarse) {
            .sudoku-cell {
              min-width: 44px;
              min-height: 44px;
            }

            .cell-input {
              -webkit-user-select: none;
              user-select: none;
              -webkit-tap-highlight-color: transparent;
            }

            .sudoku-cell.editable:hover {
              background-color: white;
            }
          }

          /* 横屏模式 */
          @media (max-width: 768px) and (orientation: landscape) {
            .sudoku-container {
              margin: 0.5rem 0;
            }

            .sudoku-cell {
              width: 32px;
              height: 32px;
            }

            .fixed-number,
            .cell-input {
              font-size: 0.875rem;
            }
          }
        `}</style>
      </div>
    );
  }
);

SudokuGrid.displayName = 'SudokuGrid';

export default SudokuGrid;
