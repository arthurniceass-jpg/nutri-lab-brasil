import { NextResponse } from "next/server";
import { clearCustomerCookie } from "@/server/auth/customer";

export async function POST() {
  await clearCustomerCookie();
  return NextResponse.json({ ok: true });
}
