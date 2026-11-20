import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Admin forms upload cover images (5 MB) and book PDFs (25 MB).
  experimental: { serverActions: { bodySizeLimit: "30mb" } },
};

export default nextConfig;
