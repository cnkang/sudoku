import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('keeps a saved completion after an older tab closes', async ({ context, page }) => {
  const puzzleResponse = page.waitForResponse(
    (response) => response.url().includes('/api/solveSudoku?') && response.ok(),
  );
  await page.goto('/');
  const { puzzle, solution } = (await (await puzzleResponse).json()) as {
    puzzle: number[][];
    solution: number[][];
  };
  const olderTab = await context.newPage();
  await olderTab.goto('/');
  await expect(olderTab.locator('table[data-grid-size="9"]')).toBeVisible();

  for (const [rowIndex, row] of puzzle.entries()) {
    for (const [columnIndex, digit] of row.entries()) {
      if (digit !== 0) continue;
      await page
        .getByRole('textbox', {
          name: `Row ${rowIndex + 1}, Column ${columnIndex + 1}`,
          exact: true,
        })
        .fill(String(solution[rowIndex]?.[columnIndex]));
    }
  }

  const savedCompletions = () =>
    page.evaluate(
      () =>
        Object.keys(localStorage).filter((key) => key.startsWith('sudoku-progress-completion:'))
          .length,
    );
  await expect.poll(savedCompletions).toBe(1);
  await olderTab.close();
  await page.reload();
  await expect.poll(savedCompletions).toBe(1);
});
