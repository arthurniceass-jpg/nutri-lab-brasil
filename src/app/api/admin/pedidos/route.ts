import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getSession } from "@/server/auth/owner";
import type { OrderStatus } from "@prisma/client";

const STATUSES: OrderStatus[] = ["PENDENTE", "PAGO", "ENVIADO", "ENTREGUE", "CANCELADO"];

// Cria um pedido manual (venda no boca a boca / balcao) pelo painel.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const b = await req.json().catch(() => ({}));
  const rawItems: { id: string; quantity: number }[] = Array.isArray(b.items) ? b.items : [];
  if (rawItems.length === 0) {
    return NextResponse.json({ error: "Adicione ao menos um produto." }, { status: 400 });
  }

  const status: OrderStatus = STATUSES.includes(b.status) ? b.status : "PAGO";

  // Precos e custos autoritativos do banco
  const ids = rawItems.map((i) => i.id);
  const products = await prisma.product.findMany({ where: { id: { in: ids } } });

  const lineItems = rawItems
    .map((item) => {
      const product = products.find((p) => p.id === item.id);
      if (!product) return null;
      const quantity = Math.max(1, Math.min(Math.round(item.quantity), product.stock));
      return { product, quantity };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (lineItems.length === 0) {
    return NextResponse.json({ error: "Produtos indisponíveis." }, { status: 400 });
  }

  const subtotalCents = lineItems.reduce((s, li) => s + li.product.priceCents * li.quantity, 0);
  const costCents = lineItems.reduce((s, li) => s + li.product.costCents * li.quantity, 0);
  const discountCents = Math.max(0, Math.min(Math.round(Number(b.discountCents ?? 0)), subtotalCents));
  const shippingCents = Math.max(0, Math.round(Number(b.shippingCents ?? 0)));
  const totalCents = subtotalCents - discountCents + shippingCents;

  const reference = `NL-${Date.now().toString(36).toUpperCase()}`;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        reference,
        status,
        channel: "MANUAL",
        paymentMethod: b.paymentMethod ? String(b.paymentMethod).trim() : null,
        notes: b.notes ? String(b.notes).trim() : null,
        customerName: String(b.customerName ?? "").trim() || "Venda balcão",
        customerEmail: String(b.customerEmail ?? "").trim() || "-",
        subtotalCents,
        discountCents,
        shippingCents,
        totalCents,
        costCents,
        items: {
          create: lineItems.map((li) => ({
            productId: li.product.id,
            name: li.product.name,
            quantity: li.quantity,
            priceCents: li.product.priceCents,
            costCents: li.product.costCents,
          })),
        },
      },
    });

    // Venda paga baixa o estoque na hora
    if (status === "PAGO" || status === "ENVIADO" || status === "ENTREGUE") {
      for (const li of lineItems) {
        await tx.product.update({
          where: { id: li.product.id },
          data: { stock: { decrement: li.quantity } },
        });
      }
    }
    return created;
  });

  return NextResponse.json({ ok: true, reference: order.reference });
}
