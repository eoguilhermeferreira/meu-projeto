import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/meu-projeto",
  assetPrefix: "/meu-projeto",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
