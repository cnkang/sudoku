import { describe, expect, it } from 'vite-plus/test';
import { parseSudokuPuzzle } from '../sudokuPuzzleSchema';

const createGrid = (size: number, value: number): number[][] =>
  Array.from({ length: size }, () => Array.from({ length: size }, () => value));

describe('parseSudokuPuzzle', () => {
  it('accepts a supported square puzzle response', () => {
    const response = {
      puzzle: createGrid(4, 0),
      solution: createGrid(4, 1),
      difficulty: 2,
    };

    expect(parseSudokuPuzzle(response)).toEqual(response);
  });

  it.each([
    {
      name: 'an unsupported grid size',
      response: { puzzle: createGrid(5, 0), solution: createGrid(5, 1), difficulty: 2 },
    },
    {
      name: 'mismatched puzzle and solution sizes',
      response: { puzzle: createGrid(4, 0), solution: createGrid(6, 1), difficulty: 2 },
    },
    {
      name: 'a non-square puzzle matrix',
      response: {
        puzzle: [
          [0, 0, 0, 0],
          [0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        solution: createGrid(4, 1),
        difficulty: 2,
      },
    },
    {
      name: 'a non-numeric cell',
      response: {
        puzzle: [[0, 0, 0, '1']],
        solution: [[1, 1, 1, 1]],
        difficulty: 2,
      },
    },
    {
      name: 'an invalid difficulty',
      response: { puzzle: createGrid(4, 0), solution: createGrid(4, 1), difficulty: 0 },
    },
  ])('rejects $name', ({ response }) => {
    expect(() => parseSudokuPuzzle(response)).toThrow();
  });
});
