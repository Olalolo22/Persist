import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    maximumDiskCacheSize: 0,
  },
  // For Walrus Sites static deployment (phase4), we can use `next build && next export` (or output: 'export' in newer Next).
  // The /api/walrus proxy is dev-only convenience; in static prod the code falls back or we use direct aggregator URLs.
  async rewrites() {
    return [
      {
        source: "/api/walrus/:blobId",
        destination: "https://aggregator.walrus-testnet.walrus.space/v1/blobs/:blobId",
      },
    ];
  },
  // Recommended for Walrus Sites:
  // output: 'export',
  // trailingSlash: true,
};

export default nextConfig;
