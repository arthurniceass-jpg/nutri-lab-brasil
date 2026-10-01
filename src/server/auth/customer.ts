import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export const CUSTOMER_COOKIE = "nl_customer";
const ALG = "HS256";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET não configurado");
  return new TextEncoder().encode(value);
}

export type CustomerSession = {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER";
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createCustomerSession(customer: {
  id: string;
  name: string;
  email: string;
}): Promise<string> {
  return new SignJWT({ role: "CUSTOMER", name: customer.name, email: customer.email })
    .setProtectedHeader({ alg: ALG })
    .setSubject(customer.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

export async function verifyCustomer(
  token: string | undefined,
): Promise<CustomerSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.role !== "CUSTOMER" || !payload.sub) return null;
    return {
      id: payload.sub,
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
      role: "CUSTOMER",
    };
  } catch {
    return null;
  }
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const store = await cookies();
  return verifyCustomer(store.get(CUSTOMER_COOKIE)?.value);
}

export async function setCustomerCookie(token: string) {
  const store = await cookies();
  store.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearCustomerCookie() {
  const store = await cookies();
  store.delete(CUSTOMER_COOKIE);
}

// Validação simples de email
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
