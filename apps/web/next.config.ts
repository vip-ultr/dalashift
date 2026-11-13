import type { NextConfig } from 'next';

/**
 * DalaShift: Next.js configuration.
 *
 * Phase 1 note: the application is intentionally minimal. No product routes are
 * implemented yet. This configuration exists so the workspace installs, type
 * checks and builds cleanly from the first commit.
 *
 * @type {NextConfig}
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      // Supabase Storage project assets (e.g. farm photographs and documents).
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
  },
  // Security headers. Keep the CSP in apps/web/src/middleware.ts or
  // next.config.ts headers() once routes exist. Do not relax without review.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
