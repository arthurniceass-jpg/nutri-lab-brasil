import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getSession } from "@/server/auth/owner";
import { getSettings } from "@/server/services/settings";
import { sendEmail, buildShippedEmail } from "@/server/services/email";
import type { OrderStatus } from "@prisma/client";

const STATUSES: OrderStatus[] = [
  "PENDENTE",
  "PAGO",
  "ENVIADO",
  "ENTREGUE",
  "CANCELADO",
];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { reference } = await params;
  const b = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  if (b.status !== undefined) {
    if (!STATUSES.includes(b.status)) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }
    data.status = b.status;
  }
  if (b.trackingCode !== undefined)
    data.trackingCode = String(b.trackingCode).trim() || null;
  if (b.shippingNote !== undefined)
    data.shippingNote = String(b.shippingNote).trim() || null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  // Status anterior, para detectar a transição para ENVIADO
  const previous = await prisma.order.findUnique({
    where: { reference },
    select: { status: true },
  });

  const order = await prisma.order.update({
    where: { reference },
    data,
  });

  // Email automático ao virar "Enviado" (não bloqueia a resposta se falhar)
  if (order.status === "ENVIADO" && previous?.status !== "ENVIADO") {
    try {
      const settings = await getSettings();
      await sendEmail({
        to: order.customerEmail,
        subject: `Seu pedido ${order.reference} foi enviado`,
        html: buildShippedEmail({
          storeName: settings.storeName,
          customerName: order.customerName,
          reference: order.reference,
          trackingCode: order.trackingCode,
          shippingNote: order.shippingNote,
        }),
      });
    } catch (err) {
      console.error("Falha ao enviar email de envio:", err);
    }
  }

  return NextResponse.json({ ok: true, status: order.status });
}
