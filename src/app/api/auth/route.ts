import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSession,
  validateOwner,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/server/auth/owner";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));

  if (!email || !password) {
    return NextResponse.json(
      { error: "Informe email e senha." },
      { status: 400 },
    );
  }

  if (!validateOwner(email, password)) {
    return NextResponse.json(
      { error: "Credenciais invalidas." },
      { status: 401 },
    );
  }

  const token = await createSession(email);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return NextResponse.json({ ok: true });
}

// Logout
export async function DELETE() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
