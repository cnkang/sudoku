import React from 'react';

interface SudokuGridProps {
  puzzle: number[][];
  userInput: number[][];
  onInputChange: (row: number, col: number, value: number) => void;
}

/**
 * A React component that renders a Sudoku puzzle grid.
 * The grid is made up of table cells, each containing either a fixed number or an input field.
 * The component takes in the following props:
 * - `puzzle`: A 2D array of numbers representing the Sudoku puzzle.
 * - `userInput`: A 2D array of numbers representing the user's input.
 * - `onInputChange`: A callback function to handle changes to the user's input.
 * The component renders a table with the given Sudoku puzzle. Each cell in the table will either
 * display a fixed number from the puzzle, or an input field where the user can enter a number.
 * The user's input is tracked in the `userInput` array.
 */
const SudokuGrid: React.FC<SudokuGridProps> = ({ puzzle, userInput, onInputChange }) => {
  return (
    <table 
      style={{ borderCollapse: 'collapse', marginTop: '20px' }} 
      aria-label="Sudoku puzzle grid"
    >
      <tbody>
        {puzzle.map((row, rowIndex) => (
          <tr key={`row-${rowIndex}`}>
            {row.map((num, colIndex) => {
              const isFixed = num !== 0;
              const cellKey = `row-${rowIndex}-col-${colIndex}`;
              
              return (
                <td
                  key={cellKey}
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