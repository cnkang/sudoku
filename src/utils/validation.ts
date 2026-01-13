/**
 * Centralized validation utilities to reduce duplication
 */

import type { GridConfig } from '@/types';
import { GridConfigManager } from '@/utils/gridConfig';

/**
 * Common validation constants - now parameterized for multi-size support
 */
export const VALIDATION_CONSTANTS = {
  MIN_DIFFICULTY: 1,
  MAX_DIFFICULTY: 10,
  // Legacy constants for backward compatibility
  SUDOKU_SIZE: 9,
  BOX_SIZE: 3,
  VALID_SUDOKU_VALUES: [1, 2, 3, 4, 5, 6, 7, 8, 9],
} as const;

/**
 * Get validation constants for a specific grid configuration
 */
export const getValidationConstants = (config: GridConfig) => ({
  MIN_DIFFICULTY: 1,
  MAX_DIFFICULTY: config.difficultyLevels,
  SUDOKU_SIZE: config.size,
  BOX_ROWS: config.boxRows,
  BOX_COLS: config.boxCols,
  VALID_SUDOKU_VALUES: GridConfigManager.getValidValues(config),
});

/**
 * Validates difficulty level with consistent error messages
 * Now supports grid-specific difficulty ranges
 */
export const validateDifficulty = (
  difficulty: unknown,
  config?: GridConfig
): number => {
  if (typeof difficulty === 'string') {
    if (!/^\d+$/.test(difficulty)) {
      throw new Error('Difficulty must be a positive integer.');
    }
    difficulty = parseInt(difficulty, 10);
  }

  if (typeof difficulty !== 'number' || Number.isNaN(difficulty)) {
    throw new Error('Difficulty must be a valid number.');
  }

  const minDifficulty = VALIDATION_CONSTANTS.MIN_DIFFICULTY;
  const maxDifficulty =
    config?.difficultyLevels ?? VALIDATION_CONSTANTS.MAX_DIFFICULTY;

  if (difficulty < minDifficulty || difficulty > maxDifficulty) {
    throw new Error(
      `Invalid difficulty level. Must be between ${minDifficulty} and ${maxDifficulty}.`
    );
  }

  return difficulty;
};

/**
 * Validates Sudoku cell coordinates - now supports multiple grid sizes
 */
export const validateCellCoordinates = (
  row: number,
  col: number,
  config?: GridConfig
): void => {
  const gridSize = config?.size ?? VALIDATION_CONSTANTS.SUDOKU_SIZE;

  if (!Number.isInteger(row) || row < 0 || row >= gridSize) {
    throw new Error(
      `Invalid row: ${row}. Must be between 0 and ${gridSize - 1}.`
    );
  }

  if (!Number.isInteger(col) || col < 0 || col >= gridSize) {
    throw new Error(
      `Invalid column: ${col}. Must be between 0 and ${gridSize - 1}.`
    );
  }
};

/**
 * Validates Sudoku cell value - now supports multiple grid sizes
 */
export const validateCellValue = (value: number, config?: GridConfig): void => {
  const maxValue = config?.maxValue ?? 9;

  if (
    !Number.isInteger(value) ||
    (value !== 0 && (value < 1 || value > maxValue))
  ) {
    throw new Error(
      `Invalid cell value: ${value}. Must be 0 or between 1 and ${maxValue}.`
    );
  }
};

/**
 * Validates complete Sudoku grid structure - now supports multiple grid sizes
 */
export const validateSudokuGrid = (
  grid: number[][],
  config?: GridConfig
): void => {
  const gridSize = config?.size ?? VALIDATION_CONSTANTS.SUDOKU_SIZE;

  if (!Array.isArray(grid) || grid.length !== gridSize) {
    throw new Error(`Invalid grid: must be a ${gridSize}x${gridSize} array.`);
  }

  grid.forEach((row, rowIndex) => {
    if (!Array.isArray(row) || row.length !== gridSize) {
      throw new Error(
        `Invalid row ${rowIndex}: must contain exactly ${gridSize} elements.`
      );
    }

    row.forEach((cell, colIndex) => {
      try {
        validateCellValue(cell, config);
      } catch (error) {
        throw new Error(
          `Invalid cell at [${rowIndex}, ${colIndex}]: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    });
  });
};

/**
 * Validates input parameters for common operations - now supports multiple grid sizes
 */
export const validateInputChange = (
  row: number,
  col: number,
  value: number,
  config?: GridConfig
): void => {
  validateCellCoordinates(row, col, config);
  validateCellValue(value, config);
};

/**
 * Check for row conflict
 */
function hasRowConflict(
  grid: number[][],
  row: number,
  col: number,
  value: number,
  size: number
): boolean {
  for (let c = 0; c < size; c++) {
    if (c !== col && grid[row]?.[c] === value) {
      return true;
    }
  }
  return false;
}

/**
 * Check for column conflict
 */
function hasColumnConflict(
  grid: number[][],
  row: number,
  col: number,
  value: number,
  size: number
): boolean {
  for (let r = 0; r < size; r++) {
    if (r !== row && grid[r]?.[col] === value) {
      return true;
    }
  }
  return false;
}

/**
 * Check for box conflict
 */
function hasBoxConflict(
  grid: number[][],
  row: number,
  col: number,
  value: number,
  config: GridConfig
): boolean {
  const boxStartRow = Math.floor(row / config.boxRows) * config.boxRows;
  const boxStartCol = Math.floor(col / config.boxCols) * config.boxCols;

  for (let r = boxStartRow; r < boxStartRow + config.boxRows; r++) {
    for (let c = boxStartCol; c < boxStartCol + config.boxCols; c++) {
      if ((r !== row || c !== col) && grid[r]?.[c] === value) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Grid-size-aware conflict detection
 */
export const detectConflicts = (
  grid: number[][],
  row: number,
  col: number,
  value: number,
  config: GridConfig
): { hasConflict: boolean; conflictType?: 'row' | 'column' | 'box' } => {
  const isValid = GridConfigManager.validateMove(config, grid, row, col, value);

  if (isValid || value === 0) {
    return { hasConflict: false };
  }

  if (hasRowConflict(grid, row, col, value, config.size)) {
    return { hasConflict: true, conflictType: 'row' };
  }

  if (hasColumnConflict(grid, row, col, value, config.size)) {
    return { hasConflict: true, conflictType: 'column' };
  }

  if (hasBoxConflict(grid, row, col, value, config)) {
    return { hasConflict: true, conflictType: 'box' };
  }

  return { hasConflict: true };
};
