import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getCustomerSession } from "@/server/auth/customer";
import { validateCoupon } from "@/server/services/coupons";
import { getSettings, resolveMpToken } from "@/server/services/settings";
import { quoteShipping } from "@/server/services/shipping";

type Incoming = {
  items: { id: string; quantity: number }[];
  coupon?: string | null;
  cep?: string | null;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Incoming | null;
  if (!body?.items?.length) {
    return NextResponse.json({ error: "Carrinho vazio." }, { status: 400 });
  }

  // Busca preços e custos AUTORITATIVOS no banco (nunca confia no cliente)
  const ids = body.items.map((i) => i.id);
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, active: true },
  });

  const lineItems = body.items
    .map((item) => {
      const product = products.find((p) => p.id === item.id);
      // Ignora produtos inexistentes ou sem estoque (evita vender esgotado)
      if (!product || product.stock <= 0) return null;
      const requested = Math.floor(Number(item.quantity));
      const quantity = Math.max(1, Math.min(requested || 1, product.stock));
      return { product, quantity };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (lineItems.length === 0) {
    return NextResponse.json(
      { error: "Produtos indisponiveis." },
      { status: 400 },
    );
  }

  const subtotalCents = lineItems.reduce(
    (sum, li) => sum + li.product.priceCents * li.quantity,
    0,
  );
  const costCents = lineItems.reduce(
    (sum, li) => sum + li.product.costCents * li.quantity,
    0,
  );
  // Revalida o cupom no servidor (nunca confia no valor do cliente)
  let discountCents = 0;
  let couponCode: string | null = null;
  if (body.coupon) {
    const result = await validateCoupon(body.coupon, subtotalCents);
    if (result.ok) {
      discountCents = result.discountCents;
      couponCode = result.code;
    }
    // Cupom inválido: apenas ignora o desconto (não bloqueia a compra)
  }

  const settings = await getSettings();
  let shippingCents: number;
  if (subtotalCents >= settings.freeShippingCents) {
    shippingCents = 0;
  } else {
    const quote = body.cep
      ? quoteShipping(body.cep, subtotalCents, settings.freeShippingCents)
      : null;
    shippingCents = quote ? quote.cents : settings.defaultShippingCents;
  }
  const totalCents =
    Math.max(0, subtotalCents - discountCents) + shippingCents;

  const reference = `NL-${Date.now().toString(36).toUpperCase()}`;

  // Associa ao cliente logado, se houver
  const session = await getCustomerSession();
  const customer = session
    ? await prisma.customer.findUnique({ where: { id: session.id } })
    : null;

  // Monta o endereço de entrega (snapshot no pedido)
  let shippingAddress: string | null = null;
  if (customer?.address) {
    const line1 = [
      [customer.address, customer.number].filter(Boolean).join(", "),
      customer.complement,
    ]
      .filter(Boolean)
      .join(" - ");
    const line2 = [customer.neighborhood, customer.city && customer.state ? `${customer.city}/${customer.state}` : customer.city]
      .filter(Boolean)
      .join(" - ");
    const cepFmt = customer.cep
      ? `CEP ${customer.cep.replace(/(\d{5})(\d{3})/, "$1-$2")}`
      : "";
    shippingAddress = [line1, line2, cepFmt].filter(Boolean).join(" . ");
  }

  // Cria o pedido PENDENTE com snapshot de preços e custos
  const order = await prisma.order.create({
    data: {
      reference,
      status: "PENDENTE",
      customerId: customer?.id ?? null,
      customerName: customer?.name ?? "Cliente",
      customerEmail: customer?.email ?? "cliente@nutrilab.com.br",
      customerCpf: customer?.cpf ?? null,
      shippingAddress,
      subtotalCents,
      discountCents,
      couponCode,
      shippingCents,
      totalCents,
      costCents,
      items: {
        create: lineItems.map((li) => ({
          productId: li.product.id,
          name: li.product.name,
          quantity: li.quantity,
          priceCents: li.product.priceCents,
          costCents: li.product.costCents,
        })),
      },
    },
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  // Sem token do Mercado Pago: envia para a tela de pagamento local (demo)
  const mpToken = resolveMpToken(settings);
  if (!mpToken) {
    return NextResponse.json({
      initPoint: `${baseUrl}/checkout/pagamento?ref=${reference}`,
      reference,
      simulated: true,
    });
  }

  try {
    const { MercadoPagoConfig, Preference } = await import("mercadopago");
    const client = new MercadoPagoConfig({
      accessToken: mpToken,
    });
    const preference = new Preference(client);

    // O Checkout Pro não tem desconto de pedido: aplica o desconto
    // proporcionalmente ao preço unitario para o total bater.
    const factor =
      discountCents > 0 && subtotalCents > 0
        ? Math.max(0, subtotalCents - discountCents) / subtotalCents
        : 1;

    const result = await preference.create({
      body: {
        external_reference: reference,
        items: lineItems.map((li) => ({
          id: li.product.id,
          title: li.product.name,
          quantity: li.quantity,
          currency_id: "BRL",
          unit_price: Math.round(li.product.priceCents * factor) / 100,
        })),
        shipments:
          shippingCents > 0
            ? { cost: shippingCents / 100, mode: "not_specified" }
            : undefined,
        back_urls: {
          success: `${baseUrl}/checkout/sucesso?ref=${reference}`,
          failure: `${baseUrl}/checkout/erro?ref=${reference}`,
          pending: `${baseUrl}/checkout/pendente?ref=${reference}`,
        },
        auto_return: "approved",
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { mpPreferenceId: result.id },
    });

    return NextResponse.json({
      initPoint: result.init_point,
      reference,
    });
  } catch (err) {
    console.error("Erro Mercado Pago:", err);
    return NextResponse.json(
      { error: "Falha ao iniciar o pagamento." },
      { status: 502 },
    );
  }
}
