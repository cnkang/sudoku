import crypto from 'node:crypto';
import type { GridConfig } from '@/types';
import { getConfig, validateMove } from '@/utils/gridConfig';
import { solveSudoku } from './dlxSolver';
import type { SudokuPuzzle } from './types';

const logger = {
  debug: (message: string) => {
    if (process.env.NODE_ENV === 'development') {
      // biome-ignore lint/suspicious/noConsole: intentional logging for development
      console.debug(`[sudoku-generator] ${message}`);
    }
  },
  warn: (message: string) => {
    // biome-ignore lint/suspicious/noConsole: intentional logging for warnings
    console.warn(`[sudoku-generator] ${message}`);
  },
};

// Generates a Sudoku puzzle based on the provided difficulty and grid configuration.
export async function generateSudokuPuzzle(
  difficulty: number,
  gridSize: 4 | 6 | 9 = 9,
  seed?: string,
): Promise<SudokuPuzzle> {
  const config = getConfig(gridSize);
  const randomInt = createRandomInt(seed);
  const board = generateCompleteBoard(config, randomInt);
  logger.debug(`Complete ${config.size}×${config.size} board generated: ${JSON.stringify(board)}`);
  const puzzle = await removeNumbers(board, difficulty, config, randomInt);
  logger.debug(
    `Puzzle generated with difficulty: ${difficulty} for ${config.size}×${config.size} grid`,
  );
  return { puzzle, solution: board, difficulty };
}

// Generates a complete solved Sudoku board for any grid size.
function generateCompleteBoard(config: GridConfig, randomInt: RandomInt): number[][] {
  const board: number[][] = Array.from({ length: config.size }, () =>
    Array.from({ length: config.size }, () => 0),
  );
  fillBoard(board, config, randomInt);
  return board;
}

// Recursively fills the board using backtracking for any grid size.
function fillBoard(board: number[][], config: GridConfig, randomInt: RandomInt): boolean {
  const emptyCell = findEmptyCell(board, config);
  if (!emptyCell) {
    return true;
  }

  const [row, col] = emptyCell;
  const numbers = shuffleArray(
    Array.from({ length: config.maxValue }, (_, i) => i + 1),
    randomInt,
  );
  const rowValues = board[row];
  if (!rowValues) {
    return false;
  }

  for (const num of numbers) {
    if (isSafe(board, row, col, num, config)) {
      rowValues[col] = num;
      if (fillBoard(board, config, randomInt)) {
        return true;
      }
      rowValues[col] = 0;
    }
  }

  return false;
}

// Finds the first empty cell in the board for any grid size.
function findEmptyCell(board: number[][], config: GridConfig): [number, number] | null {
  for (let row = 0; row < config.size; row++) {
    const rowValues = board[row];
    if (!rowValues) {
      continue;
    }
    for (let col = 0; col < config.size; col++) {
      if (rowValues[col] === 0) {
        return [row, col];
      }
    }
  }
  return null;
}

// Checks if placing a number at a position is safe according to Sudoku rules for any grid size.
function isSafe(
  board: number[][],
  row: number,
  col: number,
  num: number,
  config: GridConfig,
): boolean {
  // Use the existing validateMove function which handles all grid sizes
  return validateMove(config, board, row, col, num);
}

function shuffleArray(array: number[], randomInt: RandomInt): number[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const current = shuffled[i];
    const target = shuffled[j];
    if (current === undefined || target === undefined) {
      continue;
    }
    shuffled[i] = target;
    shuffled[j] = current;
  }
  return shuffled;
}

// Removes numbers from a complete board to create a puzzle with appropriate difficulty for any grid size.
async function removeNumbers(
  board: number[][],
  difficulty: number,
  config: GridConfig,
  randomInt: RandomInt,
): Promise<number[][]> {
  const puzzle = board.map((row) => row.slice());
  const totalCells = config.size * config.size;
  const cluesCount = getCluesCount(difficulty, config);
  let cellsToRemove = totalCells - cluesCount;

  const positions = shuffleArray(
    Array.from({ length: totalCells }, (_, index) => index),
    randomInt,
  );
  let attempts = 0;
  for (const position of positions) {
    if (cellsToRemove === 0) break;
    attempts++;
    const row = Math.floor(position / config.size);
    const col = position % config.size;
    const puzzleRow = puzzle[row];
    if (!puzzleRow) {
      continue;
    }

    const cellValue = puzzleRow[col];
    if (cellValue === undefined || cellValue === 0) {
      continue;
    }

    const backup = cellValue;
    puzzleRow[col] = 0;

    const puzzleCopy = puzzle.map((r) => r.slice());
    const solutions: number[][][] = [];
    await solveSudoku(puzzleCopy, solutions, 2, config);

    if (solutions.length === 1) {
      logger.debug(
        `Removed number at (${row}, ${col}) - Unique solution preserved for ${config.size}×${config.size} grid`,
      );
      cellsToRemove--;
    } else {
      logger.debug(
        `Restoring number at (${row}, ${col}) - Multiple solutions for ${config.size}×${config.size} grid`,
      );
      puzzleRow[col] = backup;
    }
  }

  // Log if we couldn't remove all desired cells
  if (cellsToRemove > 0) {
    logger.warn(
      `Could not remove all desired cells for ${config.size}×${config.size} grid difficulty ${difficulty}. ` +
        `Remaining cells to remove: ${cellsToRemove}, Attempts: ${attempts}`,
    );
  }

  logger.debug(`Final ${config.size}×${config.size} puzzle: ${JSON.stringify(puzzle)}`);
  return puzzle;
}

// Calculates the number of clues based on difficulty and grid configuration.
function getCluesCount(difficulty: number, config: GridConfig): number {
  const validDifficulty = Math.min(Math.max(difficulty, 1), config.difficultyLevels);

  // Calculate clues based on grid size and difficulty
  const difficultyRatio = (validDifficulty - 1) / (config.difficultyLevels - 1);
  const cluesRange = config.maxClues - config.minClues;
  const cluesCount = Math.round(config.maxClues - difficultyRatio * cluesRange);

  return Math.max(config.minClues, Math.min(config.maxClues, cluesCount));
}

// Seeded requests are reproducible; ordinary requests retain cryptographic randomness.
type RandomInt = (limit: number) => number;
function createRandomInt(seed?: string): RandomInt {
  if (seed === undefined) return (limit) => crypto.randomInt(0, limit);
  let state = 2166136261;
  for (const character of seed) state = Math.imul(state ^ character.charCodeAt(0), 16777619);
  return (limit) => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return Math.floor((((value ^ (value >>> 14)) >>> 0) / 4294967296) * limit);
  };
}
