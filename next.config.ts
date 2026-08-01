import type { NextConfig } from 'next';

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';
let apiOrigin = '';
try {
  if (apiBase) apiOrigin = new URL(apiBase).origin;
} catch {
  apiOrigin = '';
}

const connectSrc = [
  "'self'",
  apiOrigin,
  'https://challenges.cloudflare.com',
  'https://api.stripe.com',
  'https://res.cloudinary.com',
  'https://api.cloudinary.com',
]
  .filter(Boolean)
  .join(' ');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Cache-Control', value: 'no-store, private' },
  { key: 'Pragma', value: 'no-cache' },
  {
    key: 'Permissions-Policy',
    // Allow this origin to use camera/mic for video & audio messages.
    // camera=() / microphone=() blocks getUserMedia even when the user clicks Allow.
    value: 'camera=(self), microphone=(self), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: `default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; media-src 'self' blob: data: https:; font-src 'self' data:; connect-src ${connectSrc}; frame-src 'self' blob: data: https://challenges.cloudflare.com https://js.stripe.com; object-src 'self' blob:; worker-src 'self' blob:; base-uri 'self'; form-action 'self'`,
  },
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
