// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins:
          // Disable React Compiler in test environment to avoid JSX warnings
          process.env.NODE_ENV === 'test'
            ? []
            : ['babel-plugin-react-compiler'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    testTimeout: 15000,
    hookTimeout: 15000,
    // Vitest 4.0+ thread configuration (moved from poolOptions)
    pool: 'threads',
    // Include all test files in src directory
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
      exclude: [
        'node_modules/**',
        'coverage/**',
        '**/__tests__/**',
        'tests/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/*.d.ts',
        'src/test-setup.ts',
        'src/test-utils/**',
        '.next/**',
        'next.config.js',
        'vite.config.ts',
        'tailwind.config.js',
        'postcss.config.js',
        // Exclude Next.js layout files (mainly configuration)
        'src/app/layout.tsx',
        // Exclude other configuration-only files
        'src/app/**/layout.tsx',
        // Exclude Biome and other config files
        'biome.json',
        'eslint.config.mjs',
        '.prettierrc',
      ],
      include: [
        'src/app/api/solveSudoku/{cache,dlxSolver,route,sudokuGenerator}.ts',
        'src/components/{DifficultySelector,GameControls,Timer,TouchOptimizedControls}.tsx',
        'src/hooks/{useOptimisticSudoku,usePuzzleLoader}.ts',
        'src/utils/{apiCache,error-handling,gridConfig,hints,stats,themes,validation}.ts',
      ],
      skipFull: false,
    },
    setupFiles: ['./src/test-setup.ts'],
    // Modern Vitest 4.0+ features
    typecheck: {
      enabled: false, // We use tsc for type checking
    },
    ui: process.env.VITEST_UI === 'true',
    open: false,
  },
});
