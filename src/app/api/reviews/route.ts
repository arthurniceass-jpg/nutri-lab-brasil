import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getCustomerSession } from "@/server/auth/customer";

export async function POST(req: Request) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json(
      { error: "Entre na sua conta para avaliar." },
      { status: 401 },
    );
  }

  const { productId, rating, comment } = await req.json().catch(() => ({}));
  const r = Math.round(Number(rating));
  const text = String(comment ?? "").trim();

  if (!productId || !(r >= 1 && r <= 5)) {
    return NextResponse.json(
      { error: "Selecione uma nota de 1 a 5." },
      { status: 400 },
    );
  }
  if (text.length < 3) {
    return NextResponse.json(
      { error: "Escreva um comentário." },
      { status: 400 },
    );
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  }

  // Um review por cliente/produto: se já existe, atualiza em vez de duplicar
  // (evita inflar o contador e distorcer a média com avaliações repetidas)
  const existing = await prisma.review.findFirst({
    where: { productId, customerId: session.id },
  });
  if (existing) {
    await prisma.review.update({
      where: { id: existing.id },
      data: { rating: r, comment: text, customerName: session.name },
    });
  } else {
    await prisma.review.create({
      data: {
        productId,
        customerId: session.id,
        customerName: session.name,
        rating: r,
        comment: text,
      },
    });
  }

  // Recalcula a média e o total de avaliações do produto
  const agg = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: agg._avg.rating ?? 5,
      reviews: agg._count,
    },
  });

  return NextResponse.json({ ok: true });
}
