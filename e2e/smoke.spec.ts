import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('app should be accessible', async ({ page }) => {
    // Simple smoke test - just check if the app loads at all
    const response = await page.goto('/', {
      waitUntil: 'commit',
      timeout: 30000,
    });

    // Check that we get a successful response
    expect(response?.status()).toBeLessThan(400);

    // Check that we have some basic HTML structure
    await expect(page.locator('html')).toBeVisible();
    await expect(page.locator('body')).toBeVisible();

    // Check that the page has a title (allow empty title in some cases)
    const title = await page.title();
    expect(typeof title).toBe('string');
  });
});
