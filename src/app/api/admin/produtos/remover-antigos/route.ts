import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getSession } from "@/server/auth/owner";
import { CATALOGO_RELAMPAGO } from "@/server/data/catalogo-relampago";

// Remove da loja os produtos que NÃO são do Catálogo Relâmpago. Só o proprietário.
// Mesma regra da exclusão individual: produto com pedidos é apenas desativado
// (some da loja, histórico preservado); sem pedidos é excluído de vez.
// Trava: exige o catálogo novo já importado, para a loja nunca ficar vazia.
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const keep = CATALOGO_RELAMPAGO.map((p) => p.slug);

  const present = await prisma.product.count({
    where: { slug: { in: keep }, active: true },
  });
  if (present < keep.length) {
    return NextResponse.json(
      {
        error: `Importe o catálogo relâmpago primeiro (${present} de ${keep.length} produtos ativos). Nada foi removido.`,
      },
      { status: 409 },
    );
  }

  const others = await prisma.product.findMany({
    where: { slug: { notIn: keep }, active: true },
    select: { id: true },
  });

  let deleted = 0;
  let deactivated = 0;

  for (const { id } of others) {
    const orders = await prisma.orderItem.count({ where: { productId: id } });
    if (orders > 0) {
      await prisma.product.update({ where: { id }, data: { active: false } });
      deactivated += 1;
    } else {
      await prisma.product.delete({ where: { id } });
      deleted += 1;
    }
  }

  return NextResponse.json({ ok: true, deleted, deactivated, kept: keep.length });
}
