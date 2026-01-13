import { test, expect } from '@playwright/test';

test.describe('Sudoku Game E2E Tests', () => {
  // Increase timeout for CI environments
  test.setTimeout(process.env.CI ? 90000 : 60000);
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage with more resilient wait strategy
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for the main content to be visible instead of networkidle
    // This is more reliable in CI environments where API calls might be slower
    await page.waitForSelector('main', { timeout: 15000 });
  });

  test('should load the homepage', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Sudoku/i);

    // Verify main content is visible
    await expect(page.locator('main')).toBeVisible();

    // Check for the main heading
    await expect(page.locator('h1')).toContainText('Sudoku Challenge');

    // Verify difficulty selector is present and functional
    const difficultySelect = page.locator('#difficulty-select');
    await expect(difficultySelect).toBeVisible();
    await expect(difficultySelect).toBeEnabled();

    // Verify the page structure is correct (either loading or game content)
    const hasLoadingState = await page.locator('.loading-state').isVisible();
    const hasGameGrid = await page
      .locator('[data-testid="sudoku-grid"]')
      .isVisible();

    // At least one should be visible
    expect(hasLoadingState || hasGameGrid).toBeTruthy();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify main content is visible on mobile
    await expect(page.locator('main')).toBeVisible();

    // Check that the heading is still visible
    await expect(page.locator('h1')).toBeVisible();

    // Verify viewport settings took effect
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(375);
    expect(viewport?.height).toBe(667);

    // Check that content adapts to mobile (should not overflow)
    const mainElement = page.locator('main');
    const boundingBox = await mainElement.boundingBox();
    expect(boundingBox?.width).toBeLessThanOrEqual(375);
  });

  test('should handle basic interactions', async ({ page }) => {
    // Verify page is interactive
    const readyState = await page.evaluate(() => document.readyState);
    expect(['interactive', 'complete']).toContain(readyState);

    // Test difficulty selector interaction
    const difficultySelector = page.locator('#difficulty-select');
    await expect(difficultySelector).toBeVisible();
    await expect(difficultySelector).toBeEnabled();

    // Get current value and verify it's valid
    const currentValue = await difficultySelector.inputValue();
    expect(parseInt(currentValue, 10)).toBeGreaterThanOrEqual(1);
    expect(parseInt(currentValue, 10)).toBeLessThanOrEqual(10);

    // Verify we can change the difficulty (this should trigger a new puzzle request)
    await difficultySelector.selectOption('2');
    await expect(difficultySelector).toHaveValue('2');
  });
});
