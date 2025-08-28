// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: [
        'node_modules/**',
        'coverage/**',
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
      ],
      include: ['src/**/*.{ts,tsx}'],
      all: true,
      skipFull: false,
    },
    setupFiles: ['./src/test-setup.ts'],
  },
});
