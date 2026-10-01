import "server-only";
import { prisma } from "@/server/db/prisma";
import { CATEGORY_LABEL, CATEGORY_COLOR } from "@/shared/categories";
import type { Category, OrderStatus } from "@prisma/client";

// Pedidos que já contam como receita realizada
const REALIZED: OrderStatus[] = ["PAGO", "ENVIADO", "ENTREGUE"];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function monthLabel(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", { month: "short" })
    .format(d)
    .replace(".", "")
    .toUpperCase();
}

function ratio(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 1 : 0;
  return (current - previous) / previous;
}

export type MonthPoint = {
  label: string;
  faturamentoCents: number;
  lucroCents: number;
  pedidos: number;
};

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export async function getDashboardData(range: 6 | 12 = 6) {
  const now = new Date();
  const firstMonth = addMonths(startOfMonth(now), -(range - 1));

  // Busca todos os pedidos realizados desde o primeiro mês da janela.
  // Também busca o mês anterior ao início para o calculo de variação.
  const since = addMonths(firstMonth, -1);

  const orders = await prisma.order.findMany({
    where: { status: { in: REALIZED }, createdAt: { gte: since } },
    select: {
      subtotalCents: true,
      discountCents: true,
      totalCents: true,
      costCents: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Agrupa por mês
  const buckets = new Map<string, MonthPoint>();
  const months: Date[] = [];
  for (let i = 0; i < range; i++) {
    const m = addMonths(firstMonth, i);
    const key = `${m.getFullYear()}-${m.getMonth()}`;
    months.push(m);
    buckets.set(key, {
      label: monthLabel(m),
      faturamentoCents: 0,
      lucroCents: 0,
      pedidos: 0,
    });
  }

  // Mês atual e anterior (para os KPIs e suas variações)
  const curKey = `${now.getFullYear()}-${now.getMonth()}`;
  const prev = addMonths(startOfMonth(now), -1);
  const prevKey = `${prev.getFullYear()}-${prev.getMonth()}`;

  const agg: Record<
    string,
    { faturamento: number; lucro: number; pedidos: number }
  > = {};

  for (const o of orders) {
    const d = o.createdAt;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    // Lucro liquido: (preço - custo) menos o desconto concedido
    const lucro = o.subtotalCents - o.discountCents - o.costCents;

    if (buckets.has(key)) {
      const b = buckets.get(key)!;
      b.faturamentoCents += o.totalCents;
      b.lucroCents += lucro;
      b.pedidos += 1;
    }
    agg[key] ??= { faturamento: 0, lucro: 0, pedidos: 0 };
    agg[key].faturamento += o.totalCents;
    agg[key].lucro += lucro;
    agg[key].pedidos += 1;
  }

  const monthly: MonthPoint[] = months.map(
    (m) => buckets.get(`${m.getFullYear()}-${m.getMonth()}`)!,
  );

  const cur = agg[curKey] ?? { faturamento: 0, lucro: 0, pedidos: 0 };
  const prv = agg[prevKey] ?? { faturamento: 0, lucro: 0, pedidos: 0 };

  const ticketCur = cur.pedidos ? cur.faturamento / cur.pedidos : 0;
  const ticketPrv = prv.pedidos ? prv.faturamento / prv.pedidos : 0;

  // Sparklines: últimos 6 meses de cada metrica
  const sparkSlice = monthly.slice(-6);

  const kpis = {
    faturamento: {
      valueCents: cur.faturamento,
      deltaRatio: ratio(cur.faturamento, prv.faturamento),
      spark: sparkSlice.map((m) => m.faturamentoCents / 100),
    },
    lucro: {
      valueCents: cur.lucro,
      marginRatio: cur.faturamento ? cur.lucro / cur.faturamento : 0,
      deltaRatio: ratio(cur.lucro, prv.lucro),
      spark: sparkSlice.map((m) => m.lucroCents / 100),
    },
    pedidos: {
      value: cur.pedidos,
      deltaRatio: ratio(cur.pedidos, prv.pedidos),
      spark: sparkSlice.map((m) => m.pedidos),
    },
    ticket: {
      valueCents: ticketCur,
      deltaRatio: ratio(ticketCur, ticketPrv),
      spark: sparkSlice.map((m) =>
        m.pedidos ? m.faturamentoCents / m.pedidos / 100 : 0,
      ),
    },
  };

  // Vendas por categoria (itens de pedidos realizados na janela)
  const items = await prisma.orderItem.findMany({
    where: {
      order: { status: { in: REALIZED }, createdAt: { gte: firstMonth } },
    },
    select: {
      quantity: true,
      priceCents: true,
      name: true,
      product: { select: { category: true } },
    },
  });

  const byCategory = new Map<Category, number>();
  const byProduct = new Map<string, { units: number; revenueCents: number }>();

  for (const it of items) {
    const cat = it.product.category;
    byCategory.set(
      cat,
      (byCategory.get(cat) ?? 0) + it.priceCents * it.quantity,
    );
    const cur = byProduct.get(it.name) ?? { units: 0, revenueCents: 0 };
    cur.units += it.quantity;
    cur.revenueCents += it.priceCents * it.quantity;
    byProduct.set(it.name, cur);
  }

  const totalCat = [...byCategory.values()].reduce((a, b) => a + b, 0) || 1;
  const salesByCategory = [...byCategory.entries()]
    .map(([cat, cents]) => ({
      category: cat,
      label: CATEGORY_LABEL[cat],
      color: CATEGORY_COLOR[cat],
      valueCents: cents,
      share: cents / totalCat,
    }))
    .sort((a, b) => b.valueCents - a.valueCents);

  const topProducts = [...byProduct.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 5);

  // Pedidos recentes (qualquer status)
  const recentRaw = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      reference: true,
      customerName: true,
      status: true,
      totalCents: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
  });
  const recentOrders = recentRaw.map((o) => ({
    reference: o.reference,
    customer: o.customerName,
    status: o.status,
    totalCents: o.totalCents,
    createdAt: o.createdAt,
    itemsCount: o._count.items,
  }));

  // Alerta de estoque baixo (limite: 12 unidades)
  const LOW = 12;
  const lowStockRaw = await prisma.product.findMany({
    where: { active: true, stock: { lte: LOW } },
    orderBy: { stock: "asc" },
    take: 8,
    select: { name: true, stock: true, category: true },
  });
  const lowStock = lowStockRaw.map((p) => ({
    name: p.name,
    stock: p.stock,
    category: CATEGORY_LABEL[p.category],
    threshold: LOW,
  }));

  return { kpis, monthly, salesByCategory, topProducts, recentOrders, lowStock };
}
