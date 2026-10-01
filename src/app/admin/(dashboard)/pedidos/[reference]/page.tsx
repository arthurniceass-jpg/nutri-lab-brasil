import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User, IdCard, MapPin, Mail, Store, StickyNote, Hash } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderStatusEditor } from "@/components/admin/order-status-editor";
import { prisma } from "@/server/db/prisma";
import { formatBRL, formatDateTime } from "@/shared/format";
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

export default async function PedidoDetalhePage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const order = await prisma.order.findUnique({
    where: { reference },
    include: { items: true, customer: true },
  });
  if (!order) notFound();

  const s = STATUS[order.status];
  const c = order.customer;

  // Prefere os dados do cadastro do cliente; cai para o snapshot do pedido.
  const cpfRaw = c?.cpf ?? order.customerCpf ?? null;
  const cpfFmt = cpfRaw
    ? cpfRaw.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    : null;
  const cepFmt = c?.cep ? c.cep.replace(/(\d{5})(\d{3})/, "$1-$2") : null;
  const email = c?.email ?? order.customerEmail;
  const addressFull =
    c?.address
      ? [
          [c.address, c.number].filter(Boolean).join(", "),
          c.complement,
          c.neighborhood,
          c.city && c.state ? `${c.city}/${c.state}` : c.city,
        ]
          .filter(Boolean)
          .join(" - ")
      : order.shippingAddress ?? null;
  const lucroCents = order.subtotalCents - order.discountCents - order.costCents;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-lime"
      >
        <ArrowLeft className="size-4" /> Voltar ao painel
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-lime">
            Pedido
          </p>
          <h1 className="display text-3xl text-foreground md:text-4xl">
            {order.reference}
          </h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <Badge variant={s.variant}>{s.label}</Badge>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Itens */}
        <Card className="p-5">
          <h2 className="display mb-4 text-xl text-foreground">Itens</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-xs uppercase text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Produto</th>
                <th className="pb-2 pr-4 font-medium">Qtd</th>
                <th className="pb-2 pr-4 font-medium">Preço</th>
                <th className="pb-2 font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it) => (
                <tr key={it.id} className="border-b border-border/50 last:border-0">
                  <td className="py-3 pr-4 font-bold uppercase tracking-wide text-foreground">
                    {it.name}
                  </td>
                  <td className="py-3 pr-4 font-mono text-muted-foreground">
                    {it.quantity}
                  </td>
                  <td className="py-3 pr-4 font-mono text-muted-foreground">
                    {formatBRL(it.priceCents)}
                  </td>
                  <td className="py-3 font-mono font-bold text-foreground">
                    {formatBRL(it.priceCents * it.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
            <Row label="Subtotal" value={formatBRL(order.subtotalCents)} />
            {order.discountCents > 0 && (
              <Row
                label={`Desconto${order.couponCode ? ` (${order.couponCode})` : ""}`}
                value={`- ${formatBRL(order.discountCents)}`}
                lime
              />
            )}
            <Row
              label="Frete"
              value={order.shippingCents === 0 ? "Grátis" : formatBRL(order.shippingCents)}
            />
            <div className="flex justify-between border-t border-border pt-2">
              <dt className="font-bold uppercase tracking-wide text-foreground">
                Total
              </dt>
              <dd className="display text-2xl text-lime">
                {formatBRL(order.totalCents)}
              </dd>
            </div>
            <Row label="Custo" value={formatBRL(order.costCents)} muted />
            <Row label="Lucro liquido" value={formatBRL(lucroCents)} lime />
          </dl>
        </Card>

        {/* Coluna direita: status + cliente */}
        <div className="space-y-6">
          <OrderStatusEditor
            reference={order.reference}
            initialStatus={order.status}
            initialTracking={order.trackingCode}
            initialNote={order.shippingNote}
          />

          {/* Cliente e entrega */}
          <Card className="h-fit p-5">
          <h2 className="display mb-4 text-xl text-foreground">
            Cliente e <span className="text-lime">entrega</span>
          </h2>
          <dl className="space-y-4 text-sm">
            <Info icon={<Store className="size-4 text-lime" />} label="Origem">
              {order.channel === "MANUAL" ? "Venda manual (balcão)" : "Loja online"}
              {order.paymentMethod ? ` . ${order.paymentMethod}` : ""}
            </Info>
            {order.notes && (
              <Info icon={<StickyNote className="size-4 text-lime" />} label="Observação">
                {order.notes}
              </Info>
            )}
            <Info icon={<User className="size-4 text-lime" />} label="Nome">
              {order.customerName}
            </Info>
            <Info icon={<Mail className="size-4 text-lime" />} label="Email">
              <span className="break-all">{email}</span>
            </Info>
            <Info icon={<IdCard className="size-4 text-lime" />} label="CPF">
              {cpfFmt ?? "Não informado"}
            </Info>
            <Info icon={<MapPin className="size-4 text-lime" />} label="Endereço de entrega">
              {addressFull ?? "Não informado"}
            </Info>
            <Info icon={<Hash className="size-4 text-lime" />} label="CEP">
              {cepFmt ?? "Não informado"}
            </Info>
          </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  lime,
  muted,
}: {
  label: string;
  value: string;
  lime?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <dt className={muted ? "text-muted-foreground" : "text-muted-foreground"}>
        {label}
      </dt>
      <dd className={`font-mono ${lime ? "text-lime" : muted ? "text-muted-foreground" : "text-foreground"}`}>
        {value}
      </dd>
    </div>
  );
}

function Info({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  );
}
