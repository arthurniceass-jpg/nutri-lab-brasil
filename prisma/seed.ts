import {
  PrismaClient,
  type Category,
  type OrderStatus,
  type Product,
} from "@prisma/client";

const prisma = new PrismaClient();

// Placeholder on-brand (preto + verde-limao). Troque pelas fotos reais depois.
function img(text: string) {
  return `https://placehold.co/600x600/0A0A0A/C2EE3E/png?text=${encodeURIComponent(text)}`;
}

type Seed = {
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  costCents: number;
  category: Category;
  rating: number;
  reviews: number;
  stock: number;
  flavor?: string;
  weight?: string;
  featured?: boolean;
};

const PRODUCTS: Seed[] = [
  // PROTEINAS
  { slug: "whey-protein-lab-900g", name: "Whey Protein Lab", description: "Whey concentrado de alta pureza com 24g de proteina por dose.", priceCents: 14990, costCents: 7800, category: "PROTEINAS", rating: 4.9, reviews: 1284, stock: 60, flavor: "Chocolate", weight: "900g", featured: true },
  { slug: "whey-isolado-zero-900g", name: "Whey Isolado Zero", description: "Proteina isolada, baixo carboidrato, absorcao rapida.", priceCents: 19990, costCents: 11200, category: "PROTEINAS", rating: 4.8, reviews: 932, stock: 35, flavor: "Baunilha", weight: "900g", featured: true },
  { slug: "albumina-pura-500g", name: "Albumina Pura", description: "Proteina da clara do ovo, liberacao gradual.", priceCents: 6990, costCents: 3200, category: "PROTEINAS", rating: 4.6, reviews: 410, stock: 9, weight: "500g" },
  { slug: "veggie-protein-700g", name: "Veggie Protein", description: "Blend vegetal de ervilha e arroz, 100% vegano.", priceCents: 16990, costCents: 9100, category: "PROTEINAS", rating: 4.7, reviews: 286, stock: 24, flavor: "Cacau", weight: "700g" },

  // CREATINA
  { slug: "creatina-monohidratada-300g", name: "Creatina Monohidratada", description: "Creatina pura 100% monohidratada, micronizada.", priceCents: 9990, costCents: 4200, category: "CREATINA", rating: 4.9, reviews: 2103, stock: 80, weight: "300g", featured: true },
  { slug: "creatina-creapure-250g", name: "Creatina Creapure", description: "Creatina premium com selo de pureza Creapure.", priceCents: 13990, costCents: 6800, category: "CREATINA", rating: 4.9, reviews: 877, stock: 7, weight: "250g" },

  // PRE_TREINO
  { slug: "pre-treino-blackout-300g", name: "Pre-treino Blackout", description: "Energia explosiva com cafeina, beta-alanina e citrulina.", priceCents: 12990, costCents: 5600, category: "PRE_TREINO", rating: 4.7, reviews: 1542, stock: 40, flavor: "Frutas Vermelhas", weight: "300g", featured: true },
  { slug: "pre-treino-focus-200g", name: "Pre-treino Focus", description: "Foco e disciplina sem crash, com nootropicos.", priceCents: 11990, costCents: 5100, category: "PRE_TREINO", rating: 4.6, reviews: 638, stock: 18, flavor: "Limao", weight: "200g" },
  { slug: "cafeina-200mg-120caps", name: "Cafeina 200mg", description: "Cafeina anidra em capsulas para energia e foco.", priceCents: 4990, costCents: 1900, category: "PRE_TREINO", rating: 4.5, reviews: 522, stock: 5 },

  // AMINOACIDOS
  { slug: "bcaa-21-300g", name: "BCAA 2:1:1", description: "Aminoacidos de cadeia ramificada para recuperacao.", priceCents: 8990, costCents: 3800, category: "AMINOACIDOS", rating: 4.6, reviews: 744, stock: 30, flavor: "Maracuja", weight: "300g" },
  { slug: "glutamina-pura-300g", name: "Glutamina Pura", description: "L-glutamina para recuperacao e imunidade.", priceCents: 7990, costCents: 3400, category: "AMINOACIDOS", rating: 4.7, reviews: 489, stock: 22, weight: "300g" },
  { slug: "beta-alanina-200g", name: "Beta-Alanina", description: "Reduz a fadiga muscular e aumenta a resistencia.", priceCents: 6990, costCents: 2900, category: "AMINOACIDOS", rating: 4.5, reviews: 233, stock: 16, weight: "200g" },

  // VITAMINAS
  { slug: "multivitaminico-90caps", name: "Multivitaminico Lab", description: "Complexo completo de vitaminas e minerais diarios.", priceCents: 5990, costCents: 2300, category: "VITAMINAS", rating: 4.8, reviews: 901, stock: 50, featured: true },
  { slug: "omega-3-120caps", name: "Omega 3 TG", description: "Oleo de peixe rico em EPA e DHA, alta concentracao.", priceCents: 8990, costCents: 3700, category: "VITAMINAS", rating: 4.8, reviews: 612, stock: 28 },
  { slug: "vitamina-d3-60caps", name: "Vitamina D3 2000UI", description: "Suporte imunologico e saude ossea.", priceCents: 3990, costCents: 1400, category: "VITAMINAS", rating: 4.7, reviews: 388, stock: 11 },
  { slug: "zma-90caps", name: "ZMA", description: "Zinco, magnesio e vitamina B6 para sono e recuperacao.", priceCents: 5490, costCents: 2100, category: "VITAMINAS", rating: 4.6, reviews: 274, stock: 19 },

  // EMAGRECEDORES
  { slug: "termogenico-cut-60caps", name: "Termogenico Cut", description: "Acelera o metabolismo e auxilia na queima de gordura.", priceCents: 7990, costCents: 3100, category: "EMAGRECEDORES", rating: 4.4, reviews: 567, stock: 26, featured: true },
  { slug: "l-carnitina-2000-480ml", name: "L-Carnitina 2000", description: "Transporte de gordura para energia, liquido.", priceCents: 6490, costCents: 2600, category: "EMAGRECEDORES", rating: 4.5, reviews: 341, stock: 14, flavor: "Tangerina", weight: "480ml" },
  { slug: "cafeina-verde-60caps", name: "Cafe Verde", description: "Extrato de cafe verde para controle de apetite.", priceCents: 5490, costCents: 2000, category: "EMAGRECEDORES", rating: 4.3, reviews: 198, stock: 4 },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log("Limpando dados antigos...");
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();

  console.log("Inserindo produtos...");
  const created: Product[] = [];
  for (const p of PRODUCTS) {
    const product = await prisma.product.create({
      data: { ...p, image: img(p.name) },
    });
    created.push(product);
  }

  console.log("Inserindo cupons...");
  const coupons = [
    { code: "PRIMEIRA10", type: "PERCENT" as const, value: 10, minSubtotalCents: 0 },
    { code: "NUTRI15", type: "PERCENT" as const, value: 15, minSubtotalCents: 20000 },
    { code: "BLACK20", type: "PERCENT" as const, value: 20, minSubtotalCents: 0 },
    { code: "ATLETA50", type: "FIXED" as const, value: 5000, minSubtotalCents: 30000 },
  ];
  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }

  // Pedidos de demonstracao SO quando SEED_DEMO_ORDERS=1 (nunca em producao).
  if (process.env.SEED_DEMO_ORDERS !== "1") {
    console.log("Produtos e cupons criados (sem pedidos de demonstracao).");
    return;
  }

  console.log("Gerando historico de pedidos (12 meses)...");
  const statuses: OrderStatus[] = ["PAGO", "PAGO", "PAGO", "ENTREGUE", "ENVIADO", "PENDENTE", "CANCELADO"];
  const now = new Date();
  let seq = 0;

  for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
    // Volume crescente ao longo do tempo (com leve sazonalidade)
    const base = 14 + (11 - monthsAgo) * 3;
    const orderCount = base + randInt(-3, 5);

    for (let i = 0; i < orderCount; i++) {
      const day = randInt(1, 27);
      const createdAt = new Date(
        now.getFullYear(),
        now.getMonth() - monthsAgo,
        day,
        randInt(8, 21),
        randInt(0, 59),
      );

      const itemCount = randInt(1, 3);
      const chosen = new Map<string, number>();
      for (let k = 0; k < itemCount; k++) {
        const prod = pick(created);
        chosen.set(prod.id, (chosen.get(prod.id) ?? 0) + randInt(1, 2));
      }

      let subtotal = 0;
      let cost = 0;
      const items = [...chosen.entries()].map(([productId, quantity]) => {
        const prod = created.find((c) => c.id === productId)!;
        subtotal += prod.priceCents * quantity;
        cost += prod.costCents * quantity;
        return {
          productId,
          name: prod.name,
          quantity,
          priceCents: prod.priceCents,
          costCents: prod.costCents,
        };
      });

      const shipping = subtotal >= 19900 ? 0 : 2490;
      const total = subtotal + shipping;
      seq += 1;

      await prisma.order.create({
        data: {
          reference: `NL-${createdAt.getFullYear()}${String(seq).padStart(4, "0")}`,
          status: pick(statuses),
          customerName: pick([
            "Joao Silva", "Maria Souza", "Pedro Alves", "Ana Costa",
            "Lucas Lima", "Carla Dias", "Rafael Gomes", "Bia Martins",
            "Diego Rocha", "Fernanda Reis",
          ]),
          customerEmail: "cliente@nutrilab.com.br",
          subtotalCents: subtotal,
          shippingCents: shipping,
          totalCents: total,
          costCents: cost,
          createdAt,
          items: { create: items },
        },
      });
    }
  }

  const totalOrders = await prisma.order.count();
  console.log(`Pronto. ${created.length} produtos e ${totalOrders} pedidos criados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
