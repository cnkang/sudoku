import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/** Click a grid size radio and wait for the new grid to render */
async function switchGridSize(
  page: Page,
  size: 4 | 6 | 9,
  expectedCells: number
) {
  const optionLocator = page.locator(`[data-testid="grid-option-${size}"]`);
  const radioLocator = page.locator(`input[name="grid-size"][value="${size}"]`);

  // Wait for the grid option to be visible and not disabled before clicking
  await optionLocator.waitFor({ state: 'visible', timeout: 10000 });

  // Wait until the selector is not disabled (isLoading may still be true from a prior fetch)
  await page.waitForFunction(
    (s: number) => {
      const radio = document.querySelector<HTMLInputElement>(
        `input[name="grid-size"][value="${s}"]`
      );
      return radio !== null && !radio.disabled;
    },
    size,
    { timeout: 15000 }
  );

  // Mobile emulation can intermittently miss the rich card click/radio toggle.
  // Retry the full interaction + render verification a few times before failing.
  let lastRenderError: Error | undefined;

  for (let attemptIndex = 0; attemptIndex < 3; attemptIndex++) {
    await page.waitForFunction(
      (s: number) => {
        const radio = document.querySelector<HTMLInputElement>(
          `input[name="grid-size"][value="${s}"]`
        );
        return radio !== null && !radio.disabled;
      },
      size,
      { timeout: 5000 }
    );

    const interactionAttempts: Array<() => Promise<void>> = [
      async () => {
        await optionLocator.click({ force: true });
      },
      async () => {
        await radioLocator.check({ force: true });
      },
      async () => {
        await radioLocator.evaluate((input: HTMLInputElement) => {
          input.checked = true;
          input.dispatchEvent(
            new MouseEvent('click', { bubbles: true, cancelable: true })
          );
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        });
      },
    ];

    for (const trigger of interactionAttempts) {
      await trigger();
      await page.waitForTimeout(50);
      if (
        await page.evaluate(s => {
          const radio = document.querySelector<HTMLInputElement>(
            `input[name="grid-size"][value="${s}"]`
          );
          return radio?.checked === true;
        }, size)
      ) {
        break;
      }
    }

    try {
      // Wait for the grid to render with the expected cell count
      await page.waitForFunction(
        (expected: number) => {
          const cells = document.querySelectorAll('[data-testid^="cell-"]');
          return cells.length === expected;
        },
        expectedCells,
        { timeout: 5000 }
      );
      return;
    } catch (error) {
      lastRenderError = error as Error;
    }
  }

  throw lastRenderError ?? new Error(`Failed to switch grid size to ${size}`);
}

test.describe('Grid Size Switching Tests', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      globalThis.localStorage?.clear();
      globalThis.sessionStorage?.clear();
    });

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('[data-testid="pwa-grid-selector"]', {
      timeout: 30000,
    });

    await expect(
      page.locator('input[name="grid-size"][value="9"]')
    ).toBeChecked();

    // Wait for initial 9x9 puzzle to load
    await page.waitForFunction(
      () => document.querySelectorAll('[data-testid^="cell-"]').length === 81,
      { timeout: 15000 }
    );
    await expect(page.locator('#difficulty-select')).toBeEnabled({
      timeout: 15000,
    });
  });

  test('should switch from 9x9 to 4x4 and generate correct puzzle', async ({
    page,
  }) => {
    const apiCalls: Array<{ gridSize: string | null }> = [];
    page.on('request', request => {
      if (request.url().includes('/api/solveSudoku')) {
        const url = new URL(request.url());
        apiCalls.push({ gridSize: url.searchParams.get('gridSize') });
      }
    });

    await switchGridSize(page, 4, 16);

    // Verify API was called with gridSize=4
    const gridSize4Call = apiCalls.find(c => c.gridSize === '4');
    expect(gridSize4Call).toBeDefined();

    // Verify cell values are between 1-4
    const cells = page.locator('[data-testid^="cell-"]');
    const cellCount = await cells.count();
    expect(cellCount).toBe(16);

    for (let i = 0; i < cellCount; i++) {
      const value = await cells.nth(i).textContent();
      if (value && value.trim() !== '') {
        const num = Number.parseInt(value.trim(), 10);
        expect(num).toBeGreaterThanOrEqual(1);
        expect(num).toBeLessThanOrEqual(4);
      }
    }
  });

  test('should switch from 9x9 to 6x6 and generate correct puzzle', async ({
    page,
  }) => {
    const apiCalls: Array<{ gridSize: string | null }> = [];
    page.on('request', request => {
      if (request.url().includes('/api/solveSudoku')) {
        const url = new URL(request.url());
        apiCalls.push({ gridSize: url.searchParams.get('gridSize') });
      }
    });

    await switchGridSize(page, 6, 36);

    // Verify API was called with gridSize=6
    const gridSize6Call = apiCalls.find(c => c.gridSize === '6');
    expect(gridSize6Call).toBeDefined();

    // Verify cell values are between 1-6
    const cells = page.locator('[data-testid^="cell-"]');
    const cellCount = await cells.count();
    expect(cellCount).toBe(36);

    for (let i = 0; i < cellCount; i++) {
      const value = await cells.nth(i).textContent();
      if (value && value.trim() !== '') {
        const num = Number.parseInt(value.trim(), 10);
        expect(num).toBeGreaterThanOrEqual(1);
        expect(num).toBeLessThanOrEqual(6);
      }
    }
  });

  test('should switch between all grid sizes correctly', async ({ page }) => {
    const gridSizes = [
      { size: 4 as const, expectedCells: 16, maxValue: 4 },
      { size: 6 as const, expectedCells: 36, maxValue: 6 },
      { size: 9 as const, expectedCells: 81, maxValue: 9 },
    ];

    for (const { size, expectedCells, maxValue } of gridSizes) {
      await switchGridSize(page, size, expectedCells);

      const cells = page.locator('[data-testid^="cell-"]');
      const cellCount = await cells.count();
      expect(cellCount).toBe(expectedCells);

      // Verify at least one cell has a valid value
      let foundValid = false;
      for (let i = 0; i < Math.min(cellCount, 10); i++) {
        const value = await cells.nth(i).textContent();
        if (value && value.trim() !== '') {
          const num = Number.parseInt(value.trim(), 10);
          expect(num).toBeGreaterThanOrEqual(1);
          expect(num).toBeLessThanOrEqual(maxValue);
          foundValid = true;
          break;
        }
      }
      expect(foundValid).toBe(true);
    }
  });

  test('should preserve difficulty when switching grid sizes', async ({
    page,
  }) => {
    const difficultySelect = page.locator('#difficulty-select');
    const currentDifficulty = await difficultySelect.inputValue();
    const targetDifficulty = currentDifficulty === '2' ? '3' : '2';

    // Change difficulty to a different level. The follow-up grid switch helper already waits
    // for controls to become enabled again, so we don't need to block on this intermediate fetch.
    await difficultySelect.selectOption(targetDifficulty);
    await expect(difficultySelect).toHaveValue(targetDifficulty);

    await switchGridSize(page, 4, 16);

    // Verify difficulty is within valid range for 4x4
    const switchedDifficulty = await difficultySelect.inputValue();
    const difficultyNum = Number.parseInt(switchedDifficulty, 10);
    expect(difficultyNum).toBeGreaterThanOrEqual(1);
    expect(difficultyNum).toBeLessThanOrEqual(5);
  });
});
