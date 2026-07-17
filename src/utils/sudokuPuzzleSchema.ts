import type { SudokuPuzzle } from '@/types';
import { GRID_CONFIGS } from '@/utils/gridConfig';

const supportedGridSizes = new Set(Object.keys(GRID_CONFIGS).map(Number));

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseMatrix(
  value: unknown,
  name: 'puzzle' | 'solution',
  size: number,
  minimum: number,
): number[][] {
  if (!Array.isArray(value) || value.length !== size) {
    throw new TypeError(`${name} must be a ${size}x${size} matrix`);
  }

  const matrix: number[][] = [];
  for (const row of value) {
    if (!Array.isArray(row) || row.length !== size) {
      throw new TypeError(`${name} must be a ${size}x${size} matrix`);
    }

    const parsedRow: number[] = [];
    for (const cell of row) {
      if (!Number.isInteger(cell) || cell < minimum || cell > size) {
        throw new TypeError(`${name} cells must be integers between ${minimum} and ${size}`);
      }
      parsedRow.push(cell);
    }
    matrix.push(parsedRow);
  }

  return matrix;
}

export function parseSudokuPuzzle(value: unknown): SudokuPuzzle {
  if (!isRecord(value) || !Array.isArray(value.puzzle)) {
    throw new TypeError('Puzzle response must contain a puzzle matrix');
  }

  const size = value.puzzle.length;
  if (!supportedGridSizes.has(size)) {
    throw new TypeError('Puzzle grid size must be 4, 6, or 9');
  }

  if (!Array.isArray(value.solution)) {
    throw new TypeError('Puzzle response must contain a solution matrix');
  }

  const gridConfig = GRID_CONFIGS[size as keyof typeof GRID_CONFIGS];
  const maxDifficulty = gridConfig.difficultyLevels;

  const { difficulty } = value;
  if (
    typeof difficulty !== 'number' ||
    !Number.isInteger(difficulty) ||
    difficulty < 1 ||
    difficulty > maxDifficulty
  ) {
    throw new TypeError(`Puzzle difficulty must be an integer between 1 and ${maxDifficulty}`);
  }

  return {
    puzzle: parseMatrix(value.puzzle, 'puzzle', size, 0),
    solution: parseMatrix(value.solution, 'solution', size, 1),
    difficulty,
  };
}
