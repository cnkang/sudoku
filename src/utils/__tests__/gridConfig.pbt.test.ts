import fc from 'fast-check';
import { describe, it } from 'vitest';
import { GridConfigManager } from '@/utils/gridConfig';

const createEmptyGrid = (size: number) =>
  Array.from({ length: size }, () => Array.from({ length: size }, () => 0));

const isDimensionsMatch = (
  config: { size: number; maxValue: number; boxRows: number; boxCols: number },
  gridSize: number
) =>
  config.size === gridSize &&
  config.maxValue === gridSize &&
  config.boxRows * config.boxCols === gridSize;

const isValidCoords = (row: number, col: number, size: number) =>
  row >= 0 && row < size && col >= 0 && col < size;

const isValidValue = (value: number, maxValue: number) =>
  value >= 0 && value <= maxValue;

const validateMoveOutcome = (
  config: { size: number; maxValue: number },
  emptyGrid: number[][],
  row: number,
  col: number,
  value: number
) => {
  const validCoords = isValidCoords(row, col, config.size);
  const validValue = isValidValue(value, config.maxValue);
  const moveResult = GridConfigManager.validateMove(
    config,
    emptyGrid,
    row,
    col,
    value
  );

  if (!validCoords || !validValue) {
    return moveResult === false;
  }

  return value === 0 || moveResult === true;
};

const validateGridConfigConsistency = (
  gridSize: number,
  row: number,
  col: number,
  value: number
) => {
  const config = GridConfigManager.getConfig(gridSize);
  if (!GridConfigManager.validateConfig(config)) {
    return false;
  }
  if (!isDimensionsMatch(config, gridSize)) {
    return false;
  }

  const emptyGrid = createEmptyGrid(config.size);
  return validateMoveOutcome(config, emptyGrid, row, col, value);
};

describe('GridConfig Property-Based Tests', () => {
  /**
   * Feature: multi-size-sudoku, Property 1: Grid configuration consistency
   * For any supported grid size (4×4, 6×6, 9×9), when a puzzle is generated,
   * the resulting puzzle should have dimensions, sub-grid structure, and number ranges
   * that exactly match the grid configuration
   * Validates: Requirements 1.2, 4.2, 4.3
   */
  it('should maintain grid configuration consistency across all supported sizes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(4, 6, 9),
        fc.integer({ min: 0, max: 100 }), // row
        fc.integer({ min: 0, max: 100 }), // col
        fc.integer({ min: 0, max: 20 }), // value
        (gridSize, row, col, value) => {
          return validateGridConfigConsistency(gridSize, row, col, value);
        }
      ),
      { numRuns: 100 }
    );
  });
});
