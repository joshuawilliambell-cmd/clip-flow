import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remotion packages ship modern ESM that Next should transpile.
  transpilePackages: [
    "remotion",
    "@remotion/player",
    "@remotion/media-utils",
    "@remotion/web-renderer",
  ],
  // Allow cloud / forwarded-port preview hosts to load Next assets in dev.
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "*.cursor.sh",
    "*.cursorapi.com",
  ],
  // Prototype keeps media in the browser; increase body size for future upload APIs.
  experimental: {
    serverActions: {
      // Uploads stay in the browser; keep headroom if any server path is used.
      bodySizeLimit: "4gb",
    },
  },
};

export default nextConfig;
