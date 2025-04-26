import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Desativa a verificação de tipos durante o build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
