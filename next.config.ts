import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack for production builds
  turbopack: {
    rules: {}
  },
  // Standard webpack config
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
