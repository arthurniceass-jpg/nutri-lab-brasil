import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import {
  comparePassword,
  createCustomerSession,
  setCustomerCookie,
} from "@/server/auth/customer";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));

  if (!email || !password) {
    return NextResponse.json(
      { error: "Informe email e senha." },
      { status: 400 },
    );
  }

  const normalized = String(email).trim().toLowerCase();
  const customer = await prisma.customer.findUnique({
    where: { email: normalized },
  });

  // Mensagem generica para não revelar se o email existe
  if (!customer || !(await comparePassword(String(password), customer.passwordHash))) {
    return NextResponse.json(
      { error: "Email ou senha incorretos." },
      { status: 401 },
    );
  }

  const token = await createCustomerSession(customer);
  await setCustomerCookie(token);

  return NextResponse.json({ ok: true });
}
