import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function waitForAppReady(page: import('@playwright/test').Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('main', { timeout: 30000 });
  await page.waitForSelector('text=Loading grid...', {
    state: 'hidden',
    timeout: 45000,
  });
  await expect(page.locator('#difficulty-select:visible').first()).toBeVisible({
    timeout: 15000,
  });
}

test.describe('Accessibility E2E', () => {
  test('should have no critical accessibility violations on homepage', async ({
    page,
  }) => {
    await waitForAppReady(page);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2)
    ).toEqual([]);
  });

  test('should support keyboard-only navigation for core controls', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Keyboard-only focus flow is desktop-specific');
    await waitForAppReady(page);

    const fourByFour = page.locator('#grid-option-4');
    const sixBySix = page.locator('#grid-option-6');
    const nineByNine = page.locator('#grid-option-9');

    await fourByFour.focus();
    await expect(fourByFour).toBeFocused();

    await sixBySix.focus();
    await expect(sixBySix).toBeFocused();
    await page.keyboard.press('Space');
    await expect(sixBySix).toBeChecked();
    await expect(nineByNine).not.toBeChecked();
  });

  test('should expose screen-reader essentials for interactive regions', async ({
    page,
  }) => {
    await waitForAppReady(page);

    await expect(page.locator('#main-content')).toBeVisible();
    const liveRegionCount = await page.locator('[aria-live="polite"]').count();
    expect(liveRegionCount).toBeGreaterThan(0);
    await expect(
      page.locator('#difficulty-select:visible').first()
    ).toHaveAttribute('aria-label', /difficulty/i);
    await expect(
      page.getByRole('radiogroup', { name: 'Grid size selection' })
    ).toBeVisible();
  });

  test('should render visible focus indicators for keyboard users', async ({
    page,
  }) => {
    await waitForAppReady(page);

    const skipLink = page.locator('.skip-to-content');
    await skipLink.evaluate((el: HTMLElement) => el.focus());
    const hasFocus = await skipLink.evaluate(
      el => document.activeElement === el
    );
    expect(hasFocus).toBe(true);

    const focusStyle = await skipLink.evaluate(el => {
      const style = getComputedStyle(el);
      return {
        top: style.top,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        boxShadow: style.boxShadow,
      };
    });

    const hasVisibleOutline =
      focusStyle.outlineStyle !== 'none' && focusStyle.outlineWidth !== '0px';
    const hasVisibleShadow = focusStyle.boxShadow !== 'none';
    const isMovedIntoViewport = focusStyle.top !== '-100%';

    expect(hasVisibleOutline || hasVisibleShadow || isMovedIntoViewport).toBe(
      true
    );
  });

  test('should respect reduced-motion preference', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await waitForAppReady(page);

    const reducedMotionStyles = await page.evaluate(() => {
      const candidate =
        document.querySelector('label[for="grid-option-4"]') ??
        document.querySelector('.grid-option') ??
        document.querySelector('#difficulty-select');
      if (!candidate) return null;
      const style = getComputedStyle(candidate);
      return {
        mediaMatches: globalThis.matchMedia('(prefers-reduced-motion: reduce)')
          .matches,
        animationDuration: style.animationDuration,
        animationIterationCount: style.animationIterationCount,
      };
    });

    expect(reducedMotionStyles).not.toBeNull();
    expect(reducedMotionStyles?.mediaMatches).toBe(true);

    const durationValue = reducedMotionStyles?.animationDuration ?? '0s';
    const seconds = durationValue.endsWith('ms')
      ? Number.parseFloat(durationValue) / 1000
      : Number.parseFloat(durationValue);
    expect(Number.isFinite(seconds)).toBe(true);
    expect(seconds).toBeLessThanOrEqual(0.001);
  });
});
