import { prisma } from "@/server/db/prisma";
import { ManualOrderForm } from "@/components/admin/manual-order-form";

export const dynamic = "force-dynamic";

export default async function NovoPedidoPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, priceCents: true, stock: true },
  });
  return <ManualOrderForm products={products} />;
}
