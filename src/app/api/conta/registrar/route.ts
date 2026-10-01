import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import {
  hashPassword,
  createCustomerSession,
  setCustomerCookie,
  isValidEmail,
} from "@/server/auth/customer";
import { isValidCPF } from "@/shared/validators";

export async function POST(req: Request) {
  const {
    name,
    email,
    password,
    cpf,
    cep,
    address,
    number,
    complement,
    neighborhood,
    city,
    state,
  } = await req.json().catch(() => ({}));

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Preencha nome, email e senha." },
      { status: 400 },
    );
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  }
  if (String(password).length < 6) {
    return NextResponse.json(
      { error: "A senha deve ter ao menos 6 caracteres." },
      { status: 400 },
    );
  }

  // Novos campos obrigatorios de endereço/documento
  const cpfDigits = String(cpf ?? "").replace(/\D/g, "");
  const cepDigits = String(cep ?? "").replace(/\D/g, "");

  if (!isValidCPF(cpfDigits)) {
    return NextResponse.json(
      { error: "CPF inválido." },
      { status: 400 },
    );
  }
  if (cepDigits.length < 8) {
    return NextResponse.json(
      { error: "CEP deve ter no mínimo 8 digitos." },
      { status: 400 },
    );
  }
  if (!String(address ?? "").trim()) {
    return NextResponse.json({ error: "Informe o endereço." }, { status: 400 });
  }
  if (!String(number ?? "").trim()) {
    return NextResponse.json({ error: "Informe o número." }, { status: 400 });
  }

  const normalized = String(email).trim().toLowerCase();
  const exists = await prisma.customer.findUnique({
    where: { email: normalized },
  });
  if (exists) {
    return NextResponse.json(
      { error: "Já existe uma conta com este email." },
      { status: 409 },
    );
  }

  const customer = await prisma.customer.create({
    data: {
      name: String(name).trim(),
      email: normalized,
      passwordHash: await hashPassword(String(password)),
      cpf: cpfDigits,
      cep: cepDigits,
      address: String(address).trim(),
      number: String(number).trim(),
      complement: String(complement ?? "").trim() || null,
      neighborhood: String(neighborhood ?? "").trim() || null,
      city: String(city ?? "").trim() || null,
      state: String(state ?? "").trim().toUpperCase() || null,
    },
  });

  const token = await createCustomerSession(customer);
  await setCustomerCookie(token);

  return NextResponse.json({ ok: true });
}
