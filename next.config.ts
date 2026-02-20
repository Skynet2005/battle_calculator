import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Explicitly set project root to avoid Turbopack choosing the parent
    // directory when multiple lockfiles exist on Windows.
    root: __dirname,
  },
  /**
   * Ensure Drizzle migration files are bundled with serverless outputs on Vercel.
   * Without this, runtime migration checks will fail with "Can't find meta/_journal.json".
   */
  outputFileTracingIncludes: {
    "/api/**": ["./drizzle/**/*"],
    "/leaderboard": ["./drizzle/**/*"],
    "/leaderboard/**": ["./drizzle/**/*"],
    "/leaderboard.rsc": ["./drizzle/**/*"],
  },
  /**
   * Security headers for all routes
   */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://cg-vip-mall-wos.centurygame.com; font-src 'self'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
