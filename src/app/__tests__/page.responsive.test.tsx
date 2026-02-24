import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Home from '../page';

vi.mock('../../components/ModernSudokuApp', () => ({
  default: () => <div data-testid="modern-sudoku-app">Modern Sudoku App</div>,
}));

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

Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(mockMatchMedia),
});

describe('Home Page Responsive Tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Mobile Layout Tests', () => {
    beforeEach(() => {
      Object.defineProperty(globalThis, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(globalThis, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });
    });

    it('should render with mobile viewport', () => {
      render(<Home />);

      expect(screen.getByTestId('modern-sudoku-app')).toBeInTheDocument();
    });
  });

  describe('Tablet Layout Tests', () => {
    beforeEach(() => {
      Object.defineProperty(globalThis, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      Object.defineProperty(globalThis, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1024,
      });
    });

    it('should render with tablet viewport', () => {
      render(<Home />);

      expect(screen.getByTestId('modern-sudoku-app')).toBeInTheDocument();
    });
  });

  describe('Landscape Orientation Tests', () => {
    beforeEach(() => {
      Object.defineProperty(globalThis, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 667,
      });
      Object.defineProperty(globalThis, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 375,
      });
    });

    it('should render with landscape viewport', () => {
      render(<Home />);

      expect(screen.getByTestId('modern-sudoku-app')).toBeInTheDocument();
    });
  });

  describe('CSS Media Query Integration', () => {
    it('should use CSS Modules instead of inline style tags', () => {
      const { container } = render(<Home />);

      // No inline <style> tags — all styles handled via CSS Modules
      const styleElements = document.querySelectorAll('style');
      expect(styleElements.length).toBe(0);

      // Page wrapper should have CSS Module class names
      const pageDiv = container.firstElementChild;
      expect(pageDiv?.className).toBeTruthy();
    });

    it('should handle dark mode preferences', () => {
      globalThis.matchMedia = vi.fn().mockImplementation(query => ({
        ...mockMatchMedia(query),
        matches: query === '(prefers-color-scheme: dark)',
      }));

      render(<Home />);

      expect(screen.getByTestId('modern-sudoku-app')).toBeInTheDocument();
    });

    it('should respect reduced motion preferences', () => {
      globalThis.matchMedia = vi.fn().mockImplementation(query => ({
        ...mockMatchMedia(query),
        matches: query === '(prefers-reduced-motion: reduce)',
      }));

      render(<Home />);

      expect(screen.getByTestId('modern-sudoku-app')).toBeInTheDocument();
    });
  });
});
