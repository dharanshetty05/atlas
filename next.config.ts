import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverActions: {
    bodySizeLimit: '50mb',
  },
};

export default nextConfig;
