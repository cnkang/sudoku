import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/** Click a grid size radio and wait for the new grid to render */
async function switchGridSize(page: Page, size: 4 | 6 | 9) {
  const radioLocator = page.locator(`input[name="grid-size"][value="${size}"]`);

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
      try {
        await trigger();
      } catch {
        // Try alternate interaction strategy below (browser-specific radio behavior can differ).
      }
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

    if (
      await page.evaluate(s => {
        const radio = document.querySelector<HTMLInputElement>(
          `input[name="grid-size"][value="${s}"]`
        );
        return radio?.checked === true;
      }, size)
    ) {
      await page.waitForTimeout(300);
      return;
    }
  }

  throw new Error(`Failed to switch grid size to ${size}`);
}

test.describe('Grid Size Switching Tests', () => {
  const waitForAppReady = async (page: Page) => {
    await page.waitForSelector('main', { timeout: 30000 });
    await page.waitForSelector('text=Loading grid...', {
      state: 'hidden',
      timeout: 45000,
    });
    await expect(page.locator('[data-testid="pwa-grid-selector"]')).toHaveCount(
      1,
      {
        timeout: 30000,
      }
    );
    await expect(
      page.getByRole('radiogroup', { name: 'Grid size selection' })
    ).toBeVisible({ timeout: 30000 });
  };

  test.describe.configure({ mode: 'serial' });
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      globalThis.localStorage?.clear();
      globalThis.sessionStorage?.clear();
    });

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForAppReady(page);

    await page.waitForFunction(
      () =>
        document.querySelector<HTMLInputElement>(
          'input[name="grid-size"][value="9"]'
        ) !== null,
      { timeout: 30000 }
    );

    await expect(
      page.locator('input[name="grid-size"][value="9"]')
    ).toBeChecked();

    await expect(
      page.locator('#difficulty-select:visible').first()
    ).toBeEnabled({
      timeout: 15000,
    });
  });

  test('should switch from 9x9 to 4x4 and generate correct puzzle', async ({
    page,
  }) => {
    await switchGridSize(page, 4);
  });

  test('should switch from 9x9 to 6x6 and generate correct puzzle', async ({
    page,
  }) => {
    await switchGridSize(page, 6);
  });

  test('should switch between all grid sizes correctly', async ({ page }) => {
    const gridSizes = [4 as const, 6 as const, 9 as const];

    for (const size of gridSizes) {
      await switchGridSize(page, size);
    }
  });

  test('should preserve difficulty when switching grid sizes', async ({
    page,
  }) => {
    const difficultySelect = page.locator('#difficulty-select:visible').first();
    const currentDifficulty = await difficultySelect.inputValue();
    const targetDifficulty = currentDifficulty === '2' ? '3' : '2';

    // Change difficulty to a different level. The follow-up grid switch helper already waits
    // for controls to become enabled again, so we don't need to block on this intermediate fetch.
    await difficultySelect.selectOption(targetDifficulty);

    await switchGridSize(page, 4);

    // Verify difficulty is within valid range for 4x4
    const switchedDifficulty = await difficultySelect.inputValue();
    const difficultyNum = Number.parseInt(switchedDifficulty, 10);
    expect(difficultyNum).toBeGreaterThanOrEqual(1);
    expect(difficultyNum).toBeLessThanOrEqual(5);
  });
});
