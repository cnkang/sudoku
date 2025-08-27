import { vi, expect } from 'vitest';
import '@testing-library/jest-dom';

/**
 * Shared test utility functions and constants
 */

// Generic mock function creator
export const createMockFunctions = () => ({
  onSubmit: vi.fn(),
  onReset: vi.fn(),
  onPauseResume: vi.fn(),
  onUndo: vi.fn(),
  onHint: vi.fn(),
  onChange: vi.fn(),
  onInputChange: vi.fn(),
});

// Generic beforeEach setup
export const setupTest = () => {
  vi.clearAllMocks();
  vi.useFakeTimers();
};

// Generic afterEach cleanup
export const cleanupTest = () => {
  vi.useRealTimers();
};

// Standard Sudoku test data
export const mockSudokuPuzzle = [
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

// Generic GameControls props
export const createGameControlsProps = (overrides = {}) => ({
  onSubmit: vi.fn(),
  onReset: vi.fn(),
  onPauseResume: vi.fn(),
  onUndo: vi.fn(),
  onHint: vi.fn(),
  isCorrect: null as boolean | null,
  isPaused: false,
  disabled: false,
  isLoading: false,
  canUndo: false,
  hintsUsed: 0,
  ...overrides,
});

// Generic DifficultySelector props
export const createDifficultySelectorProps = (overrides = {}) => ({
  difficulty: 1,
  onChange: vi.fn(),
  disabled: false,
  isLoading: false,
  ...overrides,
});

// Generic SudokuGrid props
export const createSudokuGridProps = (overrides = {}) => ({
  puzzle: mockSudokuPuzzle,
  userInput: mockSudokuPuzzle.map(row => [...row]),
  onInputChange: vi.fn(),
  disabled: false,
  ...overrides,
});

// Generic Timer props
export const createTimerProps = (overrides = {}) => ({
  time: 0,
  isActive: false,
  isPaused: false,
  ...overrides,
});

// Mock setup for responsive tests
export const mockMatchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

export const setupResponsiveTest = () => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(mockMatchMedia),
  });
};

// Generic assertion helper functions
export const expectButtonToBeInDocument = (name: string | RegExp) => {
  const button =
    document.querySelector(`[aria-label*="${name}"]`) ||
    document.querySelector(`button:has-text("${name}")`);
  return expect(button).toBeInTheDocument();
};

// Generic test data generators
export const generateEmptyGrid = () =>
  Array(9)
    .fill(null)
    .map(() => Array(9).fill(0));

export const generateFilledGrid = (value = 5) =>
  Array(9)
    .fill(null)
    .map(() => Array(9).fill(value));

// Generic event trigger helper functions
export const triggerKeyboardEvent = (element: HTMLElement, key: string) => {
  const event = new KeyboardEvent('keydown', { key });
  element.dispatchEvent(event);
};

// Generic accessibility test helper functions
export const testAccessibility = {
  expectAriaLabel: (element: HTMLElement, expectedLabel: string) => {
    expect(element).toHaveAttribute('aria-label', expectedLabel);
  },

  expectRole: (element: HTMLElement, expectedRole: string) => {
    expect(element).toHaveAttribute('role', expectedRole);
  },

  expectTabIndex: (element: HTMLElement, expectedIndex: number) => {
    expect(element).toHaveAttribute('tabindex', expectedIndex.toString());
  },
};
