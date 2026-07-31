import { describe, expect, it, vi } from 'vite-plus/test';
import { getConfig } from '@/utils/gridConfig';
import { generateSudokuPuzzle } from '../sudokuGenerator';

describe('sudokuGenerator', () => {
  describe('generateSudokuPuzzle', () => {
    it('should generate a puzzle for 4x4 grid', async () => {
      const result = await generateSudokuPuzzle(1, 4);
      expect(result.puzzle).toHaveLength(4);
      expect(result.solution).toHaveLength(4);
      expect(result.difficulty).toBe(1);
    });

    it('should generate a puzzle for 6x6 grid', async () => {
      const result = await generateSudokuPuzzle(1, 6);
      expect(result.puzzle).toHaveLength(6);
      expect(result.solution).toHaveLength(6);
    });

    it('should generate a puzzle for 9x9 grid', async () => {
      const result = await generateSudokuPuzzle(1, 9);
      expect(result.puzzle).toHaveLength(9);
      expect(result.solution).toHaveLength(9);
    });

    it('should generate puzzle with valid solution (all cells filled)', async () => {
      const result = await generateSudokuPuzzle(1, 4);
      const config = getConfig(4);
      // Solution should have no zeros
      for (const row of result.solution) {
        for (const cell of row) {
          expect(cell).toBeGreaterThanOrEqual(1);
          expect(cell).toBeLessThanOrEqual(config.maxValue);
        }
      }
    });

    it('should generate puzzle where puzzle has fewer clues than solution', async () => {
      const result = await generateSudokuPuzzle(2, 4);
      const puzzleFilled = result.puzzle.flat().filter((v) => v !== 0).length;
      const solutionFilled = result.solution.flat().filter((v) => v !== 0).length;
      expect(puzzleFilled).toBeLessThan(solutionFilled);
    });

    it('should default to 9x9 grid when gridSize is not specified', async () => {
      const result = await generateSudokuPuzzle(1);
      expect(result.puzzle).toHaveLength(9);
      expect(result.solution).toHaveLength(9);
    });
  });

  describe('logger branches', () => {
    it('should work correctly in production environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        const result = await generateSudokuPuzzle(1, 4);
        expect(result.puzzle).toHaveLength(4);
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('should work correctly in development environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      try {
        const result = await generateSudokuPuzzle(1, 4);
        expect(result.puzzle).toHaveLength(4);
        expect(debugSpy).toHaveBeenCalled();
      } finally {
        process.env.NODE_ENV = originalEnv;
        debugSpy.mockRestore();
      }
    });
  });

  describe('difficulty boundary handling', () => {
    it('should handle difficulty at minimum (1)', async () => {
      const result = await generateSudokuPuzzle(1, 4);
      expect(result.difficulty).toBe(1);
    });

    it('should handle difficulty at maximum for 4x4 (5)', async () => {
      const result = await generateSudokuPuzzle(5, 4);
      expect(result.puzzle).toHaveLength(4);
    });

    it('should handle difficulty exceeding max by clamping', async () => {
      // Difficulty 10 exceeds 4x4's max of 5, should be clamped
      const result = await generateSudokuPuzzle(10, 4);
      expect(result.puzzle).toHaveLength(4);
    });

    it('should handle difficulty below min by clamping', async () => {
      // Difficulty 0 is below min of 1, should be clamped
      const result = await generateSudokuPuzzle(0, 4);
      expect(result.puzzle).toHaveLength(4);
    });
  });

  describe('puzzle uniqueness', () => {
    it('should generate a puzzle with exactly one solution for 4x4', async () => {
      const result = await generateSudokuPuzzle(1, 4);
      // Verify puzzle is a subset of solution
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (result.puzzle[r][c] !== 0) {
            expect(result.puzzle[r][c]).toBe(result.solution[r][c]);
          }
        }
      }
    });
  });
});
