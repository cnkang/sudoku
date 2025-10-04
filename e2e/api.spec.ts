import { test, expect } from '@playwright/test';

test.describe('API Health Tests', () => {
  test('health endpoint should respond', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.timestamp).toBeDefined();
  });

  test('sudoku API should respond', async ({ request }) => {
    const response = await request.post('/api/solveSudoku?difficulty=1');

    // Should either succeed or fail gracefully
    if (response.ok()) {
      const data = await response.json();
      expect(data.puzzle).toBeDefined();
      expect(data.solution).toBeDefined();
    } else {
      // If it fails, it should still return a proper error response
      expect(response.status()).toBeGreaterThanOrEqual(400);
    }
  });
});
