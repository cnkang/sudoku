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

  it('should handle cells with matching values correctly', () => {
    const userInput = mockPuzzle.map(row => [...row]);
    // Fill in some correct values
    userInput[0][2] = 4; // Correct value
    userInput[1][1] = 7; // Correct value

    const hint = getHint(mockPuzzle, userInput, mockSolution);

    // Should skip cells that are already correct and find next empty cell
    expect(hint).toBeDefined();
    if (hint) {
      // Should not suggest already correct cells
      expect(!(hint.row === 0 && hint.col === 2)).toBe(true);
      expect(!(hint.row === 1 && hint.col === 1)).toBe(true);
    }
  });

  it('should prioritize empty cells over incorrect cells', () => {
    const userInput = mockPuzzle.map(row => [...row]);
    // Add an incorrect value to a filled cell
    userInput[1][1] = 9; // Wrong value at position (1,1)

    const hint = getHint(mockPuzzle, userInput, mockSolution);

    // Should still return hint for first empty cell, not the incorrect one
    expect(hint?.row).toBe(0);
    expect(hint?.col).toBe(2);
    expect(hint?.value).toBe(4);
  });

  it('should handle case where all empty cells are filled but some are wrong', () => {
    const userInput = mockSolution.map(row => [...row]);
    // Make multiple cells wrong
    userInput[0][2] = 9;
    userInput[1][1] = 8;
    userInput[2][0] = 5;

    const hint = getHint(mockPuzzle, userInput, mockSolution);

    // Should return hint for first incorrect cell
    expect(hint).toBeDefined();
    if (hint) {
      expect(hint.value).toBe(mockSolution[hint.row][hint.col]);
    }
  });
});
