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
  },
};

export default nextConfig;
