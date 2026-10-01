import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/store/logo";
import { ClearCart } from "@/components/store/clear-cart";
import { prisma } from "@/server/db/prisma";
import { getSettings } from "@/server/services/settings";
import { sendEmail, buildOrderConfirmedEmail } from "@/server/services/email";

export const dynamic = "force-dynamic";

export default async function SucessoPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; sim?: string }>;
}) {
  const { ref, sim } = await searchParams;

  // Fluxo de simulação (dev, sem Mercado Pago): confirma o pedido.
  if (ref && sim === "1") {
    const order = await prisma.order.findUnique({
      where: { reference: ref },
      include: { items: true },
    });
    if (order && order.status !== "PAGO") {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { status: "PAGO" },
        });
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
        // Contabiliza o uso do cupom
        if (order.couponCode) {
          await tx.coupon.updateMany({
            where: { code: order.couponCode },
            data: { timesRedeemed: { increment: 1 } },
          });
        }
      });

      // Email de confirmação de compra
      try {
        const settings = await getSettings();
        await sendEmail({
          to: order.customerEmail,
          subject: `Pagamento confirmado - pedido ${order.reference}`,
          html: buildOrderConfirmedEmail({
            storeName: settings.storeName,
            customerName: order.customerName,
            reference: order.reference,
            totalCents: order.totalCents,
          }),
        });
      } catch (err) {
        console.error("Falha ao enviar email de confirmação:", err);
      }
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <ClearCart />
      <Logo className="mb-10" />
      <CheckCircle2 className="size-20 text-lime" />
      <h1 className="display mt-6 text-4xl text-foreground md:text-5xl">
        Pedido <span className="text-lime">confirmado</span>
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Recebemos o seu pagamento e já estamos preparando o envio. Você vai
        receber as atualizações por email.
      </p>
      {ref && (
        <p className="mt-4 font-mono text-sm text-muted-foreground">
          Referência: <span className="text-lime">{ref}</span>
        </p>
      )}
      <Button asChild size="lg" className="mt-8">
        <Link href="/">Voltar para a loja</Link>
      </Button>
    </main>
  );
}
