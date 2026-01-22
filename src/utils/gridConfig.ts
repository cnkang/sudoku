import type { GridConfig, GridDimensions, GridSize, ScreenSize } from '@/types';

/**
 * Grid configuration constants for different Sudoku sizes
 */
export const GRID_CONFIGS: Record<GridSize, GridConfig> = {
  4: {
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
  },
  6: {
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
  },
  9: {
    size: 9,
    boxRows: 3,
    boxCols: 3,
    maxValue: 9,
    minClues: 22,
    maxClues: 61,
    difficultyLevels: 10,
    cellSize: { desktop: 45, tablet: 40, mobile: 35 },
    childFriendly: {
      enableAnimations: false,
      showHelpText: false,
      useExtraLargeTargets: false,
    },
  },
};

/**
 * Get configuration for a specific grid size
 */
export function getConfig(size: GridSize): GridConfig {
  const config = GRID_CONFIGS[size];
  if (!config) {
    throw new Error(`Unsupported grid size: ${size}`);
  }
  return config;
}

/**
 * Check if coordinates are within bounds
 */
function isValidPosition(
  config: GridConfig,
  row: number,
  col: number
): boolean {
  return row >= 0 && row < config.size && col >= 0 && col < config.size;
}

/**
 * Check if value is valid for grid size
 */
function isValidValue(config: GridConfig, value: number): boolean {
  return value >= 0 && value <= config.maxValue;
}

/**
 * Check row constraint
 */
function isValidInRow(
  grid: number[][],
  row: number,
  col: number,
  value: number,
  size: number
): boolean {
  for (let c = 0; c < size; c++) {
    if (c !== col && grid[row]?.[c] === value) {
      return false;
    }
  }
  return true;
}

/**
 * Check column constraint
 */
function isValidInColumn(
  grid: number[][],
  row: number,
  col: number,
  value: number,
  size: number
): boolean {
  for (let r = 0; r < size; r++) {
    if (r !== row && grid[r]?.[col] === value) {
      return false;
    }
  }
  return true;
}

/**
 * Check box constraint
 */
function isValidInBox(
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
        return false;
      }
    }
  }
  return true;
}

/**
 * Validate a move according to grid configuration rules
 */
export function validateMove(
  config: GridConfig,
  grid: number[][],
  row: number,
  col: number,
  value: number
): boolean {
  if (!isValidPosition(config, row, col) || !isValidValue(config, value)) {
    return false;
  }

  if (value === 0) {
    return true;
  }

  return (
    isValidInRow(grid, row, col, value, config.size) &&
    isValidInColumn(grid, row, col, value, config.size) &&
    isValidInBox(grid, row, col, value, config)
  );
}

/**
 * Calculate grid dimensions based on configuration and screen size
 */
export function calculateDimensions(
  config: GridConfig,
  screenSize: ScreenSize
): GridDimensions {
  const cellSize = config.cellSize[screenSize];
  const gridSize = cellSize * config.size;
  const padding = Math.max(8, Math.floor(cellSize * 0.1));
  const borderWidth = Math.max(1, Math.floor(cellSize * 0.02));

  return {
    cellSize,
    gridSize,
    padding,
    borderWidth,
  };
}

/**
 * Get all supported grid sizes
 */
export function getSupportedSizes(): Array<4 | 6 | 9> {
  return [4, 6, 9];
}

/**
 * Check if a grid size is supported
 */
export function isSupportedSize(size: number): size is 4 | 6 | 9 {
  return size === 4 || size === 6 || size === 9;
}

/**
 * Get valid values for a specific grid configuration
 */
export function getValidValues(config: GridConfig): number[] {
  return Array.from({ length: config.maxValue }, (_, i) => i + 1);
}

/**
 * Validate grid configuration consistency
 */
export function validateConfig(config: GridConfig): boolean {
  if (!isSupportedSize(config.size)) {
    return false;
  }

  if (config.boxRows * config.boxCols !== config.size) {
    return false;
  }

  if (config.maxValue !== config.size) {
    return false;
  }

  if (config.minClues >= config.maxClues) {
    return false;
  }

  if (config.difficultyLevels <= 0) {
    return false;
  }

  if (
    config.cellSize.desktop <= 0 ||
    config.cellSize.tablet <= 0 ||
    config.cellSize.mobile <= 0
  ) {
    return false;
  }

  return true;
}

/**
 * Grid Configuration Manager - provides a unified interface for grid configuration operations
 */
export const GridConfigManager = {
  getConfig,
  validateMove,
  calculateDimensions,
  getSupportedSizes,
  isSupportedSize,
  getValidValues,
  validateConfig,
};
