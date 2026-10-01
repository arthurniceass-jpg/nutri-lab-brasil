import { NextResponse } from "next/server";
import { getSettings } from "@/server/services/settings";
import { quoteShipping } from "@/server/services/shipping";

export async function POST(req: Request) {
  const { cep, subtotalCents } = await req.json().catch(() => ({}));
  const settings = await getSettings();
  const quote = quoteShipping(
    String(cep ?? ""),
    Number(subtotalCents ?? 0),
    settings.freeShippingCents,
  );
  if (!quote) {
    return NextResponse.json({ error: "CEP inválido." }, { status: 400 });
  }
  return NextResponse.json(quote);
}
