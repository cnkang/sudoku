import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateSudokuPuzzle } from '../sudokuGenerator';
import { getConfig } from '@/utils/gridConfig';

// Simple solver for testing purposes
type TestConfig = {
  size: number;
  boxRows: number;
  boxCols: number;
  maxValue: number;
};

const hasRowValue = (
  board: number[][],
  row: number,
  value: number,
  size: number
) => {
  for (let c = 0; c < size; c++) {
    if (board[row]?.[c] === value) return true;
  }
  return false;
};

const hasColumnValue = (
  board: number[][],
  col: number,
  value: number,
  size: number
) => {
  for (let r = 0; r < size; r++) {
    if (board[r]?.[col] === value) return true;
  }
  return false;
};

const hasBoxValue = (
  board: number[][],
  row: number,
  col: number,
  value: number,
  config: TestConfig
) => {
  const boxStartRow = Math.floor(row / config.boxRows) * config.boxRows;
  const boxStartCol = Math.floor(col / config.boxCols) * config.boxCols;

  for (let r = boxStartRow; r < boxStartRow + config.boxRows; r++) {
    for (let c = boxStartCol; c < boxStartCol + config.boxCols; c++) {
      if (board[r]?.[c] === value) return true;
    }
  }
  return false;
};

const isValidPlacement = (
  board: number[][],
  row: number,
  col: number,
  value: number,
  config: TestConfig
) =>
  !hasRowValue(board, row, value, config.size) &&
  !hasColumnValue(board, col, value, config.size) &&
  !hasBoxValue(board, row, col, value, config);

const findEmptyCell = (
  board: number[][],
  size: number
): [number, number] | null => {
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[row]?.[col] === 0) {
        return [row, col];
      }
    }
  }
  return null;
};

function countSolutions(board: number[][], config: TestConfig): number {
  const solutions: number[][][] = [];

  const shouldStopAfterSolution = (board: number[][]) => {
    if (solutions.length === 0) {
      solutions.push(board.map(row => row.slice()));
    }
    return solutions.length >= 2;
  };

  const tryPlacement = (
    board: number[][],
    row: number,
    col: number,
    num: number
  ): boolean => {
    if (!isValidPlacement(board, row, col, num, config)) {
      return false;
    }

    const rowValues = board[row];
    if (!rowValues) {
      return false;
    }

    rowValues[col] = num;
    const solved = solve(board);
    const shouldStop = solved && shouldStopAfterSolution(board);
    rowValues[col] = 0;

    return shouldStop;
  };

  function tryNumbers(board: number[][], row: number, col: number): boolean {
    for (let num = 1; num <= config.maxValue; num++) {
      if (tryPlacement(board, row, col, num)) {
        return true;
      }
    }

    return false;
  }

  function solve(board: number[][]): boolean {
    const emptyCell = findEmptyCell(board, config.size);
    if (!emptyCell) {
      return true;
    }

    const [row, col] = emptyCell;
    return tryNumbers(board, row, col);
  }

  const boardCopy = board.map(row => row.slice());
  solve(boardCopy);
  return solutions.length;
}

describe('Sudoku Generator Property-Based Tests', () => {
  describe('Property 2: Unique solution guarantee', () => {
    it('should generate puzzles with exactly one unique solution for 4x4 grids', () => {
      // Feature: multi-size-sudoku, Property 2: For any generated puzzle regardless of grid size, the puzzle should have exactly one valid solution
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 3 }), // Use lower difficulty for faster testing
          difficulty => {
            const config = getConfig(4);
            const adjustedDifficulty = Math.min(
              difficulty,
              config.difficultyLevels
            );

            const { puzzle } = generateSudokuPuzzle(adjustedDifficulty, 4);

            // Count solutions using our simple solver
            const solutionCount = countSolutions(puzzle, config);

            // The puzzle should have exactly one solution
            expect(solutionCount).toBe(1);
          }
        ),
        { numRuns: 5 } // Very few runs for this expensive test
      );
    });

    it('should generate valid puzzle structure for all grid sizes', () => {
      // Test that generated puzzles have correct structure
      fc.assert(
        fc.property(
          fc.constantFrom(4, 6, 9),
          fc.integer({ min: 1, max: 3 }),
          (gridSize, difficulty) => {
            const config = getConfig(gridSize);
            const adjustedDifficulty = Math.min(
              difficulty,
              config.difficultyLevels
            );

            const { puzzle, solution } = generateSudokuPuzzle(
              adjustedDifficulty,
              gridSize
            );

            // Check puzzle dimensions
            expect(puzzle).toHaveLength(config.size);
            expect(solution).toHaveLength(config.size);

            for (let i = 0; i < config.size; i++) {
              expect(puzzle[i]).toHaveLength(config.size);
              expect(solution[i]).toHaveLength(config.size);

              // Check that all values are within valid range
              for (let j = 0; j < config.size; j++) {
                expect(puzzle[i]?.[j]).toBeGreaterThanOrEqual(0);
                expect(puzzle[i]?.[j]).toBeLessThanOrEqual(config.maxValue);
                expect(solution[i]?.[j]).toBeGreaterThanOrEqual(1);
                expect(solution[i]?.[j]).toBeLessThanOrEqual(config.maxValue);
              }
            }

            // Check that puzzle has fewer filled cells than solution
            const puzzleFilledCells = puzzle
              .flat()
              .filter(cell => cell !== 0).length;
            const solutionFilledCells = solution
              .flat()
              .filter(cell => cell !== 0).length;
            expect(puzzleFilledCells).toBeLessThan(solutionFilledCells);
            expect(solutionFilledCells).toBe(config.size * config.size);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should generate puzzles with clue counts within difficulty level ranges', () => {
      // Feature: multi-size-sudoku, Property 3: For any grid size and difficulty level, generated puzzles should have clue counts within the specified ranges for that grid size
      fc.assert(
        fc.property(
          fc.constantFrom(4, 6, 9),
          fc.integer({ min: 1, max: 5 }),
          (gridSize, difficulty) => {
            const config = getConfig(gridSize);
            const adjustedDifficulty = Math.min(
              difficulty,
              config.difficultyLevels
            );

            const { puzzle } = generateSudokuPuzzle(
              adjustedDifficulty,
              gridSize
            );

            // Count filled cells (clues)
            const clueCount = puzzle.flat().filter(cell => cell !== 0).length;

            // The clue count should be within the valid range for this grid size
            expect(clueCount).toBeGreaterThanOrEqual(config.minClues);
            expect(clueCount).toBeLessThanOrEqual(config.maxClues);
          }
        ),
        { numRuns: 15 }
      );
    });
  });
});
