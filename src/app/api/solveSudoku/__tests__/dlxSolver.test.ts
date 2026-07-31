import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import type { GridConfig } from '@/types';

describe('dlxSolver', () => {
  const config4x4: GridConfig = {
    size: 4,
    boxRows: 2,
    boxCols: 2,
    maxValue: 4,
    minClues: 8,
    maxClues: 12,
    difficultyLevels: 5,
    cellSize: { desktop: 80, tablet: 70, mobile: 60 },
    childFriendly: {
      enableAnimations: true,
      showHelpText: true,
      useExtraLargeTargets: true,
    },
  };

  const config6x6: GridConfig = {
    size: 6,
    boxRows: 2,
    boxCols: 3,
    maxValue: 6,
    minClues: 18,
    maxClues: 28,
    difficultyLevels: 7,
    cellSize: { desktop: 65, tablet: 55, mobile: 45 },
    childFriendly: {
      enableAnimations: true,
      showHelpText: true,
      useExtraLargeTargets: true,
    },
  };

  describe('solveSudoku with non-9x9 grids (backtracking)', () => {
    it('should solve a 4x4 puzzle using backtracking', async () => {
      const { solveSudoku } = await import('../dlxSolver');
      const board = [
        [1, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 1],
      ];
      const solutions: number[][][] = [];
      const result = await solveSudoku(board, solutions, 1, config4x4);

      expect(result).toBe(true);
      expect(solutions).toHaveLength(1);
      const sol = solutions[0];
      expect(sol).toBeDefined();
      expect(sol!.flat().every((v) => v > 0)).toBe(true);
    });

    it('should find multiple solutions for 4x4 when maxSolutions > 1', async () => {
      const { solveSudoku } = await import('../dlxSolver');
      const board = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const solutions: number[][][] = [];
      await solveSudoku(board, solutions, 2, config4x4);

      expect(solutions.length).toBeGreaterThanOrEqual(1);
    });

    it('should return false for unsolvable 4x4 board', async () => {
      const { solveSudoku } = await import('../dlxSolver');
      const invalidBoard = [
        [1, 1, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const solutions: number[][][] = [];
      const result = await solveSudoku(invalidBoard, solutions, 1, config4x4);

      expect(result).toBe(false);
      expect(solutions).toHaveLength(0);
    });

    it('should handle already complete 4x4 board', async () => {
      const { solveSudoku } = await import('../dlxSolver');
      const board = [
        [1, 2, 3, 4],
        [3, 4, 1, 2],
        [2, 1, 4, 3],
        [4, 3, 2, 1],
      ];
      const solutions: number[][][] = [];
      const result = await solveSudoku(board, solutions, 1, config4x4);

      expect(result).toBe(true);
      expect(solutions).toHaveLength(1);
    });

    it('should solve a 6x6 puzzle', async () => {
      const { solveSudoku } = await import('../dlxSolver');
      const board = [
        [1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1],
      ];
      const solutions: number[][][] = [];
      const result = await solveSudoku(board, solutions, 1, config6x6);

      expect(result).toBe(true);
      expect(solutions).toHaveLength(1);
    });

    it('should return true when maxSolutions reached', async () => {
      const { solveSudoku } = await import('../dlxSolver');
      const board = [
        [1, 2, 3, 4],
        [3, 4, 1, 2],
        [2, 1, 4, 3],
        [4, 3, 2, 1],
      ];
      const solutions: number[][][] = [];
      const result = await solveSudoku(board, solutions, 1, config4x4);
      expect(result).toBe(true);
      expect(solutions).toHaveLength(1);
    });

    it('should return false when no empty cell and maxSolutions not reached', async () => {
      const { solveSudoku } = await import('../dlxSolver');
      const board = [
        [1, 2, 3, 4],
        [3, 4, 1, 2],
        [2, 1, 4, 3],
        [4, 3, 2, 1],
      ];
      const solutions: number[][][] = [];
      const result = await solveSudoku(board, solutions, 2, config4x4);
      expect(result).toBe(false);
      expect(solutions).toHaveLength(1);
    });
  });

  describe('solveSudoku 9x9 with mocked fast-sudoku-solver', () => {
    afterEach(() => {
      vi.doUnmock('fast-sudoku-solver');
    });

    it('should handle isSolvable=false from fast-sudoku-solver', async () => {
      vi.doMock('fast-sudoku-solver', () => ({
        solveSudoku: () => [false, []],
      }));

      const { solveSudoku } = await import('../dlxSolver');
      const board = [
        [1, 1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ];
      const solutions: number[][][] = [];
      const result = await solveSudoku(board, solutions, 1);

      expect(solutions).toHaveLength(0);
      expect(result).toBe(false);
    });

    it('should fallback to backtracking when fast-sudoku-solver import fails', async () => {
      vi.doMock('fast-sudoku-solver', () => {
        throw new Error('Module not found');
      });

      const { solveSudoku } = await import('../dlxSolver');
      const board = [
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
      const solutions: number[][][] = [];
      const result = await solveSudoku(board, solutions, 1);

      expect(result).toBe(true);
      expect(solutions).toHaveLength(1);
    });
  });
});
