/**
 * Centralized validation utilities to reduce duplication
 */

/**
 * Common validation constants
 */
export const VALIDATION_CONSTANTS = {
  MIN_DIFFICULTY: 1,
  MAX_DIFFICULTY: 10,
  SUDOKU_SIZE: 9,
  BOX_SIZE: 3,
  VALID_SUDOKU_VALUES: [1, 2, 3, 4, 5, 6, 7, 8, 9],
} as const;

/**
 * Validates difficulty level with consistent error messages
 */
export const validateDifficulty = (difficulty: unknown): number => {
  if (typeof difficulty === 'string') {
    if (!/^\d+$/.test(difficulty)) {
      throw new Error('Difficulty must be a positive integer.');
    }
    difficulty = parseInt(difficulty, 10);
  }

  if (typeof difficulty !== 'number' || isNaN(difficulty)) {
    throw new Error('Difficulty must be a valid number.');
  }

  if (
    difficulty < VALIDATION_CONSTANTS.MIN_DIFFICULTY ||
    difficulty > VALIDATION_CONSTANTS.MAX_DIFFICULTY
  ) {
    throw new Error(
      `Invalid difficulty level. Must be between ${VALIDATION_CONSTANTS.MIN_DIFFICULTY} and ${VALIDATION_CONSTANTS.MAX_DIFFICULTY}.`
    );
  }

  return difficulty;
};

/**
 * Validates Sudoku cell coordinates
 */
export const validateCellCoordinates = (row: number, col: number): void => {
  if (
    !Number.isInteger(row) ||
    row < 0 ||
    row >= VALIDATION_CONSTANTS.SUDOKU_SIZE
  ) {
    throw new Error(
      `Invalid row: ${row}. Must be between 0 and ${VALIDATION_CONSTANTS.SUDOKU_SIZE - 1}.`
    );
  }

  if (
    !Number.isInteger(col) ||
    col < 0 ||
    col >= VALIDATION_CONSTANTS.SUDOKU_SIZE
  ) {
    throw new Error(
      `Invalid column: ${col}. Must be between 0 and ${VALIDATION_CONSTANTS.SUDOKU_SIZE - 1}.`
    );
  }
};

/**
 * Validates Sudoku cell value
 */
export const validateCellValue = (value: number): void => {
  if (!Number.isInteger(value) || (value !== 0 && (value < 1 || value > 9))) {
    throw new Error(
      `Invalid cell value: ${value}. Must be 0 or between 1 and 9.`
    );
  }
};

/**
 * Validates complete Sudoku grid structure
 */
export const validateSudokuGrid = (grid: number[][]): void => {
  if (
    !Array.isArray(grid) ||
    grid.length !== VALIDATION_CONSTANTS.SUDOKU_SIZE
  ) {
    throw new Error(
      `Invalid grid: must be a ${VALIDATION_CONSTANTS.SUDOKU_SIZE}x${VALIDATION_CONSTANTS.SUDOKU_SIZE} array.`
    );
  }

  grid.forEach((row, rowIndex) => {
    if (
      !Array.isArray(row) ||
      row.length !== VALIDATION_CONSTANTS.SUDOKU_SIZE
    ) {
      throw new Error(
        `Invalid row ${rowIndex}: must contain exactly ${VALIDATION_CONSTANTS.SUDOKU_SIZE} elements.`
      );
    }

    row.forEach((cell, colIndex) => {
      try {
        validateCellValue(cell);
      } catch (error) {
        throw new Error(
          `Invalid cell at [${rowIndex}, ${colIndex}]: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });
  });
};

/**
 * Validates input parameters for common operations
 */
export const validateInputChange = (
  row: number,
  col: number,
  value: number
): void => {
  validateCellCoordinates(row, col);
  validateCellValue(value);
};
