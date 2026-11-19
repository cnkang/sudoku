import { expect, test } from '@playwright/test';

// Chromium-only: relies on Chromium's offline emulation and service worker control.
// The Firefox and WebKit projects ignore this spec in playwright.config.ts.
test('opens a new grid size after an offline reload', async ({ context, page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('table[data-grid-size="9"]')).toBeVisible({ timeout: 15000 });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));

  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('table[data-grid-size="9"]')).toBeVisible();
  const selector = page.getByRole('region', { name: 'PWA and grid size settings' });
  await selector.locator('label[for="grid-option-4"]').click();
  await expect(page.locator('table[data-grid-size="4"]')).toBeVisible();
  await expect(page.getByRole('button', { name: /magic wand hint/i })).toBeVisible();
  await expect(selector.locator('#grid-option-6')).toBeEnabled();
  await selector.locator('label[for="grid-option-6"]').click();
  await expect(page.locator('table[data-grid-size="6"]')).toBeVisible();
});
