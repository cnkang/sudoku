/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: true,
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
            value: 'public, max-age=30, s-maxage=30, stale-while-revalidate=10',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
