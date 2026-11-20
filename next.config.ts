import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Admin forms upload cover images (5 MB) and book PDFs (50 MB).
  experimental: { serverActions: { bodySizeLimit: "60mb" } },
};

export default nextConfig;
