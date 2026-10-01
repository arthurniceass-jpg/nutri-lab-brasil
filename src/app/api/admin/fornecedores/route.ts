import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getSession } from "@/server/auth/owner";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const b = await req.json().catch(() => ({}));
  const name = String(b.name ?? "").trim();
  if (!name) {
    return NextResponse.json(
      { error: "Informe o nome do fornecedor." },
      { status: 400 },
    );
  }

  const str = (v: unknown) => {
    const s = String(v ?? "").trim();
    return s || null;
  };

  const supplier = await prisma.supplier.create({
    data: {
      name,
      cnpj: str(b.cnpj),
      email: str(b.email),
      phone: str(b.phone),
      contactName: str(b.contactName),
      city: str(b.city),
      state: str(b.state),
      supplies: str(b.supplies),
      notes: str(b.notes),
    },
  });

  return NextResponse.json({ ok: true, id: supplier.id });
}
