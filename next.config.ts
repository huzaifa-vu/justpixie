import type { NextConfig } from "next";

const isElectronBuild = process.env.BUILD_TARGET === 'electron';

const nextConfig: NextConfig = {
  ...(isElectronBuild && { output: 'standalone' }),
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/dashboard/pdf/lock",
        destination: "/dashboard/pdf/privacy",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
