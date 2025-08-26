import { describe, it, expect } from 'vitest';
import { getHint } from '../hints';

describe('Hints Utility', () => {
  const mockPuzzle = [
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

  const mockSolution = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9],
  ];

  it('should return hint for first empty cell', () => {
    const userInput = mockPuzzle.map(row => [...row]);

    const hint = getHint(mockPuzzle, userInput, mockSolution);

    expect(hint).toEqual({
      row: 0,
      col: 2,
      value: 4,
      reason: 'Try placing 4 in row 1, column 3',
    });
  });

  it('should return hint for incorrect cell when no empty cells', () => {
    const userInput = mockSolution.map(row => [...row]);
    userInput[0][2] = 9; // Wrong value at position (0,2)

    const hint = getHint(mockPuzzle, userInput, mockSolution);

    expect(hint).toEqual({
      row: 0,
      col: 2,
      value: 4,
      reason: 'The value in row 1, column 3 should be 4',
    });
  });

  it('should return null when no hints available', () => {
    // Create a completed puzzle where all cells match the solution
    const userInput = mockSolution.map(row => [...row]);
    const completedPuzzle = mockSolution.map(row => [...row]);

    const hint = getHint(completedPuzzle, userInput, mockSolution);

    expect(hint).toBeNull();
  });
});
