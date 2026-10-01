import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getSession } from "@/server/auth/owner";
import type { CouponType } from "@prisma/client";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const b = await req.json().catch(() => ({}));
  const code = String(b.code ?? "").trim().toUpperCase();
  const type = String(b.type ?? "") as CouponType;
  const value = Math.round(Number(b.value));
  const minSubtotalCents = Math.max(0, Math.round(Number(b.minSubtotalCents ?? 0)));

  if (!code) {
    return NextResponse.json({ error: "Informe o código." }, { status: 400 });
  }
  if (type !== "PERCENT" && type !== "FIXED") {
    return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
  }
  if (!Number.isFinite(value) || value <= 0) {
    return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
  }
  if (type === "PERCENT" && value > 100) {
    return NextResponse.json(
      { error: "Percentual não pode passar de 100." },
      { status: 400 },
    );
  }

  const exists = await prisma.coupon.findUnique({ where: { code } });
  if (exists) {
    return NextResponse.json(
      { error: "Já existe um cupom com esse código." },
      { status: 409 },
    );
  }

  await prisma.coupon.create({
    data: { code, type, value, minSubtotalCents },
  });

  return NextResponse.json({ ok: true });
}
