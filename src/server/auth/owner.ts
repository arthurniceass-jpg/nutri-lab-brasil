import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "nl_session";
const ALG = "HS256";
const MAX_AGE = 60 * 60 * 8; // 8 horas

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET não configurado");
  return new TextEncoder().encode(value);
}

export type Session = {
  email: string;
  role: "OWNER";
};

export async function createSession(email: string): Promise<string> {
  return new SignJWT({ role: "OWNER" })
    .setProtectedHeader({ alg: ALG })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(
  token: string | undefined,
): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.role !== "OWNER" || !payload.sub) return null;
    return { email: payload.sub, role: "OWNER" };
  } catch {
    return null;
  }
}

// Valida credenciais contra as variaveis de ambiente do proprietário.
export function validateOwner(email: string, password: string): boolean {
  const ownerEmail = process.env.OWNER_EMAIL;
  const ownerPassword = process.env.OWNER_PASSWORD;
  if (!ownerEmail || !ownerPassword) return false;
  return (
    email.trim().toLowerCase() === ownerEmail.toLowerCase() &&
    password === ownerPassword
  );
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export { MAX_AGE as SESSION_MAX_AGE };
