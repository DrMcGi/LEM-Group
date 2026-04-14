import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    localPatterns: [
      { pathname: "/images/**" },
      { pathname: "/api/blob" },
    ],
  },
};

export default nextConfig;
