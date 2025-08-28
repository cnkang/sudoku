import { describe, it, expect } from 'vitest';
import {
  validateDifficulty,
  validateCellCoordinates,
  validateCellValue,
  validateSudokuGrid,
  validateInputChange,
  VALIDATION_CONSTANTS,
} from '../validation';

describe('validation utilities', () => {
  describe('VALIDATION_CONSTANTS', () => {
    it('should export all expected constants', () => {
      expect(VALIDATION_CONSTANTS.MIN_DIFFICULTY).toBe(1);
      expect(VALIDATION_CONSTANTS.MAX_DIFFICULTY).toBe(10);
      expect(VALIDATION_CONSTANTS.SUDOKU_SIZE).toBe(9);
      expect(VALIDATION_CONSTANTS.BOX_SIZE).toBe(3);
      expect(VALIDATION_CONSTANTS.VALID_SUDOKU_VALUES).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9,
      ]);
    });
  });

  describe('validateDifficulty', () => {
    it('should accept valid numeric difficulty levels', () => {
      for (let i = 1; i <= 10; i++) {
        expect(validateDifficulty(i)).toBe(i);
      }
    });

    it('should accept valid string difficulty levels', () => {
      expect(validateDifficulty('1')).toBe(1);
      expect(validateDifficulty('5')).toBe(5);
      expect(validateDifficulty('10')).toBe(10);
    });

    it('should throw error for difficulty below minimum', () => {
      expect(() => validateDifficulty(0)).toThrow(
        'Invalid difficulty level. Must be between 1 and 10.'
      );
      expect(() => validateDifficulty(-1)).toThrow(
        'Invalid difficulty level. Must be between 1 and 10.'
      );
    });

    it('should throw error for difficulty above maximum', () => {
      expect(() => validateDifficulty(11)).toThrow(
        'Invalid difficulty level. Must be between 1 and 10.'
      );
      expect(() => validateDifficulty(100)).toThrow(
        'Invalid difficulty level. Must be between 1 and 10.'
      );
    });

    it('should throw error for non-numeric strings', () => {
      expect(() => validateDifficulty('abc')).toThrow(
        'Difficulty must be a positive integer.'
      );
      expect(() => validateDifficulty('1.5')).toThrow(
        'Difficulty must be a positive integer.'
      );
      expect(() => validateDifficulty('-1')).toThrow(
        'Difficulty must be a positive integer.'
      );
      expect(() => validateDifficulty('')).toThrow(
        'Difficulty must be a positive integer.'
      );
    });

    it('should throw error for invalid types', () => {
      expect(() => validateDifficulty(null)).toThrow(
        'Difficulty must be a valid number.'
      );
      expect(() => validateDifficulty(undefined)).toThrow(
        'Difficulty must be a valid number.'
      );
      expect(() => validateDifficulty({})).toThrow(
        'Difficulty must be a valid number.'
      );
      expect(() => validateDifficulty([])).toThrow(
        'Difficulty must be a valid number.'
      );
    });

    it('should throw error for NaN', () => {
      expect(() => validateDifficulty(NaN)).toThrow(
        'Difficulty must be a valid number.'
      );
    });

    it('should accept decimal numbers within valid range', () => {
      // The validation function accepts decimal numbers as long as they're in range
      expect(validateDifficulty(1.5)).toBe(1.5);
      expect(validateDifficulty(5.7)).toBe(5.7);
      expect(validateDifficulty(9.9)).toBe(9.9);
    });
  });

  describe('validateCellCoordinates', () => {
    it('should accept valid coordinates', () => {
      expect(() => validateCellCoordinates(0, 0)).not.toThrow();
      expect(() => validateCellCoordinates(4, 4)).not.toThrow();
      expect(() => validateCellCoordinates(8, 8)).not.toThrow();
      expect(() => validateCellCoordinates(0, 8)).not.toThrow();
      expect(() => validateCellCoordinates(8, 0)).not.toThrow();
    });

    it('should throw error for invalid row coordinates', () => {
      expect(() => validateCellCoordinates(-1, 0)).toThrow(
        'Invalid row: -1. Must be between 0 and 8.'
      );
      expect(() => validateCellCoordinates(9, 0)).toThrow(
        'Invalid row: 9. Must be between 0 and 8.'
      );
      expect(() => validateCellCoordinates(100, 0)).toThrow(
        'Invalid row: 100. Must be between 0 and 8.'
      );
    });

    it('should throw error for invalid column coordinates', () => {
      expect(() => validateCellCoordinates(0, -1)).toThrow(
        'Invalid column: -1. Must be between 0 and 8.'
      );
      expect(() => validateCellCoordinates(0, 9)).toThrow(
        'Invalid column: 9. Must be between 0 and 8.'
      );
      expect(() => validateCellCoordinates(0, 100)).toThrow(
        'Invalid column: 100. Must be between 0 and 8.'
      );
    });

    it('should throw error for non-integer coordinates', () => {
      expect(() => validateCellCoordinates(1.5, 0)).toThrow(
        'Invalid row: 1.5. Must be between 0 and 8.'
      );
      expect(() => validateCellCoordinates(0, 2.7)).toThrow(
        'Invalid column: 2.7. Must be between 0 and 8.'
      );
    });

    it('should throw error for both invalid coordinates', () => {
      expect(() => validateCellCoordinates(-1, -1)).toThrow(
        'Invalid row: -1. Must be between 0 and 8.'
      );
      expect(() => validateCellCoordinates(10, 10)).toThrow(
        'Invalid row: 10. Must be between 0 and 8.'
      );
    });
  });

  describe('validateCellValue', () => {
    it('should accept valid cell values', () => {
      expect(() => validateCellValue(0)).not.toThrow(); // Empty cell
      for (let i = 1; i <= 9; i++) {
        expect(() => validateCellValue(i)).not.toThrow();
      }
    });

    it('should throw error for invalid cell values', () => {
      expect(() => validateCellValue(-1)).toThrow(
        'Invalid cell value: -1. Must be 0 or between 1 and 9.'
      );
      expect(() => validateCellValue(10)).toThrow(
        'Invalid cell value: 10. Must be 0 or between 1 and 9.'
      );
      expect(() => validateCellValue(100)).toThrow(
        'Invalid cell value: 100. Must be 0 or between 1 and 9.'
      );
    });

    it('should throw error for non-integer values', () => {
      expect(() => validateCellValue(1.5)).toThrow(
        'Invalid cell value: 1.5. Must be 0 or between 1 and 9.'
      );
      expect(() => validateCellValue(0.5)).toThrow(
        'Invalid cell value: 0.5. Must be 0 or between 1 and 9.'
      );
    });
  });

  describe('validateSudokuGrid', () => {
    const createValidGrid = (): number[][] => {
      return Array(9)
        .fill(null)
        .map(() => Array(9).fill(0));
    };

    const createValidGridWithValues = (): number[][] => {
      return [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9],
      ];
    };

    it('should accept valid empty grid', () => {
      const grid = createValidGrid();
      expect(() => validateSudokuGrid(grid)).not.toThrow();
    });

    it('should accept valid grid with values', () => {
      const grid = createValidGridWithValues();
      expect(() => validateSudokuGrid(grid)).not.toThrow();
    });

    it('should throw error for non-array input', () => {
      expect(() => validateSudokuGrid(null as any)).toThrow(
        'Invalid grid: must be a 9x9 array.'
      );
      expect(() => validateSudokuGrid(undefined as any)).toThrow(
        'Invalid grid: must be a 9x9 array.'
      );
      expect(() => validateSudokuGrid('not an array' as any)).toThrow(
        'Invalid grid: must be a 9x9 array.'
      );
    });

    it('should throw error for wrong grid size', () => {
      const smallGrid = Array(8)
        .fill(null)
        .map(() => Array(9).fill(0));
      expect(() => validateSudokuGrid(smallGrid)).toThrow(
        'Invalid grid: must be a 9x9 array.'
      );

      const largeGrid = Array(10)
        .fill(null)
        .map(() => Array(9).fill(0));
      expect(() => validateSudokuGrid(largeGrid)).toThrow(
        'Invalid grid: must be a 9x9 array.'
      );
    });

    it('should throw error for invalid row structure', () => {
      const grid = createValidGrid();
      grid[0] = null as any;
      expect(() => validateSudokuGrid(grid)).toThrow(
        'Invalid row 0: must contain exactly 9 elements.'
      );
    });

    it('should throw error for wrong row size', () => {
      const grid1 = createValidGrid();
      grid1[0] = Array(8).fill(0); // Too short
      expect(() => validateSudokuGrid(grid1)).toThrow(
        'Invalid row 0: must contain exactly 9 elements.'
      );

      const grid2 = createValidGrid();
      grid2[1] = Array(10).fill(0); // Too long
      expect(() => validateSudokuGrid(grid2)).toThrow(
        'Invalid row 1: must contain exactly 9 elements.'
      );
    });

    it('should throw error for invalid cell values', () => {
      const grid = createValidGrid();
      grid[0][0] = -1;
      expect(() => validateSudokuGrid(grid)).toThrow(
        'Invalid cell at [0, 0]: Invalid cell value: -1. Must be 0 or between 1 and 9.'
      );

      grid[0][0] = 10;
      expect(() => validateSudokuGrid(grid)).toThrow(
        'Invalid cell at [0, 0]: Invalid cell value: 10. Must be 0 or between 1 and 9.'
      );
    });

    it('should throw error for non-integer cell values', () => {
      const grid = createValidGrid();
      grid[2][3] = 1.5;
      expect(() => validateSudokuGrid(grid)).toThrow(
        'Invalid cell at [2, 3]: Invalid cell value: 1.5. Must be 0 or between 1 and 9.'
      );
    });
  });

  describe('validateInputChange', () => {
    it('should accept valid input changes', () => {
      expect(() => validateInputChange(0, 0, 0)).not.toThrow();
      expect(() => validateInputChange(4, 4, 5)).not.toThrow();
      expect(() => validateInputChange(8, 8, 9)).not.toThrow();
    });

    it('should throw error for invalid coordinates', () => {
      expect(() => validateInputChange(-1, 0, 5)).toThrow(
        'Invalid row: -1. Must be between 0 and 8.'
      );
      expect(() => validateInputChange(0, -1, 5)).toThrow(
        'Invalid column: -1. Must be between 0 and 8.'
      );
      expect(() => validateInputChange(9, 0, 5)).toThrow(
        'Invalid row: 9. Must be between 0 and 8.'
      );
      expect(() => validateInputChange(0, 9, 5)).toThrow(
        'Invalid column: 9. Must be between 0 and 8.'
      );
    });

    it('should throw error for invalid cell values', () => {
      expect(() => validateInputChange(0, 0, -1)).toThrow(
        'Invalid cell value: -1. Must be 0 or between 1 and 9.'
      );
      expect(() => validateInputChange(0, 0, 10)).toThrow(
        'Invalid cell value: 10. Must be 0 or between 1 and 9.'
      );
    });

    it('should throw error for non-integer inputs', () => {
      expect(() => validateInputChange(1.5, 0, 5)).toThrow(
        'Invalid row: 1.5. Must be between 0 and 8.'
      );
      expect(() => validateInputChange(0, 2.7, 5)).toThrow(
        'Invalid column: 2.7. Must be between 0 and 8.'
      );
      expect(() => validateInputChange(0, 0, 3.14)).toThrow(
        'Invalid cell value: 3.14. Must be 0 or between 1 and 9.'
      );
    });
  });
});
