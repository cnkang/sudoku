import { describe, it, expect, vi } from 'vitest';
import { POST } from '../src/app/api/solveSudoku/route';
import { NextRequest } from 'next/server';

vi.mock('fast-sudoku-solver', () => ({
  solveSudoku: (board: number[][]) => {
    return [true, board]; // Mock solver
  },
}));

describe('Sudoku Solver API', () => {
  it('responds with a solvable status', async () => {
    const requestBody = {
      board: [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9]
      ]
    };

    const request = {
      method: 'POST',
      url: 'http://example.com/api/solveSudoku?difficulty=3',
      headers: { 'Content-Type': 'application/json' },
      json: async () => requestBody,
      cookies: {},
    } as unknown as NextRequest;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.solved).toBe(true);
  });
});
