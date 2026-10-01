import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getSession } from "@/server/auth/owner";

async function requireOwner() {
  const session = await getSession();
  return !!session;
}

// Excluir produto. Se já tiver pedidos, faz desativação (soft delete)
// para não quebrar o histórico.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireOwner())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const { id } = await params;

  const count = await prisma.orderItem.count({ where: { productId: id } });

  if (count > 0) {
    await prisma.product.update({
      where: { id },
      data: { active: false },
    });
    return NextResponse.json({
      ok: true,
      softDeleted: true,
      message:
        "Produto tem pedidos no histórico, então foi desativado (não aparece mais na loja).",
    });
  }

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true, softDeleted: false });
}

// Atualizar campos simples (ex.: ativar/desativar, estoque, preço).
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireOwner())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const { id } = await params;
  const b = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  if (typeof b.active === "boolean") data.active = b.active;
  if (typeof b.featured === "boolean") data.featured = b.featured;
  if (b.stock !== undefined) data.stock = Math.max(0, Math.round(Number(b.stock)));
  if (b.priceCents !== undefined) data.priceCents = Math.round(Number(b.priceCents));
  if (b.costCents !== undefined) data.costCents = Math.round(Number(b.costCents));
  if (b.name !== undefined && String(b.name).trim()) data.name = String(b.name).trim();
  if (b.description !== undefined) data.description = String(b.description).trim();
  if (b.category !== undefined) data.category = String(b.category);
  if (b.image !== undefined && String(b.image).trim()) data.image = String(b.image).trim();
  if (b.flavor !== undefined) data.flavor = String(b.flavor).trim() || null;
  if (b.weight !== undefined) data.weight = String(b.weight).trim() || null;
  if (b.usage !== undefined) data.usage = String(b.usage).trim() || null;
  if (b.ingredients !== undefined) data.ingredients = String(b.ingredients).trim() || null;
  if (b.supplierId !== undefined) data.supplierId = b.supplierId ? String(b.supplierId) : null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  await prisma.product.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}
