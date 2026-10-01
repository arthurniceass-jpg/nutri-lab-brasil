import "server-only";
import { prisma } from "@/server/db/prisma";
import type { ProductDTO } from "@/shared/types";

// Produto completo por slug (para a página do produto). Sem custo/lucro.
export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      usage: true,
      ingredients: true,
      priceCents: true,
      category: true,
      image: true,
      images: true,
      rating: true,
      reviews: true,
      stock: true,
      flavor: true,
      weight: true,
      featured: true,
      active: true,
      productReviews: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          customerName: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
      },
    },
  });
  return product;
}

// Produtos relacionados (mesma categoria)
export async function getRelatedProducts(
  category: string,
  excludeId: string,
): Promise<ProductDTO[]> {
  return prisma.product.findMany({
    where: {
      active: true,
      category: category as never,
      id: { not: excludeId },
    },
    take: 4,
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      priceCents: true,
      category: true,
      image: true,
      rating: true,
      reviews: true,
      stock: true,
      flavor: true,
      weight: true,
      featured: true,
    },
  });
}

// Seleciona apenas campos seguros para o cliente (sem custo/lucro).
export async function getStoreProducts(): Promise<ProductDTO[]> {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: [{ featured: "desc" }, { reviews: "desc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      priceCents: true,
      category: true,
      image: true,
      rating: true,
      reviews: true,
      stock: true,
      flavor: true,
      weight: true,
      featured: true,
    },
  });
  return products;
}
