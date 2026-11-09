import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export const dynamic = "force-dynamic";

// Verificação de saúde + "batimento" diário no banco (veja vercel.json > crons).
// O Supabase gratuito pausa o projeto depois de ~7 dias sem atividade; esta consulta
// diária mantém o banco acordado e, de quebra, mostra se ele está respondendo.
// Não expõe dados: só diz se o banco respondeu.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, db: "indisponivel" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
