import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Image upload sends the whole batch (≤ 5 images, < 5.9 MB total — see
      // app/actions/upload-image.ts) in ONE request, so 6 MB is the right size.
      // Don't raise this past ~6 MB to allow bigger batches: Server Actions run
      // as AWS Lambda functions on Netlify, which cap synchronous request bodies
      // at 6 MB regardless of plan. The uploader's 5.9 MB cap exists to stay
      // under this ceiling (with headroom for multipart overhead).
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
