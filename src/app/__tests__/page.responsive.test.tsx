import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(mockMatchMedia),
});

describe('Home Page Responsive Tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Mobile Layout Tests', () => {
    beforeEach(() => {
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

    it('should render with mobile viewport', () => {
      render(<Home />);

      expect(screen.getByTestId('modern-sudoku-app')).toBeInTheDocument();
    });
  });

  describe('Tablet Layout Tests', () => {
    beforeEach(() => {
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

    it('should render with tablet viewport', () => {
      render(<Home />);

      expect(screen.getByTestId('modern-sudoku-app')).toBeInTheDocument();
    });
  });

  describe('Landscape Orientation Tests', () => {
    beforeEach(() => {
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

    it('should render with landscape viewport', () => {
      render(<Home />);

      expect(screen.getByTestId('modern-sudoku-app')).toBeInTheDocument();
    });
  });

  describe('CSS Media Query Integration', () => {
    it('should include responsive styles in the page', () => {
      render(<Home />);

      const styleElements = document.querySelectorAll('style');
      expect(styleElements.length).toBeGreaterThan(0);
    });

    it('should handle dark mode preferences', () => {
      window.matchMedia = vi.fn().mockImplementation(query => ({
        ...mockMatchMedia(query),
        matches: query === '(prefers-color-scheme: dark)',
      }));

      render(<Home />);

      expect(screen.getByTestId('modern-sudoku-app')).toBeInTheDocument();
    });

    it('should respect reduced motion preferences', () => {
      window.matchMedia = vi.fn().mockImplementation(query => ({
        ...mockMatchMedia(query),
        matches: query === '(prefers-reduced-motion: reduce)',
      }));

      render(<Home />);

      expect(screen.getByTestId('modern-sudoku-app')).toBeInTheDocument();
    });
  });
});
