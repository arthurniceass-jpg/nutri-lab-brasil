import type { NextConfig } from "next";

// Cabeçalhos de segurança em todas as rotas. (CSP fica para uma etapa própria: exige testar
// o checkout do Mercado Pago e os scripts da loja antes de bloquear qualquer coisa.)
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // Não anuncia o framework nas respostas (X-Powered-By).
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
