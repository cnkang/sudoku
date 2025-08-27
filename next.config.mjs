/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: true,
    reactCompiler: true,
    optimizePackageImports: ['lodash', 'fast-sudoku-solver'],
    staticWorkerRequestDeduping: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
    process.env.NODE_ENV === 'production' ? './cache-handler.mjs' : undefined,
};

export default nextConfig;
