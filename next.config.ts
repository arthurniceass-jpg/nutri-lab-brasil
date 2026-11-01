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
  // Interruptor do back-end em Python: com PYTHON_API_URL definida (no build da Vercel), estas rotas
  // passam a ser atendidas pelo FastAPI, com os mesmos caminhos e respostas. Sem a variável, tudo
  // continua nas rotas atuais do Next.js. Para voltar atrás, basta remover a variável e publicar.
  async rewrites() {
    const api = process.env.PYTHON_API_URL?.replace(/\/+$/, "");
    if (!api) return [];
    const paths = [
      "/api/auth",
      "/api/sessao",
      "/api/conta/login",
      "/api/conta/registrar",
      "/api/conta/logout",
      "/api/webhooks/mercadopago",
      "/api/shaker/:path*",
    ];
    return { beforeFiles: paths.map((source) => ({ source, destination: `${api}${source}` })) };
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
