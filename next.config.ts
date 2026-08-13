import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve images as-is. The seed data references remote Google-hosted
    // URLs and local /uploads files; cPanel shared hosting has no sharp,
    // so on-demand optimization is disabled and both are allowed directly.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
    ],
  },
};

export default nextConfig;
