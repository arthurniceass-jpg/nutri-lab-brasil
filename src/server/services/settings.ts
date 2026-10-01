import "server-only";
import { prisma } from "@/server/db/prisma";

// Retorna a linha única de configurações (cria com os padrões se não existir).
export async function getSettings() {
  return prisma.storeSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
}

// Token efetivo do Mercado Pago: painel tem prioridade, depois o .env.
export function resolveMpToken(settings: { mpAccessToken: string | null }) {
  return settings.mpAccessToken?.trim() || process.env.MP_ACCESS_TOKEN || null;
}
