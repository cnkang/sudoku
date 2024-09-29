import React from 'react';

interface SudokuGridProps {
  puzzle: number[][];
}

const SudokuGrid: React.FC<SudokuGridProps> = ({ puzzle }) => {
  return (
    <table style={{ borderCollapse: 'collapse', marginTop: '20px' }}>
      <tbody>
        {puzzle.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((num, colIndex) => (
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
                {num !== 0 ? num : ''}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default SudokuGrid;

