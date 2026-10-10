import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Netlify's OpenNext adapter to handle image requests correctly
  images: {
    unoptimized: false,
  },
  // Ensure server-side rendering works correctly across Netlify Functions
  output: undefined, // keep default ("server") — do NOT use "export"
};

export default nextConfig;
