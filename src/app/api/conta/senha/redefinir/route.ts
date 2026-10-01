import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { hashPassword } from "@/server/auth/customer";

export async function POST(req: Request) {
  const { token, password } = await req.json().catch(() => ({}));

  if (!token) {
    return NextResponse.json({ error: "Token inválido." }, { status: 400 });
  }
  if (String(password ?? "").length < 6) {
    return NextResponse.json(
      { error: "A senha deve ter ao menos 6 caracteres." },
      { status: 400 },
    );
  }

  const customer = await prisma.customer.findFirst({
    where: {
      resetToken: String(token),
      resetTokenExpiry: { gt: new Date() },
    },
  });
  if (!customer) {
    return NextResponse.json(
      { error: "Link inválido ou expirado. Solicite outro." },
      { status: 400 },
    );
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      passwordHash: await hashPassword(String(password)),
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return NextResponse.json({ ok: true });
}
