import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Contact avatar photos are uploaded to Vercel Blob (see
    // app/actions/contact-avatar.ts) and rendered via next/image.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
