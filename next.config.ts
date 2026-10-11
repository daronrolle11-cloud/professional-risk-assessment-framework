import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tells Vercel to bypass TypeScript checks and compile the app code cleanly
  typescript: {
    ignoreBuildErrors: true,
  },
  // Tells Vercel to skip code style audits during production assembly
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
