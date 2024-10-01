import React from 'react';

interface SudokuGridProps {
  puzzle: number[][];
  userInput: number[][];
  onInputChange: (row: number, col: number, value: number) => void;
}

const SudokuGrid: React.FC<SudokuGridProps> = ({ puzzle, userInput, onInputChange }) => {
  return (
    <table style={{ borderCollapse: 'collapse', marginTop: '20px' }}>
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
                >
                  {isFixed ? (
                    num // Fixed number display
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
