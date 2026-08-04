import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Cache-Control', value: 'no-store, private' },
  { key: 'Pragma', value: 'no-cache' },
  {
    key: 'Permissions-Policy',
    // Allow this origin to use camera/mic for video & audio messages.
    value: 'camera=(self), microphone=(self), geolocation=()',
  },
  // Content-Security-Policy is set in middleware.ts with a per-request nonce.
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  productionBrowserSourceMaps: false,
  // Isolated build/cache for Cypress/Playwright E2E so they can run alongside `npm run dev`.
  ...(process.env.CYPRESS_DIST_DIR || process.env.PLAYWRIGHT_DIST_DIR
    ? {
        distDir:
          process.env.PLAYWRIGHT_DIST_DIR || process.env.CYPRESS_DIST_DIR,
      }
    : {}),
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
