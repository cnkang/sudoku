import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import SharedSudokuGrid from '../SharedSudokuGrid';

const emptyGrid = (size = 9): number[][] =>
  Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
const puzzle = emptyGrid();
puzzle[0][2] = 3;

const renderGrid = (overrides: Partial<React.ComponentProps<typeof SharedSudokuGrid>> = {}) =>
  render(
    <SharedSudokuGrid
      gridSize={9}
      maxValue={9}
      ariaLabel="test grid"
      performanceLabel="TestGrid"
      tableClassName="test-grid"
      puzzle={puzzle}
      userInput={puzzle.map((row) => [...row])}
      onInputChange={vi.fn()}
      accessibilityDefaults={{ highContrast: false, reducedMotion: false, largeText: false }}
      {...overrides}
    />,
  );

describe('SharedSudokuGrid interactions', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 0;
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it('highlights the selected cell, its row/column/box and matching digits', () => {
    const input = puzzle.map((row) => [...row]);
    input[0][1] = 3;
    const { container } = renderGrid({ userInput: input });
    const cell = container.querySelector('td[data-row="0"][data-col="1"]') as HTMLElement;
    fireEvent.focus(cell.querySelector('input') as HTMLInputElement);

    expect(cell.getAttribute('data-selected')).toBe('true');
    expect(container.querySelectorAll('td[class*=relatedCell]').length).toBeGreaterThan(0);
    const matching = container.querySelector('td[data-row="0"][data-col="2"]') as HTMLElement;
    expect(matching.className).toContain('sameValueCell');
  });

  it('advances focus to the next empty cell after a valid entry', () => {
    const { container } = renderGrid();
    const first = container.querySelector(
      'td[data-row="0"][data-col="0"] input',
    ) as HTMLInputElement;
    fireEvent.focus(first);
    fireEvent.change(first, { target: { value: '5' } });

    expect(document.activeElement).toBe(
      container.querySelector('td[data-row="0"][data-col="1"] input'),
    );
  });

  it('renders a number pad in child mode that erases the selected cell', () => {
    const onInputChange = vi.fn();
    const { container } = renderGrid({ childMode: true, onInputChange });
    fireEvent.focus(container.querySelector('td[data-row="0"][data-col="0"] input') as HTMLElement);

    const pad = screen.getByRole('group', { name: 'Number pad' });
    fireEvent.click(pad.querySelector('[aria-label="Enter 4"]') as HTMLElement);
    expect(onInputChange).toHaveBeenCalledWith(0, 0, 4);

    fireEvent.click(pad.querySelector('[aria-label="Erase"]') as HTMLElement);
    // Focus auto-advanced to the next empty cell, so erase targets that cell.
    expect(onInputChange).toHaveBeenCalledWith(0, 1, 0);
  });
});
