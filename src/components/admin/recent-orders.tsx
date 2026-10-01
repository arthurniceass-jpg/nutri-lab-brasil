import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBRL, formatDate } from "@/shared/format";
import type { OrderStatus } from "@prisma/client";

type Order = {
  reference: string;
  customer: string;
  status: OrderStatus;
  totalCents: number;
  createdAt: Date;
  itemsCount: number;
};

const STATUS: Record<
  OrderStatus,
  { label: string; variant: "success" | "warning" | "info" | "danger" | "muted" }
> = {
  PAGO: { label: "Pago", variant: "success" },
  PENDENTE: { label: "Pendente", variant: "warning" },
  ENVIADO: { label: "Enviado", variant: "info" },
  ENTREGUE: { label: "Entregue", variant: "success" },
  CANCELADO: { label: "Cancelado", variant: "danger" },
};

export function RecentOrders({ orders }: { orders: Order[] }) {
  return (
    <Card id="pedidos" className="p-5">
      <h2 className="display text-xl text-foreground">
        Pedidos <span className="text-lime">recentes</span>
      </h2>
      <p className="mb-4 font-mono text-xs text-muted-foreground">
        Últimas movimentações
      </p>

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
                <tr
                  key={o.reference}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-3 pr-4 font-mono text-xs">
                    <Link
                      href={`/admin/pedidos/${o.reference}`}
                      className="text-lime hover:underline"
                    >
                      {o.reference}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-foreground">{o.customer}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                    {formatDate(o.createdAt)}
                  </td>
                  <td className="py-3 pr-4 font-mono text-muted-foreground">
                    {o.itemsCount}
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
                <td
                  colSpan={6}
                  className="py-6 text-center font-mono text-xs text-muted-foreground"
                >
                  Nenhum pedido ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
