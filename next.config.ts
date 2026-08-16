import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  images: {
    // Serve images as-is. Seed images live in the Supabase storage bucket or
    // local /uploads files; cPanel shared hosting has no sharp, so on-demand
    // optimization is disabled and remote assets are allowed directly.
    unoptimized: true,
  },
};

export default nextConfig;
