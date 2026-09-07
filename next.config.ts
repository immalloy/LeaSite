import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  outputFileTracingRoot: __dirname,
  turbopack: { root: __dirname },
  experimental: { devtoolSegmentExplorer: false },
  images: { unoptimized: true },
};

export default nextConfig;
