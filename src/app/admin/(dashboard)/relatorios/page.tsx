import { Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { CategoryDonut } from "@/components/admin/category-donut";
import { TopProducts } from "@/components/admin/top-products";
import { getDashboardData } from "@/server/services/dashboard";
import { prisma } from "@/server/db/prisma";
import { formatBRL, formatPercent } from "@/shared/format";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  const data = await getDashboardData(12);

  const totalFat = data.monthly.reduce((s, m) => s + m.faturamentoCents, 0);
  const totalLucro = data.monthly.reduce((s, m) => s + m.lucroCents, 0);
  const totalPedidos = data.monthly.reduce((s, m) => s + m.pedidos, 0);
  const margem = totalFat ? totalLucro / totalFat : 0;

  // Faturamento por canal (pedidos realizados)
  const porCanal = await prisma.order.groupBy({
    by: ["channel"],
    where: { status: { in: ["PAGO", "ENVIADO", "ENTREGUE"] } },
    _sum: { totalCents: true },
    _count: true,
  });
  const canal = (c: string) => porCanal.find((x) => x.channel === c);
  const site = canal("SITE");
  const manual = canal("MANUAL");

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-lime">
            Painel do proprietário
          </p>
          <h1 className="display text-4xl text-foreground md:text-5xl">
            Relatórios
          </h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            Últimos 12 meses
          </p>
        </div>
        <a
          href="/api/admin/relatorios/export"
          className="flex h-11 items-center gap-2 rounded-md bg-lime px-6 font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-lime-glow"
        >
          <Download className="size-4" /> Exportar CSV
        </a>
      </header>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Summary label="Faturamento (12M)" value={formatBRL(totalFat)} />
        <Summary label="Lucro liquido (12M)" value={formatBRL(totalLucro)} />
        <Summary label="Margem média" value={formatPercent(margem)} />
        <Summary label="Pedidos (12M)" value={String(totalPedidos)} />
      </section>

      {/* Faturamento por canal */}
      <Card className="p-5">
        <h2 className="display mb-4 text-xl text-foreground">
          Vendas por <span className="text-lime">canal</span>
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ChannelBox
            label="Loja online (site)"
            cents={site?._sum.totalCents ?? 0}
            count={site?._count ?? 0}
          />
          <ChannelBox
            label="Venda manual (balcão)"
            cents={manual?._sum.totalCents ?? 0}
            count={manual?._count ?? 0}
          />
        </div>
      </Card>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart monthly={data.monthly} />
        </div>
        <CategoryDonut data={data.salesByCategory} />
      </section>

      <TopProducts items={data.topProducts} />
    </div>
  );
}

function ChannelBox({
  label,
  cents,
  count,
}: {
  label: string;
  cents: number;
  count: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-steel p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="display mt-2 text-3xl text-lime">{formatBRL(cents)}</p>
      <p className="mt-1 font-mono text-xs text-muted-foreground">
        {count} pedido(s)
      </p>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="display mt-2 text-3xl text-foreground">{value}</p>
    </Card>
  );
}
