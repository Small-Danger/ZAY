import type { NextConfig } from 'next';

function apiOriginHost(): {
  protocol: 'http' | 'https';
  hostname: string;
  port?: string;
} | null {
  const raw = process.env.NEXT_PUBLIC_API_ORIGIN?.replace(/\/$/, '');
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const protocol = u.protocol === 'http:' ? 'http' : 'https';
    const hostname = u.hostname;
    const port = u.port || undefined;
    return { protocol, hostname, ...(port ? { port } : {}) };
  } catch {
    return null;
  }
}

const apiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN?.replace(/\/$/, '') || '';
const remotePatterns: NonNullable<NextConfig['images']>['remotePatterns'] = [
  {
    protocol: 'https',
    hostname: 'res.cloudinary.com',
    pathname: '/**',
  },
];

const originHost = apiOriginHost();
if (originHost) {
  remotePatterns.push(
    {
      ...originHost,
      pathname: '/uploads/**',
    },
    {
      ...originHost,
      pathname: '/api/media/**',
    },
  );
}

if (process.env.NODE_ENV !== 'production') {
  for (const hostname of ['localhost', '127.0.0.1'] as const) {
    remotePatterns.push(
      {
        protocol: 'http',
        hostname,
        port: '4000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname,
        port: '4000',
        pathname: '/api/media/**',
      },
    );
  }
}

const csp = [
  "default-src 'self'",
  `img-src 'self' data: blob: https://res.cloudinary.com ${apiOrigin || ''} https:`.trim(),
  "script-src 'self' 'unsafe-inline' https://www.instagram.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin || ''}`.trim(),
  'frame-src https://www.instagram.com',
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com",
].join('; ');

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  watchOptions: {
    pollIntervalMs: 1000,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Content-Security-Policy-Report-Only',
            value: csp,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
