import { prisma } from "@/server/db/prisma";
import { StockManager } from "@/components/admin/stock-manager";

export const dynamic = "force-dynamic";

export default async function EstoquePage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { stock: "asc" },
    select: {
      id: true,
      name: true,
      category: true,
      stock: true,
      priceCents: true,
      costCents: true,
      image: true,
    },
  });
  return <StockManager products={products} />;
}
