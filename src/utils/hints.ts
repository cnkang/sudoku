import type { GridConfig } from '@/types';
import { validateSudokuGrid } from './validation';

export interface HintResult {
  row: number;
  col: number;
  value: number;
  reason: string;
}

type CellValues = {
  puzzleCell: number;
  inputCell: number;
  solutionCell: number;
};

const getCellValues = (
  puzzle: number[][],
  userInput: number[][],
  solution: number[][],
  row: number,
  col: number
): CellValues | null => {
  const puzzleCell = puzzle[row]?.[col];
  const inputCell = userInput[row]?.[col];
  const solutionCell = solution[row]?.[col];
  if (
    puzzleCell === undefined ||
    inputCell === undefined ||
    solutionCell === undefined
  ) {
    return null;
  }
  return { puzzleCell, inputCell, solutionCell };
};

const findMatchingCell = (
  puzzle: number[][],
  userInput: number[][],
  solution: number[][],
  gridSize: number,
  predicate: (values: CellValues) => boolean,
  buildReason: (solutionCell: number, row: number, col: number) => string
): HintResult | null => {
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const values = getCellValues(puzzle, userInput, solution, row, col);
      if (!values) {
        continue;
      }
      if (predicate(values)) {
        return {
          row,
          col,
          value: values.solutionCell,
          reason: buildReason(values.solutionCell, row, col),
        };
      }
    }
  }
  return null;
};

export const getHint = (
  puzzle: number[][],
  userInput: number[][],
  solution: number[][],
  config?: GridConfig
): HintResult | null => {
  // Validate inputs using grid config if provided
  validateSudokuGrid(puzzle, config);
  validateSudokuGrid(userInput, config);
  validateSudokuGrid(solution, config);

  // Derive grid size from the puzzle itself for backward compatibility
  const gridSize = config?.size ?? puzzle.length;

  const emptyCellHint = findMatchingCell(
    puzzle,
    userInput,
    solution,
    gridSize,
    ({ puzzleCell, inputCell }) => puzzleCell === 0 && inputCell === 0,
    (solutionCell, row, col) =>
      `Try placing ${solutionCell} in row ${row + 1}, column ${col + 1}`
  );

  if (emptyCellHint) {
    return emptyCellHint;
  }

  return findMatchingCell(
    puzzle,
    userInput,
    solution,
    gridSize,
    ({ puzzleCell, inputCell, solutionCell }) =>
      puzzleCell === 0 && inputCell !== 0 && inputCell !== solutionCell,
    (solutionCell, row, col) =>
      `The value in row ${row + 1}, column ${col + 1} should be ${solutionCell}`
  );
};
