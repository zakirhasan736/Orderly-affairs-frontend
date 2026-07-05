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
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: `default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src ${connectSrc}; frame-src https://challenges.cloudflare.com https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self'`,
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  productionBrowserSourceMaps: false,
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
