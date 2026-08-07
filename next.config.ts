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

function apiProxyDestination(): string {
  const raw = (
    process.env.API_PROXY_TARGET ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://127.0.0.1:8000'
  )
    .trim()
    .replace(/\/+$/, '');
  try {
    if (raw.startsWith('http://')) {
      const host = new URL(raw).hostname.toLowerCase();
      if (host !== 'localhost' && host !== '127.0.0.1' && host !== '::1') {
        return `https://${raw.slice('http://'.length)}`;
      }
    }
  } catch {
    /* keep raw */
  }
  return raw || 'http://127.0.0.1:8000';
}

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
    // Large personal-message recordings proxy through /oa-api rewrites.
    proxyClientMaxBodySize: '5gb',
    middlewareClientMaxBodySize: '5gb',
  },
  serverActions: {
    bodySizeLimit: '5gb',
  },
  async rewrites() {
    const dest = apiProxyDestination();
    return [
      // Same-origin proxy so HTTPS portal never hits http://api (Mixed Content).
      // Browser → /oa-api/admin/users/ → Next rewrite → https://api…/admin/users/
      {
        source: '/oa-api/:path*',
        destination: `${dest}/:path*`,
      },
    ];
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
