import { prisma } from "@/server/db/prisma";
import { ProductsManager } from "@/components/admin/products-manager";

export const dynamic = "force-dynamic";

export default async function ProdutosPage() {
  const [products, suppliers] = await Promise.all([
    prisma.product.findMany({
      orderBy: [{ active: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        priceCents: true,
        costCents: true,
        stock: true,
        active: true,
        featured: true,
        image: true,
        flavor: true,
        weight: true,
        usage: true,
        ingredients: true,
        supplierId: true,
      },
    }),
    prisma.supplier.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return <ProductsManager products={products} suppliers={suppliers} />;
}
