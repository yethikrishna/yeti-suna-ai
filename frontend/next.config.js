/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'http://supabasekong-akowwgwwwwcwossg4cgwk0ok.m2w.io:8000',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
    NEXT_PUBLIC_BACKEND_URL: 'http://backend:8000/api',
    NEXT_PUBLIC_URL: 'http://localhost:3000',
    NEXT_PUBLIC_ENV_MODE: 'LOCAL',
  },
  experimental: {
    // Skip static generation for pages that require Supabase
    skipTrailingSlashRedirect: true,
    skipMiddlewareUrlNormalize: true,
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

module.exports = nextConfig;