import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remotion packages ship modern ESM that Next should transpile.
  transpilePackages: [
    "remotion",
    "@remotion/player",
    "@remotion/media-utils",
    "@remotion/web-renderer",
  ],
  // Prototype keeps media in the browser; increase body size for future upload APIs.
  experimental: {
    serverActions: {
      bodySizeLimit: "512mb",
    },
  },
};

export default nextConfig;
