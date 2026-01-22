/**
 * Centralized test setup utilities to reduce duplication across test files
 */
import { vi } from 'vitest';
import '@testing-library/jest-dom';

/**
 * Standard test setup that should be called in beforeEach
 */
export const standardTestSetup = () => {
  vi.clearAllMocks();
  vi.useFakeTimers();
};

/**
 * Standard test cleanup that should be called in afterEach
 */
export const standardTestCleanup = () => {
  vi.useRealTimers();
  vi.clearAllMocks();
};

/**
 * Generic mock function factory for common component callbacks
 */
export const createMockCallbacks = <T extends Record<string, unknown>>(
  callbacks: (keyof T)[]
): Record<keyof T, ReturnType<typeof vi.fn>> => {
  return callbacks.reduce(
    (acc, callback) => {
      acc[callback] = vi.fn();
      return acc;
    },
    {} as Record<keyof T, ReturnType<typeof vi.fn>>
  );
};

/**
 * Common Sudoku test data
 */
export const TEST_DATA = {
  EMPTY_GRID: new Array(9)
    .fill(null)
    .map(() => new Array(9).fill(0)),
  SAMPLE_PUZZLE: [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ],
  FILLED_GRID: new Array(9)
    .fill(null)
    .map(() => new Array(9).fill(5)),
} as const;

/**
 * Common viewport configurations for responsive testing
 */
export const COMMON_VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1200, height: 800 },
} as const;

/**
 * Setup responsive test environment with common configurations
 */
export const setupResponsiveEnvironment = (
  viewport: keyof typeof COMMON_VIEWPORTS
) => {
  const size = COMMON_VIEWPORTS[viewport];
  Object.defineProperty(globalThis, 'innerWidth', {
    writable: true,
    configurable: true,
    value: size.width,
  });
  Object.defineProperty(globalThis, 'innerHeight', {
    writable: true,
    configurable: true,
    value: size.height,
  });
};
