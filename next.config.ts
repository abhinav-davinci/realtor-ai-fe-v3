import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server-rendered (Node) — was `output: "export"` (static). Pages can now
  // render on the server per request (SSR) and use middleware, cookies, and
  // server-side fetches.
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // Presigned S3 URLs for listing/video media from the backend.
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
  },
};

export default nextConfig;
