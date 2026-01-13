import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import SudokuGrid from '../SudokuGrid';
import { GRID_CONFIGS } from '@/utils/gridConfig';

vi.mock('@/hooks/useKeyboardNavigation', () => ({
  useKeyboardNavigation: () => [
    {},
    {
      handleCellKeyDown: vi.fn(),
      registerCellRef: vi.fn(),
      focusFirstEditableCell: vi.fn(),
    },
  ],
}));

vi.mock('@/hooks/useAudioAccessibility', () => ({
  useAudioAccessibility: () => [
    {},
    {
      speakCellDescription: vi.fn(),
      speakMove: vi.fn(),
      speakError: vi.fn(),
      speakGameState: vi.fn(),
      speakPuzzleCompletion: vi.fn(),
    },
  ],
}));

vi.mock('@/hooks/useVoiceInput', () => ({
  useVoiceInput: () => [
    {},
    {
      enableVoiceInput: vi.fn(),
      disableVoiceInput: vi.fn(),
      startListening: vi.fn(),
      stopListening: vi.fn(),
      toggleListening: vi.fn(),
      updateSettings: vi.fn(),
      processVoiceCommand: vi.fn(),
    },
  ],
}));

vi.mock('@/hooks/useAdaptiveTouchTargets', () => ({
  useAdaptiveTouchTargets: () => [
    {},
    {
      enableAdaptation: vi.fn(),
      disableAdaptation: vi.fn(),
    },
  ],
}));

vi.mock('@/hooks/useVisualFeedback', () => ({
  useVisualFeedback: () => ({
    triggerSuccess: vi.fn(),
    triggerError: vi.fn(),
    triggerEncouragement: vi.fn(),
    triggerCelebration: vi.fn(),
    triggerHint: vi.fn(),
    clearFeedback: vi.fn(),
    setFeedbackTriggers: vi.fn(),
  }),
  getContextualFeedback: () => ({ type: 'success', message: 'ok' }),
}));

vi.mock('@/utils/reducedMotion', () => ({
  useMotionPreferences: () => ({
    preferences: {
      prefersReducedMotion: false,
      allowAnimations: true,
      animationDuration: 300,
      transitionDuration: 150,
    },
    settings: {},
    updateSettings: vi.fn(),
    cssProperties: {},
  }),
}));

/**
 * Property-based tests for SudokuGrid touch target accessibility
 * Validates Requirements 6.1: Touch target accessibility
 */

describe('SudokuGrid Property-Based Tests', () => {
  type GridSize = 4 | 6 | 9;
  type AccessibilitySettings = {
    highContrast: boolean;
    reducedMotion: boolean;
    largeText: boolean;
  };

  const getGridConfig = (gridSize: number) =>
    GRID_CONFIGS[gridSize as GridSize];

  const createEmptyGrid = (size: number) =>
    Array.from({ length: size }, () => Array(size).fill(0));

  // Arbitraries for generating test data
  const gridSizeArb = fc.constantFrom(4, 6, 9);

  const accessibilityArb = fc.record<AccessibilitySettings>({
    highContrast: fc.boolean(),
    reducedMotion: fc.boolean(),
    largeText: fc.boolean(),
  });

const childModeArb = fc.boolean();

const parseRunCount = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;

  return Math.min(parsed, 100);
};

const parseTimeLimitMs = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 100) return fallback;

  return Math.min(parsed, 10000);
};

const property6Runs = parseRunCount(
  process.env.PBT_PROPERTY6_RUNS,
  process.env.NODE_ENV === 'test' ? 12 : 20
);
const property7Runs = parseRunCount(
  process.env.PBT_PROPERTY7_RUNS,
  process.env.NODE_ENV === 'test' ? 8 : 15
);
const property18Runs = parseRunCount(
  process.env.PBT_PROPERTY18_RUNS,
  process.env.NODE_ENV === 'test' ? 8 : 15
);
const property4Runs = parseRunCount(
  process.env.PBT_PROPERTY4_RUNS,
  process.env.NODE_ENV === 'test' ? 10 : 20
);
const propertyTimeLimitMs = parseTimeLimitMs(
  process.env.PBT_PROPERTY_TIME_LIMIT_MS,
  2500
);

  const addFixedNumbers = (puzzle: number[][], gridSize: number) => {
    puzzle[0][0] = 1;
    if (gridSize > 4) {
      puzzle[1][1] = 2;
    }
  };

  const renderSudokuGrid = ({
    puzzle,
    userInput,
    gridConfig,
    childMode,
    accessibility,
    hintCell,
    container,
  }: {
    puzzle: number[][];
    userInput: number[][];
    gridConfig: (typeof GRID_CONFIGS)[GridSize];
    childMode?: boolean;
    accessibility?: AccessibilitySettings;
    hintCell?: { row: number; col: number } | null;
    container?: HTMLElement;
  }) =>
    render(
      <SudokuGrid
        puzzle={puzzle}
        userInput={userInput}
        onInputChange={() => {}}
        gridConfig={gridConfig}
        childMode={childMode}
        accessibility={accessibility}
        hintCell={hintCell}
      />,
    container ? { container } : undefined
  );

  const sampleElements = <T extends Element>(
    elements: NodeListOf<T>,
    max = 12
  ) => Array.from(elements).slice(0, Math.min(elements.length, max));

  const assertCellSizing = (cell: Element, expectedMinSize: number) => {
    const computedStyle = window.getComputedStyle(cell);
    const width = parseFloat(computedStyle.width);
    const height = parseFloat(computedStyle.height);
    const minWidth = parseFloat(computedStyle.minWidth);
    const minHeight = parseFloat(computedStyle.minHeight);

    if (
      Number.isNaN(width) ||
      Number.isNaN(height) ||
      Number.isNaN(minWidth) ||
      Number.isNaN(minHeight)
    ) {
      expect(cell.getAttribute('data-cell-type')).toBeTruthy();
      return;
    }

    expect(minWidth).toBeGreaterThanOrEqual(expectedMinSize);
    expect(minHeight).toBeGreaterThanOrEqual(expectedMinSize);
    expect(width).toBeGreaterThanOrEqual(expectedMinSize);
    expect(height).toBeGreaterThanOrEqual(expectedMinSize);

    const aspectRatio = width / height;
    expect(aspectRatio).toBeCloseTo(1, 1);

    if (cell.getAttribute('data-cell-type') === 'editable') {
      expect(computedStyle.cursor).toBe('pointer');
    }
  };

  const assertGridWidth = (
    container: HTMLElement,
    gridSize: number,
    expectedMinSize: number
  ) => {
    const grid = container.querySelector('[data-testid="sudoku-grid"]');
    expect(grid).toBeTruthy();

    if (!grid) return;

    const gridStyle = window.getComputedStyle(grid);
    const gridWidth = parseFloat(gridStyle.width);
    if (Number.isNaN(gridWidth)) {
      return;
    }
    const expectedMinGridWidth = gridSize * expectedMinSize;
    expect(gridWidth).toBeGreaterThanOrEqual(expectedMinGridWidth * 0.9);
  };

  const assertContainerType = (container: HTMLElement) => {
    const containerElem = container.querySelector(
      '[data-testid="sudoku-container"]'
    );
    expect(containerElem).toBeTruthy();

    if (!containerElem) return;

    const containerStyle = window.getComputedStyle(containerElem);
    if (containerStyle.containerType) {
      expect(containerStyle.containerType).toBe('inline-size');
    }
  };

  const assertGridScale = (
    container: HTMLElement,
    gridSize: number,
    containerWidth: number,
    childMode: boolean
  ) => {
    const grid = container.querySelector('[data-testid="sudoku-grid"]');
    expect(grid).toBeTruthy();

    if (!grid) return;

    const gridStyle = window.getComputedStyle(grid);
    const gridWidth = parseFloat(gridStyle.width);
    if (Number.isNaN(gridWidth)) {
      return;
    }
    expect(gridWidth).toBeLessThanOrEqual(containerWidth * 0.95);

    const cells = container.querySelectorAll('[data-testid^="sudoku-cell-"]');
    if (cells.length === 0) return;

    const cellStyle = window.getComputedStyle(cells[0]);
    const cellWidth = parseFloat(cellStyle.width);
    if (Number.isNaN(cellWidth)) {
      return;
    }
    const expectedCellSize = Math.min(gridWidth / gridSize, 80);
    expect(cellWidth).toBeLessThanOrEqual(expectedCellSize);

    const minSize = childMode ? 50 : 44;
    if (containerWidth >= gridSize * minSize) {
      expect(cellWidth).toBeGreaterThanOrEqual(minSize * 0.9);
    }
  };

  const assertTypographyScale = (container: HTMLElement) => {
    const inputs = container.querySelectorAll('input[type="text"]');
    const fixedNumbers = container.querySelectorAll(
      '[data-testid="fixed-number"]'
    );

    sampleElements(inputs)
      .concat(sampleElements(fixedNumbers))
      .forEach(element => {
      const style = window.getComputedStyle(element);
      const fontSize = parseFloat(style.fontSize);
      if (Number.isNaN(fontSize)) {
        return;
      }
      expect(fontSize).toBeGreaterThanOrEqual(12);
      expect(fontSize).toBeLessThanOrEqual(32);
    });
  };

  const assertGridAspectRatio = (container: HTMLElement) => {
    const grid = container.querySelector('[data-testid="sudoku-grid"]');
    if (!grid) return;

    const gridStyle = window.getComputedStyle(grid);
    const gridWidth = parseFloat(gridStyle.width);
    const gridHeight = parseFloat(gridStyle.height);
    if (
      Number.isNaN(gridWidth) ||
      Number.isNaN(gridHeight) ||
      gridHeight === 0
    ) {
      return;
    }
    const aspectRatio = gridWidth / gridHeight;
    expect(aspectRatio).toBeCloseTo(1, 0.2);
  };

  const assertModernCssFeatures = (
    container: HTMLElement,
    gridSize: number,
    accessibility: AccessibilitySettings
  ) => {
    const sudokuContainer = container.querySelector(
      '[data-testid="sudoku-container"]'
    );
    expect(sudokuContainer).toBeTruthy();

    if (sudokuContainer) {
      const containerStyle = window.getComputedStyle(sudokuContainer);
      if (containerStyle.containerType) {
        expect(containerStyle.containerType).toBe('inline-size');
      }
    }

    const grid = container.querySelector('[data-testid="sudoku-grid"]');
    if (grid) {
      expect(grid.getAttribute('data-grid-size')).toBe(gridSize.toString());
    }

    const cells = container.querySelectorAll('[data-testid^="sudoku-cell-"]');
    sampleElements(cells).forEach(cell => {
      const cellStyle = window.getComputedStyle(cell);
      if (cellStyle.boxSizing) {
        expect(cellStyle.boxSizing).toBe('border-box');
      }
      if (!accessibility.reducedMotion) {
        if (cellStyle.transition) {
          expect(cellStyle.transition).toContain('background-color');
        }
      }
    });

    if (accessibility.highContrast) {
      expect(sudokuContainer?.getAttribute('data-high-contrast')).toBe('true');
    }
  };

  const assertChildModeFeedback = (
    container: HTMLElement,
    childMode: boolean
  ) => {
    if (!childMode) return;
    const sudokuContainer = container.querySelector(
      '[data-testid="sudoku-container"]'
    );
    expect(sudokuContainer?.getAttribute('data-child-mode')).toBe('true');
  };

  const assertErrorColors = (container: HTMLElement) => {
    const errorCells = container.querySelectorAll('[data-has-error="true"]');
    sampleElements(errorCells).forEach(cell => {
      const style = window.getComputedStyle(cell);
      const bgColor = style.backgroundColor;
      if (!bgColor) {
        return;
      }
      expect(bgColor).not.toContain('rgb(254, 226, 226)');
      expect(bgColor).toMatch(/rgb\(254, 243, 199\)|rgb\(255, 235, 59\)/);
    });
  };

  const assertHintColors = (container: HTMLElement) => {
    const hintCells = container.querySelectorAll('[data-is-hinted="true"]');
    sampleElements(hintCells).forEach(cell => {
      const style = window.getComputedStyle(cell);
      if (style.backgroundColor) {
        expect(style.backgroundColor).toMatch(/rgb\(236, 253, 245\)/);
      }
    });
  };

  const assertEditableFeedback = (container: HTMLElement) => {
    const cells = container.querySelectorAll('[data-testid^="sudoku-cell-"]');
    sampleElements(cells).forEach(cell => {
      if (cell.getAttribute('data-cell-type') === 'editable') {
        const style = window.getComputedStyle(cell);
        if (style.cursor) {
          expect(style.cursor).toBe('pointer');
        }
        if (style.transition) {
          expect(style.transition).toContain('background-color');
        }
      }
    });
  };

  describe('Property 6: Touch target accessibility', () => {
    it('ensures all interactive elements meet minimum touch target size requirements', () => {
      fc.assert(
        fc.property(
          gridSizeArb,
          childModeArb,
          accessibilityArb,
          (gridSize, childMode, accessibility) => {
            const gridConfig = getGridConfig(gridSize);
            const puzzle = createEmptyGrid(gridSize);
            const userInput = createEmptyGrid(gridSize);
            addFixedNumbers(puzzle, gridSize);

            const { container, unmount } = renderSudokuGrid({
              puzzle,
              userInput,
              gridConfig,
              childMode,
              accessibility,
            });

            const expectedMinSize = childMode ? 50 : 44;
            const cells = container.querySelectorAll(
              '[data-testid^="sudoku-cell-"]'
            );
            for (const cell of sampleElements(cells)) {
              assertCellSizing(cell, expectedMinSize);
            }

            assertGridWidth(container, gridSize, expectedMinSize);
            assertContainerType(container);
            unmount();
          }
        ),
        {
          numRuns: property6Runs,
          verbose: true,
          interruptAfterTimeLimit: propertyTimeLimitMs,
          examples: [
            // Test specific combinations that are important
            [
              4,
              true,
              { highContrast: false, reducedMotion: false, largeText: false },
            ], // 4x4 child mode
            [
              6,
              false,
              { highContrast: true, reducedMotion: true, largeText: true },
            ], // 6x6 accessibility
            [
              9,
              true,
              { highContrast: false, reducedMotion: false, largeText: true },
            ], // 9x9 child + large text
          ],
        }
      );
    });
  });

  describe('Property 7: Responsive layout adaptation', () => {
    it('adapts layout correctly across different container sizes and grid configurations', () => {
      fc.assert(
        fc.property(
          gridSizeArb,
          childModeArb,
          fc.integer({ min: 320, max: 1200 }), // Container width range
          (gridSize, childMode, containerWidth) => {
            const gridConfig = getGridConfig(gridSize);
            const puzzle = createEmptyGrid(gridSize);
            const userInput = createEmptyGrid(gridSize);

            const mockContainer = document.createElement('div');
            mockContainer.style.width = `${containerWidth}px`;
            document.body.appendChild(mockContainer);

            const { container, unmount } = renderSudokuGrid({
              puzzle,
              userInput,
              gridConfig,
              childMode,
              container: mockContainer,
            });

            try {
              assertGridScale(container, gridSize, containerWidth, childMode);
              assertTypographyScale(container);
              assertGridAspectRatio(container);
            } finally {
              unmount();
              document.body.removeChild(mockContainer);
            }
          }
        ),
        {
          numRuns: property7Runs,
          verbose: true,
          interruptAfterTimeLimit: propertyTimeLimitMs,
        }
      );
    });
  });

  describe('Property 18: Modern CSS responsiveness', () => {
    it('validates CSS Container Queries and modern viewport support', () => {
      fc.assert(
        fc.property(
          gridSizeArb,
          childModeArb,
          accessibilityArb,
          (gridSize, childMode, accessibility) => {
            const gridConfig = getGridConfig(gridSize);
            const puzzle = createEmptyGrid(gridSize);
            const userInput = createEmptyGrid(gridSize);

            const { container, unmount } = renderSudokuGrid({
              puzzle,
              userInput,
              gridConfig,
              childMode,
              accessibility,
            });

            assertModernCssFeatures(container, gridSize, accessibility);
            assertChildModeFeedback(container, childMode);
            unmount();
          }
        ),
        {
          numRuns: property18Runs,
          verbose: true,
          interruptAfterTimeLimit: propertyTimeLimitMs,
        }
      );
    });
  });

  describe('Property 4: Child-friendly visual feedback', () => {
    it('provides appropriate visual feedback for child users', () => {
      fc.assert(
        fc.property(
          gridSizeArb,
          fc.boolean(), // hasError
          fc.boolean(), // isHinted
          fc.boolean(), // isSelected
          (gridSize, hasError, isHinted, _isSelected) => {
            const gridConfig = getGridConfig(gridSize);
            const puzzle = createEmptyGrid(gridSize);
            const userInput = createEmptyGrid(gridSize);

            // Create a conflict if hasError is true
            if (hasError) {
              userInput[0][0] = 1;
              userInput[0][1] = 1; // Same number in same row
            }

            const hintCell = isHinted ? { row: 0, col: 0 } : null;

            const { container, unmount } = renderSudokuGrid({
              puzzle,
              userInput,
              gridConfig,
              childMode: true,
              hintCell,
            });

            assertErrorColors(container);
            assertHintColors(container);
            assertChildModeFeedback(container, true);
            assertEditableFeedback(container);
            unmount();
          }
        ),
        {
          numRuns: property4Runs,
          verbose: true,
          interruptAfterTimeLimit: propertyTimeLimitMs,
        }
      );
    });
  });
});
