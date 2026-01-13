import { describe, it, expect } from 'vitest';
import { GridConfigManager, GRID_CONFIGS } from '@/utils/gridConfig';
import type { GridConfig } from '@/types';

describe('GridConfigManager', () => {
  describe('getConfig', () => {
    it('should return correct configuration for 4x4 grid', () => {
      const config = GridConfigManager.getConfig(4);
      expect(config.size).toBe(4);
      expect(config.boxRows).toBe(2);
      expect(config.boxCols).toBe(2);
      expect(config.maxValue).toBe(4);
    });

    it('should return correct configuration for 6x6 grid', () => {
      const config = GridConfigManager.getConfig(6);
      expect(config.size).toBe(6);
      expect(config.boxRows).toBe(2);
      expect(config.boxCols).toBe(3);
      expect(config.maxValue).toBe(6);
    });

    it('should return correct configuration for 9x9 grid', () => {
      const config = GridConfigManager.getConfig(9);
      expect(config.size).toBe(9);
      expect(config.boxRows).toBe(3);
      expect(config.boxCols).toBe(3);
      expect(config.maxValue).toBe(9);
    });

    it('should throw error for unsupported grid size', () => {
      expect(() => GridConfigManager.getConfig(5 as any)).toThrow(
        'Unsupported grid size: 5'
      );
    });
  });

  describe('validateMove', () => {
    it('should validate moves correctly for 4x4 grid', () => {
      const config = GridConfigManager.getConfig(4);
      const grid = [
        [1, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      // Valid move
      expect(GridConfigManager.validateMove(config, grid, 0, 1, 2)).toBe(true);

      // Invalid move - same row
      expect(GridConfigManager.validateMove(config, grid, 0, 1, 1)).toBe(false);

      // Invalid move - out of bounds
      expect(GridConfigManager.validateMove(config, grid, 4, 0, 1)).toBe(false);

      // Invalid value for grid size
      expect(GridConfigManager.validateMove(config, grid, 0, 1, 5)).toBe(false);

      // Valid clear move
      expect(GridConfigManager.validateMove(config, grid, 0, 0, 0)).toBe(true);
    });

    it('should validate box constraints for 6x6 grid', () => {
      const config = GridConfigManager.getConfig(6);
      const grid = [
        [1, 2, 0, 0, 0, 0],
        [3, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
      ];

      // Invalid move - same box (2x3)
      expect(GridConfigManager.validateMove(config, grid, 1, 1, 1)).toBe(false);

      // Valid move - different box
      expect(GridConfigManager.validateMove(config, grid, 1, 3, 1)).toBe(true);
    });
  });

  describe('calculateDimensions', () => {
    it('should calculate correct dimensions for different screen sizes', () => {
      const config = GridConfigManager.getConfig(4);

      const mobileDims = GridConfigManager.calculateDimensions(
        config,
        'mobile'
      );
      expect(mobileDims.cellSize).toBe(60);
      expect(mobileDims.gridSize).toBe(240);

      const desktopDims = GridConfigManager.calculateDimensions(
        config,
        'desktop'
      );
      expect(desktopDims.cellSize).toBe(80);
      expect(desktopDims.gridSize).toBe(320);
    });
  });

  describe('getSupportedSizes', () => {
    it('should return all supported grid sizes', () => {
      const sizes = GridConfigManager.getSupportedSizes();
      expect(sizes).toEqual([4, 6, 9]);
    });
  });

  describe('isSupportedSize', () => {
    it('should correctly identify supported sizes', () => {
      expect(GridConfigManager.isSupportedSize(4)).toBe(true);
      expect(GridConfigManager.isSupportedSize(6)).toBe(true);
      expect(GridConfigManager.isSupportedSize(9)).toBe(true);
      expect(GridConfigManager.isSupportedSize(5)).toBe(false);
      expect(GridConfigManager.isSupportedSize(12)).toBe(false);
    });
  });

  describe('getValidValues', () => {
    it('should return correct valid values for each grid size', () => {
      const config4 = GridConfigManager.getConfig(4);
      expect(GridConfigManager.getValidValues(config4)).toEqual([1, 2, 3, 4]);

      const config6 = GridConfigManager.getConfig(6);
      expect(GridConfigManager.getValidValues(config6)).toEqual([
        1, 2, 3, 4, 5, 6,
      ]);

      const config9 = GridConfigManager.getConfig(9);
      expect(GridConfigManager.getValidValues(config9)).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9,
      ]);
    });
  });

  describe('validateConfig', () => {
    it('should validate correct configurations', () => {
      expect(GridConfigManager.validateConfig(GRID_CONFIGS[4])).toBe(true);
      expect(GridConfigManager.validateConfig(GRID_CONFIGS[6])).toBe(true);
      expect(GridConfigManager.validateConfig(GRID_CONFIGS[9])).toBe(true);
    });

    it('should reject invalid configurations', () => {
      const invalidConfig: GridConfig = {
        size: 4,
        boxRows: 2,
        boxCols: 3, // Invalid: 2*3 != 4
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

      expect(GridConfigManager.validateConfig(invalidConfig)).toBe(false);
    });
  });
});
