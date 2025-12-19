import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Explicitly set project root to avoid Turbopack choosing the parent
    // directory when multiple lockfiles exist on Windows.
    root: __dirname,
  },
};

export default nextConfig;
