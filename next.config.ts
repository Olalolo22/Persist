import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    maximumDiskCacheSize: 0,
  },
  async rewrites() {
    return [
      {
        source: "/api/walrus/:blobId",
        destination: "https://aggregator.walrus-testnet.walrus.space/v1/blobs/:blobId",
      },
    ];
  },
};

export default nextConfig;
