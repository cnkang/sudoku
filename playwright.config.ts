import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    process.env.CI ? ['github'] : ['list'],
  ],

  outputDir: 'test-results/',

  use: {
    // 基础URL
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // 追踪配置 - 仅在失败时保留
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // 超时设置
    actionTimeout: 10000,
    navigationTimeout: 30000,

    // CI环境优化
    ...(process.env.CI && {
      // 在CI中禁用动画以提高稳定性
      reducedMotion: 'reduce',
      // 强制颜色模式
      colorScheme: 'light',
    }),
  },

  // 项目配置 - 根据环境选择浏览器
  projects: process.env.CI
    ? [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
      ]
    : [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },
        {
          name: 'mobile',
          use: { ...devices['Pixel 5'] },
        },
      ],

  // 开发服务器配置
  webServer: process.env.CI
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
});
