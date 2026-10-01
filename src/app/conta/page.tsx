import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Package,
  ShoppingBag,
  IdCard,
  MapPin,
  Truck,
} from "lucide-react";
import { Logo } from "@/components/store/logo";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LogoutButton } from "@/components/store/account-actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCustomerSession } from "@/server/auth/customer";
import { prisma } from "@/server/db/prisma";
import { formatBRL, formatDate } from "@/shared/format";
import type { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUS: Record<
  OrderStatus,
  { label: string; variant: "success" | "warning" | "info" | "danger" }
> = {
  PAGO: { label: "Pago", variant: "success" },
  PENDENTE: { label: "Pendente", variant: "warning" },
  ENVIADO: { label: "Enviado", variant: "info" },
  ENTREGUE: { label: "Entregue", variant: "success" },
  CANCELADO: { label: "Cancelado", variant: "danger" },
};

export default async function ContaPage() {
  const session = await getCustomerSession();
  if (!session) redirect("/conta/entrar?from=/conta");

  // Dados do cliente + pedidos (por vínculo ou pelo email do cadastro)
  const [me, orders] = await Promise.all([
    prisma.customer.findUnique({ where: { id: session.id } }),
    prisma.order.findMany({
      where: {
        OR: [{ customerId: session.id }, { customerEmail: session.email }],
      },
      orderBy: { createdAt: "desc" },
      include: { items: true },
      take: 20,
    }),
  ]);

  const cpfFmt = me?.cpf
    ? me.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    : null;
  const cepFmt = me?.cep ? me.cep.replace(/(\d{5})(\d{3})/, "$1-$2") : null;
  const addressLine = me?.address
    ? [
        [me.address, me.number].filter(Boolean).join(", "),
        me.complement,
        me.neighborhood,
        me.city && me.state ? `${me.city}/${me.state}` : me.city,
        cepFmt ? `CEP ${cepFmt}` : null,
      ]
        .filter(Boolean)
        .join(" . ")
    : null;

  return (
    <main className="min-h-screen">
      <header className="border-b border-border bg-background/85 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" aria-label="NUTRI LAB BRASIL, página inicial">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle showLabel={false} />
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="container py-10">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-lime"
        >
          <ArrowLeft className="size-4" /> Voltar para a loja
        </Link>

        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-widest text-lime">
            Minha conta
          </p>
          <h1 className="display text-4xl text-foreground md:text-5xl">
            Olá, <span className="text-lime">{session.name.split(" ")[0]}</span>
          </h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {session.email}
          </p>
        </div>

        {/* Meus dados */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Meus dados
          </span>
          <Link
            href="/conta/editar"
            className="text-sm font-semibold text-lime hover:underline"
          >
            Editar dados
          </Link>
        </div>
        {(cpfFmt || addressLine) ? (
          <Card className="mb-8 grid gap-4 p-5 sm:grid-cols-2">
            <div>
              <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <IdCard className="size-4 text-lime" /> CPF
              </p>
              <p className="font-mono text-foreground">{cpfFmt ?? "-"}</p>
            </div>
            <div>
              <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <MapPin className="size-4 text-lime" /> Endereço de entrega
              </p>
              <p className="text-sm text-foreground">{addressLine ?? "-"}</p>
            </div>
          </Card>
        ) : (
          <Card className="mb-8 flex items-center justify-between gap-4 p-5">
            <p className="text-sm text-muted-foreground">
              Complete seu CPF e endereço para agilizar suas compras.
            </p>
            <Link
              href="/conta/editar"
              className="shrink-0 rounded-md bg-lime px-4 py-2 text-sm font-semibold uppercase tracking-wide text-ink hover:bg-lime-glow"
            >
              Completar
            </Link>
          </Card>
        )}

        <h2 className="mb-4 flex items-center gap-2 display text-2xl text-foreground">
          <Package className="size-5 text-lime" /> Meus pedidos
        </h2>

        {orders.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 p-12 text-center">
            <ShoppingBag className="size-12 text-muted-foreground/40" />
            <p className="font-mono text-sm text-muted-foreground">
              Você ainda não fez nenhum pedido.
            </p>
            <Link
              href="/#produtos"
              className="mt-2 rounded-md bg-lime px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-ink hover:bg-lime-glow"
            >
              Começar a comprar
            </Link>
          </Card>
        ) : (
          <ul className="space-y-4">
            {orders.map((o) => {
              const s = STATUS[o.status];
              return (
                <Card key={o.id} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs text-lime">{o.reference}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {formatDate(o.createdAt)}
                      </p>
                    </div>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </div>

                  <ul className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
                    {o.items.map((it) => (
                      <li
                        key={it.id}
                        className="flex justify-between text-muted-foreground"
                      >
                        <span>
                          {it.quantity}x {it.name}
                        </span>
                        <span className="font-mono">
                          {formatBRL(it.priceCents * it.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex justify-between border-t border-border pt-4">
                    <span className="text-sm font-bold uppercase tracking-wide text-foreground">
                      Total
                    </span>
                    <span className="display text-xl text-lime">
                      {formatBRL(o.totalCents)}
                    </span>
                  </div>

                  {o.trackingCode && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-lime/30 bg-lime/5 p-3">
                      <div className="flex items-center gap-2">
                        <Truck className="size-4 text-lime" />
                        <div>
                          <p className="font-mono text-xs uppercase text-muted-foreground">
                            Rastreio
                          </p>
                          <p className="font-mono text-sm font-bold text-lime">
                            {o.trackingCode}
                          </p>
                          {o.shippingNote && (
                            <p className="font-mono text-xs text-muted-foreground">
                              {o.shippingNote}
                            </p>
                          )}
                        </div>
                      </div>
                      <a
                        href={`https://www.linkcorreios.com.br/${encodeURIComponent(o.trackingCode)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md bg-lime px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink hover:bg-lime-glow"
                      >
                        Rastrear nos Correios
                      </a>
                    </div>
                  )}
                </Card>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
