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
    const appMain = page
      .locator('main')
      .filter({ has: page.locator('h1', { hasText: 'Sudoku Challenge' }) })
      .first();
    await expect(appMain).toBeVisible();

    // Check for the main heading
    await expect(page.locator('h1')).toContainText('Sudoku Challenge');

    // Verify difficulty selector is present and functional
    const difficultySelect = page.locator('#difficulty-select').first();
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
    await expect(page.locator('h1')).toBeVisible();

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
      .getByLabel('Select difficulty level')
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
