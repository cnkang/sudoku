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

  it('should use CSS Modules for styling instead of inline styles', () => {
    const { container } = render(<Home />);

    // Inline <style> tags should not be present — styles are handled via CSS Modules
    const styleElements = document.querySelectorAll('style');
    expect(styleElements.length).toBe(0);

    // The page wrapper should have CSS Module class names applied
    const pageDiv = container.firstElementChild;
    expect(pageDiv).toBeTruthy();
    expect(pageDiv?.className).toBeTruthy();
  });
});
