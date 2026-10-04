import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vite-plus/test';
import { POST } from '../src/app/api/solveSudoku/route';

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
        [0, 0, 0, 0, 8, 0, 0, 7, 9],
      ],
    };

    const request = new NextRequest('http://example.com/api/solveSudoku?difficulty=3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.solved).toBe(true);
  });
});
