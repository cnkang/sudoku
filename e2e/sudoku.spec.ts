import { expect, test } from '@playwright/test';

test.describe('Sudoku Game E2E Tests', () => {
  const waitForAppReady = async (page: import('@playwright/test').Page) => {
    await page.waitForSelector('main', { timeout: 15000 });
    await page.waitForSelector('text=Loading grid...', {
      state: 'hidden',
      timeout: 45000,
    });
    await expect(
      page.locator('#difficulty-select:visible').first()
    ).toBeVisible({ timeout: 20000 });
  };

  // Increase timeout for CI environments
  test.setTimeout(process.env.CI ? 90000 : 60000);
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage with more resilient wait strategy
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for hydration + initial puzzle load to complete.
    await waitForAppReady(page);
  });

  test('should load the homepage', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Sudoku/i);

    // Verify main content is visible
    const appMain = page
      .locator('main')
      .filter({ has: page.locator('h1', { hasText: 'Sudoku Challenge' }) })
      .first();
    await expect(appMain).toBeVisible();

    // Check for the main heading
    await expect(
      page.getByRole('heading', { level: 1, name: 'Sudoku Challenge' })
    ).toBeVisible();

    // Verify difficulty selector is present and functional
    const difficultySelect = page.locator('#difficulty-select:visible').first();
    await expect(difficultySelect).toBeVisible();
    await expect(difficultySelect).toBeEnabled();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify main content is visible on mobile
    const mobileMain = page
      .locator('main')
      .filter({ has: page.locator('h1', { hasText: 'Sudoku Challenge' }) })
      .first();
    await expect(mobileMain).toBeVisible();

    // Check that the heading is still visible
    await expect(
      page.getByRole('heading', { level: 1, name: 'Sudoku Challenge' })
    ).toBeVisible();

    // Verify viewport settings took effect
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(375);
    expect(viewport?.height).toBe(667);

    // Check that content adapts to mobile (should not overflow)
    const boundingBox = await mobileMain.boundingBox();
    expect(boundingBox?.width).toBeLessThanOrEqual(375);
  });

  test('should handle basic interactions', async ({ page }) => {
    // Verify page is interactive
    const readyState = await page.evaluate(() => document.readyState);
    expect(['interactive', 'complete']).toContain(readyState);

    // Test difficulty selector interaction
    const difficultySelector = page
      .locator('#difficulty-select:visible')
      .first();
    await expect(difficultySelector).toBeVisible();
    await expect(difficultySelector).toBeEnabled();

    // Get current value and verify it's valid
    const currentValue = await difficultySelector.inputValue();
    expect(Number.parseInt(currentValue, 10)).toBeGreaterThanOrEqual(1);
    expect(Number.parseInt(currentValue, 10)).toBeLessThanOrEqual(10);

    // Verify we can change the difficulty (this should trigger a new puzzle request)
    await page.waitForTimeout(5500);
    await difficultySelector.selectOption('2');
  });
});
