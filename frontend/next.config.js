/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    // ⚠️ Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // ⚠️ Dangerously allow production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  env: {
    // These values will be overridden by environment variables at runtime
    NEXT_PUBLIC_BACKEND_URL: 'http://backend:8000/api',
    NEXT_PUBLIC_URL: 'https://suna-dev.m2w.io',
    NEXT_PUBLIC_ENV_MODE: 'PRODUCTION',
  },
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

module.exports = nextConfig;