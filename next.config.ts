import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**" },
    ],
  },
  // O type-check (tsc) continua rodando no build; apenas o gate de lint e
  // desativado para nao travar o deploy por regras de estilo.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
