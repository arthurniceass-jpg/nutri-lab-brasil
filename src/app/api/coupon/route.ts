import { NextResponse } from "next/server";
import { validateCoupon } from "@/server/services/coupons";

export async function POST(req: Request) {
  const { code, subtotalCents } = await req.json().catch(() => ({}));

  const result = await validateCoupon(
    String(code ?? ""),
    Number(subtotalCents ?? 0),
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    code: result.code,
    type: result.type,
    value: result.value,
    minSubtotalCents: result.minSubtotalCents,
    discountCents: result.discountCents,
  });
}
