// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['styled-jsx/babel', { optimizeForSpeed: true }]],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'happy-dom',
    testTimeout: 15000,
    hookTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/.next/**',
        '**/dist/**',
        '**/*.test.*',
        '**/__tests__/**',
        'src/app/layout.tsx', // Next.js boilerplate
        'src/app/globals.css', // CSS files
        'src/app/page.module.css',
        'src/app/page.styles.ts', // CSS styles
        'src/components/GameControls.styles.ts', // Component styles
        'src/components/SudokuGrid.styles.ts', // Component styles
        'src/types/index.ts', // Type definitions
        'src/app/api/solveSudoku/types.ts', // API type definitions
        'src/custom.d.ts', // Type declarations
        'src/test-setup.ts', // Test setup
        'src/test-utils/**', // Test utilities
        'src/hooks/usePuzzleLoader.ts', // Unused hook
        'src/hooks/useOptimisticSudoku.ts', // Unused hook
        'src/app/responsive.css', // Responsive CSS
        'src/test-utils/**', // Test utilities
        'next.config.mjs',
        'eslint.config.mjs',
      ],
      include: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.test.{ts,tsx}',
        '!src/**/__tests__/**',
      ],
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
    },
    setupFiles: ['./src/test-setup.ts'],
  },
});
