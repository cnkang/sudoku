/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack configuration (moved from experimental)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  // React Compiler configuration (moved from experimental in Next.js 16)
  reactCompiler: {
    compilationMode: 'annotation',
  },
  experimental: {
    // Optimize package imports for better tree shaking
    optimizePackageImports: ['lodash', 'fast-sudoku-solver', 'winston'],
    // Optimize CSS handling
    optimizeCss: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  async headers() {
    return [
      {
        source: '/api/solveSudoku',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
          },
        ],
      },
    ];
  },
  cacheHandler:
    process.env.NODE_ENV === 'production' && !process.env.CI
      ? './cache-handler.mjs'
      : undefined,
};

export default nextConfig;
