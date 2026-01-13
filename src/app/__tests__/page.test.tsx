import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Home from '../page';

vi.mock('../../components/ModernSudokuApp', () => ({
  default: () => <div data-testid="modern-sudoku-app">Modern Sudoku App</div>,
}));

describe('Home Page', () => {
  it('should render the modern app container', () => {
    render(<Home />);

    expect(screen.getByTestId('modern-sudoku-app')).toBeInTheDocument();
  });

  it('should inject styles for the page', () => {
    render(<Home />);

    const styleElements = document.querySelectorAll('style');
    expect(styleElements.length).toBeGreaterThan(0);
  });
});
