import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Receipt,
} from "lucide-react";
import { KpiCard } from "@/components/admin/kpi-card";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { CategoryDonut } from "@/components/admin/category-donut";
import { TopProducts } from "@/components/admin/top-products";
import { RecentOrders } from "@/components/admin/recent-orders";
import { LowStock } from "@/components/admin/low-stock";
import { getDashboardData } from "@/server/services/dashboard";
import { formatBRL, formatPercent } from "@/shared/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData(12);
  const { kpis } = data;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header>
        <p className="mb-2 font-mono text-xs uppercase leading-none tracking-widest text-lime">
          Painel do proprietário
        </p>
        <h1 className="display text-4xl leading-[1.1] text-foreground md:text-5xl">
          Visão <span className="text-lime">geral</span>
        </h1>
      </header>

      {/* KPIs */}
      <section
        aria-label="Indicadores principais"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <KpiCard
          icon={<DollarSign className="size-5" />}
          label="Faturamento"
          value={formatBRL(kpis.faturamento.valueCents)}
          deltaRatio={kpis.faturamento.deltaRatio}
          spark={kpis.faturamento.spark}
        />
        <KpiCard
          icon={<TrendingUp className="size-5" />}
          label="Lucro líquido"
          value={formatBRL(kpis.lucro.valueCents)}
          sub={`Margem ${formatPercent(kpis.lucro.marginRatio)}`}
          deltaRatio={kpis.lucro.deltaRatio}
          spark={kpis.lucro.spark}
        />
        <KpiCard
          icon={<ShoppingCart className="size-5" />}
          label="Pedidos"
          value={String(kpis.pedidos.value)}
          deltaRatio={kpis.pedidos.deltaRatio}
          spark={kpis.pedidos.spark}
        />
        <KpiCard
          icon={<Receipt className="size-5" />}
          label="Ticket médio"
          value={formatBRL(kpis.ticket.valueCents)}
          deltaRatio={kpis.ticket.deltaRatio}
          spark={kpis.ticket.spark}
        />
      </section>

      {/* Graficos */}
      <section
        id="relatórios"
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        <div className="lg:col-span-2">
          <RevenueChart monthly={data.monthly} />
        </div>
        <CategoryDonut data={data.salesByCategory} />
      </section>

      {/* Ranking + estoque */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TopProducts items={data.topProducts} />
        </div>
        <LowStock items={data.lowStock} />
      </section>

      {/* Pedidos recentes */}
      <section>
        <RecentOrders orders={data.recentOrders} />
      </section>
    </div>
  );
}
