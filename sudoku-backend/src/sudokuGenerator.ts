import { SudokuPuzzle } from './types';
import { solveSudoku } from './dlxSolver';

export function generateSudokuPuzzle(difficulty: number): SudokuPuzzle {
  const board = generateCompleteBoard();
  const puzzle = removeNumbers(board, difficulty);
  return { puzzle, difficulty };
}

function generateCompleteBoard(): number[][] {
  const board: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillBoard(board);
  return board;
}

function fillBoard(board: number[][]): boolean {
  const emptyCell = findEmptyCell(board);
  if (!emptyCell) {
    return true; // 填充完成
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

  return false; // 无法填充
}

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

function isSafe(board: number[][], row: number, col: number, num: number): boolean {
  // 检查行
  if (board[row].includes(num)) {
    return false;
  }

  // 检查列
  for (let r = 0; r < 9; r++) {
    if (board[r][col] === num) {
      return false;
    }
  }

  // 检查小宫
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
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function removeNumbers(board: number[][], difficulty: number): number[][] {
  const puzzle = board.map(row => row.slice());
  let attempts = difficulty * 5 + 20; // 根据难度调整要移除的数字数量

  while (attempts > 0) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);

    if (puzzle[row][col] !== 0) {
      const backup = puzzle[row][col];
      puzzle[row][col] = 0;

      // 检查是否仍有唯一解
      const puzzleCopy = puzzle.map(r => r.slice());
      const solutions: number[][][] = [];
      solveSudoku(puzzleCopy, solutions, 2); // 限制最多找到 2 个解

      if (solutions.length !== 1) {
        puzzle[row][col] = backup; // 恢复数字
        attempts--;
      }
    }
  }

  return puzzle;
}
