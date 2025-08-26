import winston from 'winston';
import { SudokuPuzzle } from './types';
import { solveSudoku } from './dlxSolver';
import { shuffle } from 'lodash';
import crypto from 'crypto';

// 配置日志
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

// Generates a Sudoku puzzle based on the provided difficulty.
export function generateSudokuPuzzle(difficulty: number): SudokuPuzzle {
  const board = generateCompleteBoard();
  logger.debug(`Complete board generated: ${JSON.stringify(board)}`);
  const puzzle = removeNumbers(board, difficulty);
  logger.debug(`Puzzle generated with difficulty: ${difficulty}`);
  return { puzzle, solution: board, difficulty };
}

// Generates a complete solved Sudoku board.
function generateCompleteBoard(): number[][] {
  const board: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillBoard(board);
  return board;
}

// Recursively fills the board using backtracking.
function fillBoard(board: number[][]): boolean {
  const emptyCell = findEmptyCell(board);
  if (!emptyCell) {
    return true;
  }

  const [row, col] = emptyCell;
  const numbers = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);

  for (const num of numbers) {
    if (isSafe(board, row, col, num)) {
      board[row][col] = num;
      if (fillBoard(board)) {
        return true;
      }
      board[row][col] = 0;
    }
  }

  return false;
}

// Finds the first empty cell in the board.
function findEmptyCell(board: number[][]): [number, number] | null {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        return [row, col];
      }
    }
  }
  return null;
}

function isSafe(
  board: number[][],
  row: number,
  col: number,
  num: number
): boolean {
  if (board[row].includes(num)) {
    return false;
  }

  for (let r = 0; r < 9; r++) {
    if (board[r][col] === num) {
      return false;
    }
  }

  const startRow = row - (row % 3);
  const startCol = col - (col % 3);

  for (let r = startRow; r < startRow + 3; r++) {
    for (let c = startCol; c < startCol + 3; c++) {
      if (board[r][c] === num) {
        return false;
      }
    }
  }

  return true;
}

function shuffleArray(array: number[]): number[] {
  return shuffle(array);
}

function removeNumbers(board: number[][], difficulty: number): number[][] {
  const puzzle = board.map(row => row.slice());
  const totalCells = 81;
  const cluesCount = getCluesCount(difficulty);
  let cellsToRemove = totalCells - cluesCount;

  while (cellsToRemove > 0) {
    const row = crypto.randomInt(0, 9);
    const col = crypto.randomInt(0, 9);

    if (puzzle[row][col] !== 0) {
      const backup = puzzle[row][col];
      puzzle[row][col] = 0;

      const puzzleCopy = puzzle.map(r => r.slice());
      const solutions: number[][][] = [];
      solveSudoku(puzzleCopy, solutions, 2);

      if (solutions.length === 1) {
        logger.debug(
          `Removed number at (${row}, ${col}) - Unique solution preserved`
        );
        cellsToRemove--;
      } else {
        logger.debug(
          `Restoring number at (${row}, ${col}) - Multiple solutions`
        );
        puzzle[row][col] = backup;
      }
    }
  }

  logger.debug(`Final puzzle: ${JSON.stringify(puzzle)}`);
  return puzzle;
}

function getCluesCount(difficulty: number): number {
  const validDifficulty = Math.min(Math.max(difficulty, 1), 10);
  return 61 - 3 * (validDifficulty - 1);
}
