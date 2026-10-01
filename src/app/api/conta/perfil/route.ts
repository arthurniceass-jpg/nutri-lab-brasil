import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getCustomerSession } from "@/server/auth/customer";
import { isValidCPF } from "@/shared/validators";

export async function PATCH(req: Request) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const b = await req.json().catch(() => ({}));
  const str = (v: unknown) => {
    const s = String(v ?? "").trim();
    return s || null;
  };

  const data: Record<string, unknown> = {};
  if (b.name !== undefined && String(b.name).trim()) data.name = String(b.name).trim();
  if (b.cpf !== undefined) {
    const digits = String(b.cpf).replace(/\D/g, "");
    if (digits && !isValidCPF(digits)) {
      return NextResponse.json({ error: "CPF inválido." }, { status: 400 });
    }
    data.cpf = digits || null;
  }
  if (b.cep !== undefined) data.cep = String(b.cep).replace(/\D/g, "") || null;
  if (b.address !== undefined) data.address = str(b.address);
  if (b.number !== undefined) data.number = str(b.number);
  if (b.complement !== undefined) data.complement = str(b.complement);
  if (b.neighborhood !== undefined) data.neighborhood = str(b.neighborhood);
  if (b.city !== undefined) data.city = str(b.city);
  if (b.state !== undefined)
    data.state = String(b.state ?? "").trim().toUpperCase() || null;

  await prisma.customer.update({ where: { id: session.id }, data });
  return NextResponse.json({ ok: true });
}
