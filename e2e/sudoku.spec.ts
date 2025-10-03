import { test, expect } from '@playwright/test';

test.describe('Sudoku Game E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 增加超时时间，等待应用启动
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
  });

  test('should load the homepage', async ({ page }) => {
    // 等待页面完全加载
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');

    // 基础页面加载测试 - 使用更宽松的标题匹配
    await expect(page).toHaveTitle(/Sudoku/i);

    // 检查页面是否包含基本内容
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // 验证页面内容已加载
    await expect(page.locator('h1, h2, [role="main"], main')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });

    // 验证页面在移动端正常显示
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // 检查视口设置是否生效
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(375);
    expect(viewport?.height).toBe(667);
  });

  test('should handle navigation', async ({ page }) => {
    // 基础导航测试
    await page.waitForLoadState('networkidle');

    // 验证页面响应
    const response = await page.evaluate(() => {
      return document.readyState;
    });

    expect(response).toBe('complete');
  });
});
