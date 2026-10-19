import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getSession } from "@/server/auth/owner";
import {
  CATALOGO_RELAMPAGO,
  IMPORT_COST_CENTS,
  IMPORT_STOCK,
} from "@/server/data/catalogo-relampago";

// Importa o Catálogo Relâmpago (pré-venda). Só o proprietário.
// Idempotente: produto que já existe (mesmo slug) só tem texto (descrição e modo de uso)
// e foto atualizados — custo, estoque e preço que você editou no painel NUNCA são tocados.
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let created = 0;
  let updated = 0;

  for (const item of CATALOGO_RELAMPAGO) {
    const exists = await prisma.product.findUnique({ where: { slug: item.slug } });
    if (exists) {
      await prisma.product.update({
        where: { slug: item.slug },
        data: {
          description: item.description,
          usage: item.usage,
          image: `/products/${item.slug}.webp`,
          weight: item.weight,
          flavor: item.flavor,
          name: item.name,
        },
      });
      updated += 1;
      continue;
    }
    await prisma.product.create({
      data: {
        slug: item.slug,
        name: item.name,
        description: item.description,
        usage: item.usage,
        priceCents: item.priceCents,
        costCents: IMPORT_COST_CENTS,
        stock: IMPORT_STOCK,
        category: item.category,
        image: `/products/${item.slug}.webp`,
        images: [],
        weight: item.weight,
        flavor: item.flavor,
        featured: false,
        active: true,
      },
    });
    created += 1;
  }

  return NextResponse.json({ ok: true, created, updated, total: CATALOGO_RELAMPAGO.length });
}
