import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/server/db/prisma";
import { getSettings, resolveMpToken } from "@/server/services/settings";
import { sendEmail, buildOrderConfirmedEmail } from "@/server/services/email";
import type { OrderStatus } from "@prisma/client";

// Mapeia status do Mercado Pago para o nosso enum
function mapStatus(mpStatus: string): OrderStatus {
  switch (mpStatus) {
    case "approved":
      return "PAGO";
    case "cancelled":
    case "rejected":
    case "refunded":
    case "charged_back":
      return "CANCELADO";
    default:
      return "PENDENTE";
  }
}

// Valida a assinatura x-signature do Mercado Pago (se o secret estiver setado)
function verifySignature(req: Request, dataId: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // sem secret configurado: pula validação

  const signature = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id");
  if (!signature) return false;

  const parts = Object.fromEntries(
    signature.split(",").map((p) => p.split("=").map((s) => s.trim())),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const computed = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(v1),
    );
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const body = await req.json().catch(() => ({}));

  const type = body.type ?? url.searchParams.get("type");
  const paymentId =
    body?.data?.id ?? url.searchParams.get("data.id") ?? "";

  if (type !== "payment" || !paymentId) {
    return NextResponse.json({ ignored: true });
  }

  if (!verifySignature(req, String(paymentId))) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }

  const settings = await getSettings();
  const mpToken = resolveMpToken(settings);
  if (!mpToken) {
    return NextResponse.json({ error: "MP não configurado" }, { status: 500 });
  }

  // Consulta o pagamento na API do Mercado Pago
  const { MercadoPagoConfig, Payment } = await import("mercadopago");
  const client = new MercadoPagoConfig({
    accessToken: mpToken,
  });
  const payment = await new Payment(client).get({ id: String(paymentId) });

  const reference = payment.external_reference;
  if (!reference) return NextResponse.json({ ignored: true });

  const order = await prisma.order.findUnique({
    where: { reference },
    include: { items: true },
  });
  if (!order) return NextResponse.json({ ignored: true });

  const newStatus = mapStatus(payment.status ?? "");
  const payerName = payment.payer?.first_name
    ? `${payment.payer.first_name} ${payment.payer.last_name ?? ""}`.trim()
    : order.customerName;
  const payerEmail = payment.payer?.email ?? order.customerEmail;

  // Idempotencia: a transição para PAGO é ATÔMICA. O updateMany só afeta a
  // linha se o pedido ainda NÃO estava PAGO — assim, notificações duplicadas
  // do Mercado Pago não baixam o estoque (nem contam o cupom) mais de uma vez.
  let didPay = false;
  await prisma.$transaction(async (tx) => {
    if (newStatus === "PAGO") {
      const res = await tx.order.updateMany({
        where: { id: order.id, status: { not: "PAGO" } },
        data: {
          status: "PAGO",
          mpPaymentId: String(paymentId),
          customerName: payerName,
          customerEmail: payerEmail,
        },
      });
      // res.count === 1 => esta chamada ganhou a corrida e efetivou o pagamento
      if (res.count === 1) {
        didPay = true;
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
        if (order.couponCode) {
          await tx.coupon.updateMany({
            where: { code: order.couponCode },
            data: { timesRedeemed: { increment: 1 } },
          });
        }
      }
    } else {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: newStatus,
          mpPaymentId: String(paymentId),
          customerName: payerName,
          customerEmail: payerEmail,
        },
      });
    }
  });

  // Email de confirmação (fora da transação) — só quando ESTA chamada pagou
  if (didPay) {
    try {
      await sendEmail({
        to: payerEmail,
        subject: `Pagamento confirmado - pedido ${order.reference}`,
        html: buildOrderConfirmedEmail({
          storeName: settings.storeName,
          customerName: payerName,
          reference: order.reference,
          totalCents: order.totalCents,
        }),
      });
    } catch (err) {
      console.error("Falha ao enviar email de confirmação:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
