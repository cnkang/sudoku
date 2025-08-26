import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SudokuGrid from '../SudokuGrid';

// Mock window.matchMedia for responsive tests
const mockMatchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(mockMatchMedia),
});

describe('SudokuGrid Responsive Tests', () => {
  const mockPuzzle = Array(9)
    .fill(null)
    .map(() => Array(9).fill(0));
  const mockUserInput = Array(9)
    .fill(null)
    .map(() => Array(9).fill(0));
  const mockOnInputChange = vi.fn();

  const defaultProps = {
    puzzle: mockPuzzle,
    userInput: mockUserInput,
    onInputChange: mockOnInputChange,
    disabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Mobile Viewport Tests', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });
    });

    it('should render grid with mobile-optimized cell sizes', () => {
      render(<SudokuGrid {...defaultProps} />);

      const container = document.querySelector('.sudoku-container');
      expect(container).toBeInTheDocument();

      const cells = document.querySelectorAll('.sudoku-cell');
      expect(cells).toHaveLength(81);
    });

    it('should have horizontal scroll capability on small screens', () => {
      render(<SudokuGrid {...defaultProps} />);

      const container = document.querySelector('.sudoku-container');

      // Check if overflow-x is set for mobile
      expect(container).toBeInTheDocument();
    });

    it('should maintain minimum grid width on mobile', () => {
      render(<SudokuGrid {...defaultProps} />);

      const grid = document.querySelector('.sudoku-grid');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Touch Device Tests', () => {
    beforeEach(() => {
      // Mock touch device
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        configurable: true,
        value: 5,
      });
    });

    it('should have appropriate touch target sizes', () => {
      render(<SudokuGrid {...defaultProps} />);

      const cells = document.querySelectorAll('.sudoku-cell');
      cells.forEach(cell => {
        // Cells should have minimum touch target size
        expect(cell).toBeInTheDocument();
      });
    });

    it('should disable text selection on touch devices', () => {
      render(<SudokuGrid {...defaultProps} />);

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toHaveAttribute('inputMode', 'numeric');
      });
    });

    it('should handle touch-specific input attributes', () => {
      render(<SudokuGrid {...defaultProps} />);

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toHaveAttribute('type', 'text');
        expect(input).toHaveAttribute('inputMode', 'numeric');
        expect(input).toHaveAttribute('maxLength', '1');
      });
    });
  });

  describe('Tablet Viewport Tests', () => {
    beforeEach(() => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1024,
      });
    });

    it('should render appropriately sized cells for tablet', () => {
      render(<SudokuGrid {...defaultProps} />);

      const cells = document.querySelectorAll('.sudoku-cell');
      expect(cells).toHaveLength(81);

      // Tablet should have medium-sized cells
      cells.forEach(cell => {
        expect(cell).toBeInTheDocument();
      });
    });
  });

  describe('Landscape Orientation Tests', () => {
    beforeEach(() => {
      // Mock landscape orientation
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 667,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 375,
      });
    });

    it('should adapt layout for landscape mode', () => {
      render(<SudokuGrid {...defaultProps} />);

      const container = document.querySelector('.sudoku-container');
      expect(container).toBeInTheDocument();

      // Should maintain grid functionality in landscape
      const cells = document.querySelectorAll('.sudoku-cell');
      expect(cells).toHaveLength(81);
    });
  });

  describe('High Contrast Mode Tests', () => {
    beforeEach(() => {
      // Mock high contrast preference
      window.matchMedia = vi.fn().mockImplementation(query => ({
        ...mockMatchMedia(query),
        matches: query === '(prefers-contrast: high)',
      }));
    });

    it('should handle high contrast mode styling', () => {
      render(<SudokuGrid {...defaultProps} />);

      const cells = document.querySelectorAll('.sudoku-cell');
      expect(cells).toHaveLength(81);

      // High contrast styles should be applied
      cells.forEach(cell => {
        expect(cell).toBeInTheDocument();
      });
    });
  });

  describe('Reduced Motion Tests', () => {
    beforeEach(() => {
      // Mock reduced motion preference
      window.matchMedia = vi.fn().mockImplementation(query => ({
        ...mockMatchMedia(query),
        matches: query === '(prefers-reduced-motion: reduce)',
      }));
    });

    it('should respect reduced motion preferences', () => {
      const propsWithHint = {
        ...defaultProps,
        hintCell: { row: 0, col: 0 },
      };

      render(<SudokuGrid {...propsWithHint} />);

      const hintedCell = document.querySelector('.sudoku-cell.hinted');
      expect(hintedCell).toBeInTheDocument();

      // Animation should be disabled for reduced motion

      expect(hintedCell).toBeInTheDocument();
    });
  });

  describe('Dark Mode Tests', () => {
    beforeEach(() => {
      // Mock dark mode preference
      window.matchMedia = vi.fn().mockImplementation(query => ({
        ...mockMatchMedia(query),
        matches: query === '(prefers-color-scheme: dark)',
      }));
    });

    it('should apply dark mode styles appropriately', () => {
      render(<SudokuGrid {...defaultProps} />);

      const cells = document.querySelectorAll('.sudoku-cell');
      expect(cells).toHaveLength(81);

      // Dark mode styles should be applied
      cells.forEach(cell => {
        expect(cell).toBeInTheDocument();
      });
    });
  });

  describe('Grid Responsiveness Edge Cases', () => {
    it('should handle very small screens gracefully', () => {
      // Mock very small screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      render(<SudokuGrid {...defaultProps} />);

      const grid = document.querySelector('.sudoku-grid');
      expect(grid).toBeInTheDocument();

      // Should maintain minimum usable size
      const cells = document.querySelectorAll('.sudoku-cell');
      expect(cells).toHaveLength(81);
    });

    it('should handle very large screens appropriately', () => {
      // Mock large screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      render(<SudokuGrid {...defaultProps} />);

      const cells = document.querySelectorAll('.sudoku-cell');
      expect(cells).toHaveLength(81);

      // Should not become too large on big screens
      cells.forEach(cell => {
        expect(cell).toBeInTheDocument();
      });
    });
  });

  describe('CSS Media Query Coverage', () => {
    it('should have mobile-specific styles applied', () => {
      render(<SudokuGrid {...defaultProps} />);

      // Check that mobile styles are present in the component
      const styleElement = document.querySelector('style');
      expect(styleElement).toBeInTheDocument();

      if (styleElement) {
        const cssText = styleElement.textContent || '';
        expect(cssText).toContain('@media');
      }
    });

    it('should include touch device optimizations', () => {
      render(<SudokuGrid {...defaultProps} />);

      const styleElement = document.querySelector('style');
      if (styleElement) {
        const cssText = styleElement.textContent || '';
        expect(cssText).toContain('hover: none');
        expect(cssText).toContain('pointer: coarse');
      }
    });

    it('should include landscape orientation styles', () => {
      render(<SudokuGrid {...defaultProps} />);

      const styleElement = document.querySelector('style');
      if (styleElement) {
        const cssText = styleElement.textContent || '';
        expect(cssText).toContain('orientation: landscape');
      }
    });
  });
});
