import React from 'react';

interface SudokuGridProps {
  puzzle: number[][];
  userInput: number[][];
  onInputChange: (row: number, col: number, value: number) => void;
}

/**
 * A 9x9 grid to display a Sudoku puzzle and allow user input.
 * The grid is rendered as a table with each cell containing a number input.
 * Cells containing fixed numbers are rendered as plain text.
 * Aria-labels are provided for accessibility.
 * @param {{ puzzle: number[][], userInput: number[][], onInputChange: (row: number, col: number, value: number) => void }} props
 * @returns {JSX.Element}
 */
const SudokuGrid: React.FC<SudokuGridProps> = ({ puzzle, userInput, onInputChange }) => {
  return (
    <table 
      style={{ borderCollapse: 'collapse', marginTop: '20px' }} 
      aria-label="Sudoku puzzle grid"
    >
      <tbody>
        {puzzle.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((num, colIndex) => {
              const isFixed = num !== 0;
              return (
                <td
                  key={colIndex}
                  style={{
                    border: '1px solid #000',
                    width: '40px',
                    height: '40px',
                    textAlign: 'center',
                    fontSize: '20px',
                  }}
                  aria-label={`Row ${rowIndex + 1} Column ${colIndex + 1}`}
                >
                  {isFixed ? (
                    <span>{num}</span> // Fixed number display
                  ) : (
                    <input
                      type="number"
                      min="1"
                      max="9"
                      value={userInput[rowIndex][colIndex] || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        if (!isNaN(value) && value >= 1 && value <= 9) {
                          onInputChange(rowIndex, colIndex, value);
                        } else if (e.target.value === '') {
                          onInputChange(rowIndex, colIndex, 0); // Allow clearing
                        }
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        textAlign: 'center',
                        fontSize: '20px',
                        outline: 'none',
                      }}
                      aria-label={`Editable cell. Row ${rowIndex + 1} Column ${colIndex + 1}`}
                      onKeyDown={(e) => {
                        // Prevent non-numeric input
                        if (!/[1-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete') {
                          e.preventDefault();
                        }
                      }}
                    />
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default SudokuGrid;
