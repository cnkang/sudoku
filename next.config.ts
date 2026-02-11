import type { NextConfig } from 'next';
import withPWA from '@ducanh2912/next-pwa';

const reactCompilerOptions: Record<string, unknown> = {
  compilationMode: 'annotation',
  enableTreatRefLikeIdentifierInHoist: true,
  enableTreatFunctionDepsAsConditional: true,
  enablePreserveExistingMemoizationGuarantees: true,
  enableReactiveScopesInHIR: true,
  target: '19',
};

const experimentalOptions: Record<string, unknown> = {
  optimizePackageImports: ['lodash', 'fast-check'],
  optimizeCss: true,
  optimizeServerReact: true,
};

const nextConfig: NextConfig = {
  // Turbopack configuration (stable in Next.js 16)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  // Enhanced React Compiler configuration for React 19
  reactCompiler: reactCompilerOptions as NonNullable<
    NextConfig['reactCompiler']
  >,
  experimental: experimentalOptions as NonNullable<NextConfig['experimental']>,
  // Server external packages (moved from experimental)
  serverExternalPackages: ['winston'],
  // Transpile packages for better compatibility
  transpilePackages: ['lodash-es', 'fast-sudoku-solver'],
  compiler: {
    // Enable React 19 compiler optimizations
    reactRemoveProperties: process.env.NODE_ENV === 'production',
    // Remove development-only code in production
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  // Code splitting optimizations
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle splitting for better caching
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          // Separate vendor chunks for better caching
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          // Separate React chunks
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 20,
          },
          // Separate utility chunks
          utils: {
            test: /[\\/]src[\\/]utils[\\/]/,
            name: 'utils',
            chunks: 'all',
            priority: 5,
          },
        },
      };
    }
    return config;
  },
  // PWA configuration
  async rewrites() {
    return [
      {
        source: '/sw.js',
        destination: '/sw.js',
      },
      {
        source: '/manifest.json',
        destination: '/manifest.json',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/solveSudoku',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value:
              'accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()',
          },
          // Performance headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
    ];
  },
  // Custom cache handler for performance monitoring
  ...(process.env.NODE_ENV === 'production'
    ? { cacheHandler: require.resolve('./cache-handler.ts') }
    : {}),
};

export default withPWA({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  },
})(nextConfig);
