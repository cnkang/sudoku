import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Global timeout for CI
  globalTimeout: process.env.CI ? 600000 : 300000, // 10 minutes in CI, 5 minutes locally

  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    process.env.CI ? ['github'] : ['list'],
  ],

  outputDir: 'test-results/',

  use: {
    // Base URL
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Tracing configuration - only keep on failure
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Timeout settings - more generous for CI
    actionTimeout: process.env.CI ? 15000 : 10000,
    navigationTimeout: process.env.CI ? 45000 : 30000,

    // CI environment optimizations
    ...(process.env.CI && {
      // Disable animations for better stability in CI
      reducedMotion: 'reduce',
      // Force color scheme
      colorScheme: 'light',
      // Increase timeouts for slower CI environments
      timeout: 60000,
    }),
  },

  // Project configuration - choose browsers based on environment
  projects: process.env.CI
    ? [
        {
          name: 'smoke-tests',
          testMatch: '**/smoke.spec.ts',
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'api-tests',
          testMatch: '**/api.spec.ts',
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'chromium',
          testIgnore: ['**/smoke.spec.ts', '**/api.spec.ts'],
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
