import { prisma } from "@/server/db/prisma";
import { getSession } from "@/server/auth/owner";
import { NextResponse } from "next/server";

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      reference: true,
      createdAt: true,
      status: true,
      customerName: true,
      customerEmail: true,
      subtotalCents: true,
      discountCents: true,
      couponCode: true,
      shippingCents: true,
      totalCents: true,
      costCents: true,
      channel: true,
      paymentMethod: true,
    },
  });

  const brl = (c: number) => (c / 100).toFixed(2).replace(".", ",");
  const header = [
    "Pedido",
    "Data",
    "Canal",
    "Pagamento",
    "Status",
    "Cliente",
    "Email",
    "Subtotal",
    "Desconto",
    "Cupom",
    "Frete",
    "Total",
    "Custo",
    "Lucro",
  ];

  const rows = orders.map((o) =>
    [
      o.reference,
      new Intl.DateTimeFormat("pt-BR").format(o.createdAt),
      o.channel === "MANUAL" ? "Manual" : "Site",
      o.paymentMethod ?? "",
      o.status,
      o.customerName,
      o.customerEmail,
      brl(o.subtotalCents),
      brl(o.discountCents),
      o.couponCode ?? "",
      brl(o.shippingCents),
      brl(o.totalCents),
      brl(o.costCents),
      brl(o.subtotalCents - o.discountCents - o.costCents),
    ]
      .map(csvCell)
      .join(";"),
  );

  // BOM para o Excel reconhecer acentos/UTF-8
  const csv = "﻿" + [header.join(";"), ...rows].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pedidos-nutrilab.csv"`,
    },
  });
}
