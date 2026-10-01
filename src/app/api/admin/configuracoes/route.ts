import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getSession } from "@/server/auth/owner";

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const b = await req.json().catch(() => ({}));
  const str = (v: unknown) => {
    const s = String(v ?? "").trim();
    return s || null;
  };

  const data: Record<string, unknown> = {};

  // Dados da loja
  if (b.storeName !== undefined) data.storeName = String(b.storeName).trim() || "NUTRI LAB BRASIL";
  if (b.slogan !== undefined) data.slogan = String(b.slogan).trim();
  if (b.email !== undefined) data.email = String(b.email).trim();
  if (b.phone !== undefined) data.phone = str(b.phone);
  if (b.whatsapp !== undefined) data.whatsapp = str(b.whatsapp);
  if (b.instagram !== undefined) data.instagram = str(b.instagram);
  if (b.cnpj !== undefined) data.cnpj = str(b.cnpj);
  if (b.address !== undefined) data.address = str(b.address);

  // Frete
  if (b.freeShippingCents !== undefined)
    data.freeShippingCents = Math.max(0, Math.round(Number(b.freeShippingCents)));
  if (b.defaultShippingCents !== undefined)
    data.defaultShippingCents = Math.max(0, Math.round(Number(b.defaultShippingCents)));

  // Pagamento
  if (b.mpAccessToken !== undefined) data.mpAccessToken = str(b.mpAccessToken);
  if (typeof b.pixEnabled === "boolean") data.pixEnabled = b.pixEnabled;
  if (typeof b.cardEnabled === "boolean") data.cardEnabled = b.cardEnabled;
  if (typeof b.boletoEnabled === "boolean") data.boletoEnabled = b.boletoEnabled;

  // Estoque
  if (b.lowStockThreshold !== undefined)
    data.lowStockThreshold = Math.max(1, Math.round(Number(b.lowStockThreshold)));

  await prisma.storeSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  return NextResponse.json({ ok: true });
}
