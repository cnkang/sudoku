import type { GridConfig } from '@/types';
import { validateMove } from '@/utils/gridConfig';

export function solveSudoku(
  board: number[][],
  solutions: number[][][] = [],
  maxSolutions: number = 2,
  config?: GridConfig
): boolean {
  // For non-9x9 grids, always use custom backtracking solver
  if (config && config.size !== 9) {
    const boardCopy = board.map(row => row.slice());
    return solveWithBacktracking(boardCopy, config, solutions, maxSolutions);
  }

  // For 9x9 grids, try to use the fast library, fallback to custom solver
  try {
    // Dynamic import to avoid module loading issues
    const { solveSudoku: solverSolveSudoku } = require('fast-sudoku-solver');
    const [isSolvable, solution] = solverSolveSudoku(board);
    if (isSolvable) {
      solutions.push(solution);
    }
    return solutions.length >= maxSolutions;
  } catch (_error) {
    // Fallback to custom solver for 9x9
    const config9x9: GridConfig = {
      size: 9,
      boxRows: 3,
      boxCols: 3,
      maxValue: 9,
      minClues: 22,
      maxClues: 61,
      difficultyLevels: 10,
      cellSize: { desktop: 45, tablet: 40, mobile: 35 },
      childFriendly: {
        enableAnimations: false,
        showHelpText: false,
        useExtraLargeTargets: false,
      },
    };

    const boardCopy = board.map(row => row.slice());
    return solveWithBacktracking(boardCopy, config9x9, solutions, maxSolutions);
  }
}

// Custom backtracking solver for non-9x9 grids
function solveWithBacktracking(
  board: number[][],
  config: GridConfig,
  solutions: number[][][],
  maxSolutions: number
): boolean {
  const emptyCell = findEmptyCell(board, config);
  if (!emptyCell) {
    // Board is complete, add to solutions
    solutions.push(board.map(row => row.slice()));
    return solutions.length >= maxSolutions;
  }

  const [row, col] = emptyCell;

  for (let num = 1; num <= config.maxValue; num++) {
    if (validateMove(config, board, row, col, num)) {
      const rowValues = board[row];
      if (rowValues) {
        rowValues[col] = num;

        if (solveWithBacktracking(board, config, solutions, maxSolutions)) {
          return true;
        }

        rowValues[col] = 0;
      }
    }
  }

  return false;
}

// Find first empty cell in the board
function findEmptyCell(
  board: number[][],
  config: GridConfig
): [number, number] | null {
  for (let row = 0; row < config.size; row++) {
    for (let col = 0; col < config.size; col++) {
      if (board[row]?.[col] === 0) {
        return [row, col];
      }
    }
  }
  return null;
}
