import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getSession } from "@/server/auth/owner";
import type { Category } from "@prisma/client";

const CATEGORIES = [
  "PROTEINAS",
  "CREATINA",
  "PRE_TREINO",
  "AMINOACIDOS",
  "VITAMINAS",
  "EMAGRECEDORES",
] as const;

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base || "produto";
  let n = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

export async function POST(req: Request) {
  // Rota protegida: só o proprietário
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const b = await req.json().catch(() => ({}));
  const name = String(b.name ?? "").trim();
  const category = String(b.category ?? "");
  const priceCents = Math.round(Number(b.priceCents));
  const costCents = Math.round(Number(b.costCents));
  const stock = Math.max(0, Math.round(Number(b.stock ?? 0)));

  if (!name) {
    return NextResponse.json({ error: "Informe o nome." }, { status: 400 });
  }
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }
  if (!Number.isFinite(priceCents) || priceCents <= 0) {
    return NextResponse.json({ error: "Preço inválido." }, { status: 400 });
  }
  if (!Number.isFinite(costCents) || costCents < 0) {
    return NextResponse.json({ error: "Custo inválido." }, { status: 400 });
  }

  const slug = await uniqueSlug(slugify(name));
  const image =
    String(b.image ?? "").trim() ||
    `https://placehold.co/600x600/0A0A0A/C2EE3E/png?text=${encodeURIComponent(name)}`;

  const product = await prisma.product.create({
    data: {
      slug,
      name,
      description: String(b.description ?? "").trim() || name,
      priceCents,
      costCents,
      stock,
      category: category as Category,
      image,
      flavor: b.flavor ? String(b.flavor).trim() : null,
      weight: b.weight ? String(b.weight).trim() : null,
      usage: b.usage ? String(b.usage).trim() : null,
      ingredients: b.ingredients ? String(b.ingredients).trim() : null,
      supplierId: b.supplierId ? String(b.supplierId) : null,
      featured: Boolean(b.featured),
      active: b.active === undefined ? true : Boolean(b.active),
    },
  });

  return NextResponse.json({ ok: true, id: product.id });
}
