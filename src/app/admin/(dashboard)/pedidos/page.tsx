import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/server/db/prisma";
import { formatBRL, formatDate } from "@/shared/format";
import type { OrderStatus, Prisma } from "@prisma/client";

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

const FILTERS: { key: string; label: string }[] = [
  { key: "TODOS", label: "Todos" },
  { key: "PENDENTE", label: "Pendentes" },
  { key: "PAGO", label: "Pagos" },
  { key: "ENVIADO", label: "Enviados" },
  { key: "ENTREGUE", label: "Entregues" },
  { key: "CANCELADO", label: "Cancelados" },
];

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; canal?: string }>;
}) {
  const { status, q, canal } = await searchParams;
  const active = status && status in STATUS ? (status as OrderStatus) : "TODOS";
  const query = (q ?? "").trim();
  const canalActive =
    canal === "SITE" || canal === "MANUAL" ? canal : "TODOS";

  const where: Prisma.OrderWhereInput = {};
  if (active !== "TODOS") where.status = active;
  if (canalActive !== "TODOS") where.channel = canalActive;
  if (query) {
    where.OR = [
      { reference: { contains: query, mode: "insensitive" } },
      { customerName: { contains: query, mode: "insensitive" } },
      { customerEmail: { contains: query, mode: "insensitive" } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      reference: true,
      customerName: true,
      status: true,
      totalCents: true,
      createdAt: true,
      channel: true,
      _count: { select: { items: true } },
    },
  });

  const chipHref = (key: string) => {
    const p = new URLSearchParams();
    if (key !== "TODOS") p.set("status", key);
    if (canalActive !== "TODOS") p.set("canal", canalActive);
    if (query) p.set("q", query);
    const s = p.toString();
    return `/admin/pedidos${s ? `?${s}` : ""}`;
  };

  const canalHref = (key: string) => {
    const p = new URLSearchParams();
    if (active !== "TODOS") p.set("status", active);
    if (key !== "TODOS") p.set("canal", key);
    if (query) p.set("q", query);
    const s = p.toString();
    return `/admin/pedidos${s ? `?${s}` : ""}`;
  };

  const CANAIS = [
    { key: "TODOS", label: "Todos os canais" },
    { key: "SITE", label: "Site" },
    { key: "MANUAL", label: "Manual" },
  ];

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-lime">
            Painel do proprietário
          </p>
          <h1 className="display text-4xl text-foreground md:text-5xl">Pedidos</h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {orders.length} resultado(s)
          </p>
        </div>
        <Link
          href="/admin/pedidos/novo"
          className="flex h-11 items-center gap-2 rounded-md bg-lime px-6 font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-lime-glow"
        >
          <Plus className="size-4" /> Novo pedido
        </Link>
      </header>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={chipHref(f.key)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold uppercase tracking-wide transition-colors ${
                active === f.key
                  ? "border-lime bg-lime text-ink"
                  : "border-border bg-steel text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <form action="/admin/pedidos" method="get" className="relative w-full md:max-w-xs">
          {active !== "TODOS" && <input type="hidden" name="status" value={active} />}
          {canalActive !== "TODOS" && <input type="hidden" name="canal" value={canalActive} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Buscar por código ou cliente"
            className="h-11 w-full rounded-md border border-border bg-steel pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-lime focus-visible:outline-none"
          />
        </form>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {CANAIS.map((f) => (
          <Link
            key={f.key}
            href={canalHref(f.key)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              canalActive === f.key
                ? "border-lime text-lime"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <Card className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-xs uppercase text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Pedido</th>
                <th className="pb-2 pr-4 font-medium">Cliente</th>
                <th className="pb-2 pr-4 font-medium">Data</th>
                <th className="pb-2 pr-4 font-medium">Itens</th>
                <th className="pb-2 pr-4 font-medium">Total</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const s = STATUS[o.status];
                return (
                  <tr key={o.reference} className="border-b border-border/50 last:border-0">
                    <td className="py-3 pr-4 font-mono text-xs">
                      <Link href={`/admin/pedidos/${o.reference}`} className="text-lime hover:underline">
                        {o.reference}
                      </Link>
                      {o.channel === "MANUAL" && (
                        <span className="ml-2 rounded bg-steel px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Manual
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-foreground">{o.customerName}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                      {formatDate(o.createdAt)}
                    </td>
                    <td className="py-3 pr-4 font-mono text-muted-foreground">
                      {o._count.items}
                    </td>
                    <td className="py-3 pr-4 font-mono font-bold text-foreground">
                      {formatBRL(o.totalCents)}
                    </td>
                    <td className="py-3">
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center font-mono text-xs text-muted-foreground">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
