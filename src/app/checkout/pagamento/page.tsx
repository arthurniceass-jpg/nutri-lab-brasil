import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/store/logo";
import { PaymentMethods } from "@/components/store/payment-methods";
import { prisma } from "@/server/db/prisma";
import { getSettings } from "@/server/services/settings";
import { formatBRL } from "@/shared/format";

export const dynamic = "force-dynamic";

export default async function PagamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  if (!ref) redirect("/");

  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { reference: ref },
      include: { items: true },
    }),
    getSettings(),
  ]);
  if (!order) redirect("/");
  // Se já foi pago, vai direto para a confirmação
  if (order.status === "PAGO") redirect(`/checkout/sucesso?ref=${ref}`);

  return (
    <main className="min-h-screen">
      <header className="border-b border-border bg-background/85 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" aria-label="NUTRI LAB BRASIL, página inicial">
            <Logo />
          </Link>
          <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-lime" /> Pagamento seguro
          </span>
        </div>
      </header>

      <div className="container py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-lime"
        >
          <ArrowLeft className="size-4" /> Continuar comprando
        </Link>

        <div className="mb-6">
          <p className="font-mono text-xs uppercase tracking-widest text-lime">
            Finalizar compra
          </p>
          <h1 className="display text-3xl text-foreground md:text-4xl">
            Pagamento
          </h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Metodos de pagamento */}
          <PaymentMethods
            reference={order.reference}
            totalCents={order.totalCents}
            methods={{
              pix: settings.pixEnabled,
              cartão: settings.cardEnabled,
              boleto: settings.boletoEnabled,
            }}
          />

          {/* Resumo do pedido */}
          <aside className="lg:order-last">
            <div className="rounded-lg border border-border bg-card p-5 card-grain lg:sticky lg:top-24">
              <h2 className="display text-xl text-foreground">
                Resumo do <span className="text-lime">pedido</span>
              </h2>
              <p className="mb-4 font-mono text-xs text-muted-foreground">
                {order.reference}
              </p>

              <ul className="space-y-2 border-t border-border pt-4 text-sm">
                {order.items.map((it) => (
                  <li
                    key={it.id}
                    className="flex justify-between gap-3 text-muted-foreground"
                  >
                    <span>
                      {it.quantity}x {it.name}
                    </span>
                    <span className="whitespace-nowrap font-mono">
                      {formatBRL(it.priceCents * it.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <dt>Subtotal</dt>
                  <dd className="font-mono">{formatBRL(order.subtotalCents)}</dd>
                </div>
                {order.discountCents > 0 && (
                  <div className="flex justify-between text-lime">
                    <dt>
                      Desconto
                      {order.couponCode ? ` (${order.couponCode})` : ""}
                    </dt>
                    <dd className="font-mono">
                      - {formatBRL(order.discountCents)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <dt>Frete</dt>
                  <dd className="font-mono">
                    {order.shippingCents === 0
                      ? "Grátis"
                      : formatBRL(order.shippingCents)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <dt className="font-bold uppercase tracking-wide text-foreground">
                    Total
                  </dt>
                  <dd className="display text-2xl text-lime">
                    {formatBRL(order.totalCents)}
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
