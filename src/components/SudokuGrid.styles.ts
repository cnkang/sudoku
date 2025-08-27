// SudokuGrid CSS styles - excluded from coverage
export const sudokuGridStyles = `
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
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
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

  .sudoku-grid:hover .sudoku-cell {
    transition: background-color 0.1s;
  }

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

    .fixed-number, .cell-input {
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

    .fixed-number, .cell-input {
      font-size: 0.75rem;
      font-weight: 600;
    }
  }

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

  @media (max-width: 768px) and (orientation: landscape) {
    .sudoku-container {
      margin: 0.5rem 0;
    }

    .sudoku-cell {
      width: 32px;
      height: 32px;
    }

    .fixed-number, .cell-input {
      font-size: 0.875rem;
    }
  }
`;
