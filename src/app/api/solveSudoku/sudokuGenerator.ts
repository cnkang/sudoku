import winston from "winston";
import type { SudokuPuzzle } from "./types";
import type { GridConfig } from "@/types";
import { solveSudoku } from "./dlxSolver";
import { shuffle } from "lodash";
import crypto from "node:crypto";
import { getConfig, validateMove } from "@/utils/gridConfig";

// Configure logging
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

// Generates a Sudoku puzzle based on the provided difficulty and grid configuration.
export async function generateSudokuPuzzle(
  difficulty: number,
  gridSize: 4 | 6 | 9 = 9
): Promise<SudokuPuzzle> {
  const config = getConfig(gridSize);
  const board = generateCompleteBoard(config);
  logger.debug(
    `Complete ${config.size}×${config.size} board generated: ${JSON.stringify(
      board
    )}`
  );
  const puzzle = await removeNumbers(board, difficulty, config);
  logger.debug(
    `Puzzle generated with difficulty: ${difficulty} for ${config.size}×${config.size} grid`
  );
  return { puzzle, solution: board, difficulty };
}

// Generates a complete solved Sudoku board for any grid size.
function generateCompleteBoard(config: GridConfig): number[][] {
  const board: number[][] = Array.from({ length: config.size }, () =>
    Array(config.size).fill(0)
  );
  fillBoard(board, config);
  return board;
}

// Recursively fills the board using backtracking for any grid size.
function fillBoard(board: number[][], config: GridConfig): boolean {
  const emptyCell = findEmptyCell(board, config);
  if (!emptyCell) {
    return true;
  }

  const [row, col] = emptyCell;
  const numbers = shuffleArray(
    Array.from({ length: config.maxValue }, (_, i) => i + 1)
  );
  const rowValues = board[row];
  if (!rowValues) {
    return false;
  }

  for (const num of numbers) {
    if (isSafe(board, row, col, num, config)) {
      rowValues[col] = num;
      if (fillBoard(board, config)) {
        return true;
      }
      rowValues[col] = 0;
    }
  }

  return false;
}

// Finds the first empty cell in the board for any grid size.
function findEmptyCell(
  board: number[][],
  config: GridConfig
): [number, number] | null {
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
  config: GridConfig
): boolean {
  // Use the existing validateMove function which handles all grid sizes
  return validateMove(config, board, row, col, num);
}

function shuffleArray(array: number[]): number[] {
  return shuffle(array);
}

// Removes numbers from a complete board to create a puzzle with appropriate difficulty for any grid size.
async function removeNumbers(
  board: number[][],
  difficulty: number,
  config: GridConfig
): Promise<number[][]> {
  const puzzle = board.map((row) => row.slice());
  const totalCells = config.size * config.size;
  const cluesCount = getCluesCount(difficulty, config);
  let cellsToRemove = totalCells - cluesCount;

  // Add safety limits to prevent infinite loops
  const maxAttempts = totalCells * 10; // Maximum attempts to remove a cell
  let attempts = 0;
  let consecutiveFailures = 0;
  const maxConsecutiveFailures = totalCells; // Stop if we fail too many times in a row

  while (
    cellsToRemove > 0 &&
    attempts < maxAttempts &&
    consecutiveFailures < maxConsecutiveFailures
  ) {
    attempts++;
    const row = crypto.randomInt(0, config.size);
    const col = crypto.randomInt(0, config.size);
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
        `Removed number at (${row}, ${col}) - Unique solution preserved for ${config.size}×${config.size} grid`
      );
      cellsToRemove--;
      consecutiveFailures = 0; // Reset failure counter on success
    } else {
      logger.debug(
        `Restoring number at (${row}, ${col}) - Multiple solutions for ${config.size}×${config.size} grid`
      );
      puzzleRow[col] = backup;
      consecutiveFailures++;
    }
  }

  // Log if we couldn't remove all desired cells
  if (cellsToRemove > 0) {
    logger.warn(
      `Could not remove all desired cells for ${config.size}×${config.size} grid difficulty ${difficulty}. ` +
        `Remaining cells to remove: ${cellsToRemove}, Attempts: ${attempts}, Consecutive failures: ${consecutiveFailures}`
    );
  }

  logger.debug(
    `Final ${config.size}×${config.size} puzzle: ${JSON.stringify(puzzle)}`
  );
  return puzzle;
}

// Calculates the number of clues based on difficulty and grid configuration.
function getCluesCount(difficulty: number, config: GridConfig): number {
  const validDifficulty = Math.min(
    Math.max(difficulty, 1),
    config.difficultyLevels
  );

  // Calculate clues based on grid size and difficulty
  const difficultyRatio = (validDifficulty - 1) / (config.difficultyLevels - 1);
  const cluesRange = config.maxClues - config.minClues;
  const cluesCount = Math.round(config.maxClues - difficultyRatio * cluesRange);

  return Math.max(config.minClues, Math.min(config.maxClues, cluesCount));
}
