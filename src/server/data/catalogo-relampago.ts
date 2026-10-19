// Catálogo Relâmpago (pré-venda) — fonte: Nutri_Lab_Catalogo_Com_Sabores_Whey_Atualizado.pdf
// Preço = valor atual (o "de" riscado do PDF fica em `fromCents`, só para referência).
// Fotos: extraídas do próprio PDF e melhoradas, em /public/products/<slug>.webp.
// Custo e estoque são padrões da importação: o PDF não informa custo — preencher o custo real no painel.
// Textos: só usam o que está no PDF e nas embalagens das fotos; números de nutrição ficam no rótulo.
import type { Category } from "@prisma/client";

export const IMPORT_STOCK = 10;
export const IMPORT_COST_CENTS = 0;

export type CatalogoItem = {
  slug: string;
  name: string;
  weight: string | null;
  flavor: string | null;
  category: Category;
  priceCents: number;
  /** Preço antigo (riscado no PDF). Não é gravado no banco. */
  fromCents?: number;
  description: string;
  usage: string;
};

const PREVENDA =
  "Pré-venda Nutri Lab: consulte a disponibilidade, o sabor e o prazo de entrega antes de finalizar a compra.";
const AVISO =
  "Imagem ilustrativa. As informações nutricionais, os ingredientes e os alérgenos constam no rótulo do fabricante. Suplemento alimentar não substitui uma alimentação equilibrada e variada; consulte um nutricionista ou médico antes de usar.";

const USO_WHEY =
  "Misture a porção indicada no rótulo em água ou leite, em um shaker, e consuma após o treino ou ao longo do dia, conforme a orientação do seu nutricionista.";
const USO_CREATINA =
  "Misture a porção indicada no rótulo em água ou suco e consuma diariamente. A regularidade do consumo é mais importante que o horário.";
const USO_PRE =
  "Misture a porção indicada no rótulo em água, normalmente de 20 a 30 minutos antes do treino. Costuma conter estimulantes: evite o consumo à noite e não exceda a porção do rótulo.";
const USO_COMBO =
  "Siga a porção e o modo de preparo indicados no rótulo de cada produto do combo. O whey pode ser consumido após o treino ou ao longo do dia; a creatina, diariamente.";

const d = (...paragraphs: string[]) => paragraphs.join("\n\n");

export const CATALOGO_RELAMPAGO: CatalogoItem[] = [
  // WHEY
  {
    slug: "whey-blend-soldiers-900g",
    name: "Whey Blend Soldiers",
    weight: "900 g",
    flavor: "Chocolate",
    category: "PROTEINAS",
    priceCents: 8775,
    usage: USO_WHEY,
    description: d(
      "O Whey Blend Soldiers, da Soldiers Nutrition, é um suplemento de proteínas do soro do leite em pó, na embalagem de 900 g e no sabor Chocolate.",
      "A versão blend reúne diferentes tipos de proteína do soro do leite em uma só fórmula, uma forma prática de complementar a ingestão diária de proteínas de quem treina. A composição exata e a quantidade de proteína por porção estão no rótulo.",
      PREVENDA,
      AVISO,
    ),
  },
  {
    slug: "whey-basic-growth-1kg",
    name: "Whey Basic Growth",
    weight: "1 kg",
    flavor: "Natural, Chocolate, Baunilha e Morango",
    category: "PROTEINAS",
    priceCents: 9436,
    fromCents: 10420,
    usage: USO_WHEY,
    description: d(
      "O Whey Basic Growth, da Growth Supplements, é um suplemento de proteína do soro do leite em pó, na embalagem de 1 kg. Está disponível nos sabores Natural, Chocolate, Baunilha e Morango.",
      "Uma opção prática para complementar a alimentação e ajudar a atingir a meta diária de proteínas, no café da manhã, no pós-treino ou entre as refeições. Confirme o sabor desejado ao finalizar o pedido.",
      PREVENDA,
      AVISO,
    ),
  },
  {
    slug: "whey-black-skull-900g",
    name: "Whey Black Skull",
    weight: "900 g",
    flavor: "Chocolate",
    category: "PROTEINAS",
    priceCents: 9436,
    fromCents: 10400,
    usage: USO_WHEY,
    description: d(
      "O Whey Black Skull, da linha Whey 100% HD, é um suplemento de proteína do soro do leite em pó, no pote de 900 g e no sabor Chocolate.",
      "Pensado para complementar a ingestão de proteínas de quem pratica musculação e outras atividades físicas, com um sabor de chocolate fácil de incluir na rotina. A tabela nutricional completa está no rótulo do fabricante.",
      PREVENDA,
      AVISO,
    ),
  },
  {
    slug: "whey-basic-max-titanium-1kg",
    name: "Whey Basic Max Titanium",
    weight: "1 kg",
    flavor: "Baunilha",
    category: "PROTEINAS",
    priceCents: 18000,
    usage: USO_WHEY,
    description: d(
      "O Whey Pro da Max Titanium é um suplemento de proteína do soro do leite em pó, no pote de 1 kg e no sabor Baunilha.",
      "A Max Titanium é uma das marcas mais conhecidas do suplemento esportivo no Brasil. O whey é uma forma prática de complementar o consumo diário de proteínas, no pós-treino ou ao longo do dia. As informações de porção e de composição estão no rótulo.",
      PREVENDA,
      AVISO,
    ),
  },
  {
    slug: "whey-100-bodyaction-900g",
    name: "Whey 100% BodyAction",
    weight: "900 g",
    flavor: "Doce de leite, Morango, Baunilha e Chocolate",
    category: "PROTEINAS",
    priceCents: 16595,
    usage: USO_WHEY,
    description: d(
      "O Whey 100% BodyAction (Whey Prime), da BodyAction, é um suplemento de proteína do soro do leite em pó, na embalagem de 900 g. Está disponível nos sabores Doce de leite, Morango, Baunilha e Chocolate.",
      "Com quatro sabores para escolher, é uma opção para quem quer variar na hora do shake e complementar a ingestão de proteínas na rotina de treino. Confirme o sabor desejado ao finalizar o pedido.",
      PREVENDA,
      AVISO,
    ),
  },
  {
    slug: "whey-isolado-3vs-900g",
    name: "Whey Isolado 3VS",
    weight: "900 g",
    flavor: "Baunilha",
    category: "PROTEINAS",
    priceCents: 6770,
    fromCents: 8590,
    usage: USO_WHEY,
    description: d(
      "O Whey Isolado (Isolated Protein) da 3VS Nutrition é um suplemento de proteína isolada do soro do leite em pó, no pote de 900 g e no sabor Baunilha.",
      "O whey isolado passa por uma filtragem adicional e, em geral, concentra mais proteína e menos lactose, gordura e carboidratos por porção do que o whey concentrado. Confira os valores exatos no rótulo.",
      PREVENDA,
      AVISO,
    ),
  },
  // CREATINA
  {
    slug: "creatina-soldiers-1kg",
    name: "Creatina Soldiers",
    weight: "1 kg",
    flavor: null,
    category: "CREATINA",
    priceCents: 8505,
    fromCents: 9229,
    usage: USO_CREATINA,
    description: d(
      "A Creatina Soldiers, da Soldiers Nutrition, é um suplemento de creatina monohidratada em pó, 100% pura, na embalagem econômica de 1 kg.",
      "A creatina monohidratada é uma das formas de creatina mais estudadas e usadas por quem treina, associada ao suporte do desempenho em exercícios de alta intensidade e curta duração. Como o consumo é diário, a embalagem de 1 kg rende por bastante tempo.",
      PREVENDA,
      AVISO,
    ),
  },
  {
    slug: "creatina-soldiers-500g",
    name: "Creatina Soldiers",
    weight: "500 g",
    flavor: null,
    category: "CREATINA",
    priceCents: 6000,
    usage: USO_CREATINA,
    description: d(
      "A Creatina Soldiers, da Soldiers Nutrition, é um suplemento de creatina monohidratada em pó, 100% pura, na embalagem de 500 g.",
      "A creatina monohidratada é uma das formas de creatina mais estudadas e usadas por quem treina, associada ao suporte do desempenho em exercícios de alta intensidade e curta duração. Ótima para quem quer começar ou manter o consumo diário sem comprar uma embalagem grande.",
      PREVENDA,
      AVISO,
    ),
  },
  {
    slug: "creatina-monohidratada-250g",
    name: "Creatina monohidratada",
    weight: "250 g",
    flavor: null,
    category: "CREATINA",
    priceCents: 4450,
    usage: USO_CREATINA,
    description: d(
      "Creatina monohidratada em pó (nova fórmula), da Growth Supplements, com peso líquido de 250 g, conforme a embalagem da foto.",
      "A creatina monohidratada é uma das formas de creatina mais estudadas e usadas por quem treina, associada ao suporte do desempenho em exercícios de alta intensidade e curta duração.",
      PREVENDA,
      AVISO,
    ),
  },
  {
    slug: "creatina-integralmedica-300g",
    name: "Creatina Integralmedica",
    weight: "300 g",
    flavor: null,
    category: "CREATINA",
    priceCents: 7846,
    fromCents: 8795,
    usage: USO_CREATINA,
    description: d(
      "A Creatina Hardcore da Integralmedica é um suplemento de creatina monohidratada em pó, no pote de 300 g.",
      "A Integralmedica é uma marca tradicional do mercado de suplementos no Brasil. A creatina monohidratada é uma das formas de creatina mais estudadas e usadas por quem treina, associada ao suporte do desempenho em exercícios de alta intensidade e curta duração.",
      PREVENDA,
      AVISO,
    ),
  },
  {
    slug: "creatina-black-skull-500g",
    name: "Creatina Black Skull",
    weight: "500 g",
    flavor: null,
    category: "CREATINA",
    priceCents: 5120,
    fromCents: 6000,
    usage: USO_CREATINA,
    description: d(
      "A Creatina Creator, da Black Skull, é um suplemento de creatina em pó, na embalagem de 500 g (sem sabor, conforme a embalagem).",
      "Uma opção para incluir a creatina na rotina diária de treino, com embalagem de 500 g que rende bastante. Confira a porção e as informações nutricionais no rótulo.",
      PREVENDA,
      AVISO,
    ),
  },
  {
    slug: "creatina-monohidratada-bodyaction",
    name: "Creatina monohidratada BodyAction",
    weight: null,
    flavor: null,
    category: "CREATINA",
    priceCents: 5827,
    fromCents: 7195,
    usage: USO_CREATINA,
    description: d(
      "A Creatina Monohidratada da BodyAction é um suplemento de creatina em pó, 100% pura, conforme a embalagem da foto.",
      "A creatina monohidratada é uma das formas de creatina mais estudadas e usadas por quem treina, associada ao suporte do desempenho em exercícios de alta intensidade e curta duração. O peso líquido e a porção estão informados no rótulo.",
      PREVENDA,
      AVISO,
    ),
  },
  // PRÉ-TREINO
  {
    slug: "pre-treino-integralmedica-300g",
    name: "Pré-treino Integralmedica",
    weight: "300 g",
    flavor: null,
    category: "PRE_TREINO",
    priceCents: 13020,
    fromCents: 14580,
    usage: USO_PRE,
    description: d(
      "O Pré-treino Prime, da Integralmedica, é um suplemento em pó para consumir antes do treino, no pote de 300 g.",
      "Pré-treinos são formulados para ser tomados antes da atividade física, e costumam trazer estimulantes como a cafeína. Confira no rótulo a lista de ingredientes, a quantidade de cada um e as advertências antes de consumir.",
      PREVENDA,
      AVISO,
    ),
  },
  {
    slug: "pre-treino-soldiers-300g",
    name: "Pré-treino Soldiers",
    weight: "300 g",
    flavor: null,
    category: "PRE_TREINO",
    priceCents: 5090,
    fromCents: 7890,
    usage: USO_PRE,
    description: d(
      "O Pré-treino Evolution, da Soldiers Nutrition, é um suplemento em pó para consumir antes do treino, no pote de 300 g.",
      "Pré-treinos são formulados para ser tomados antes da atividade física, e costumam trazer estimulantes como a cafeína. Confira no rótulo a lista de ingredientes, a quantidade de cada um e as advertências antes de consumir.",
      PREVENDA,
      AVISO,
    ),
  },
  {
    slug: "pre-treino-raze-dark-lab-300g",
    name: "Pré-treino Raze Dark Lab",
    weight: "300 g",
    flavor: null,
    category: "PRE_TREINO",
    priceCents: 9296,
    usage: USO_PRE,
    description: d(
      "O Raze, da Dark Lab, é um pré-treino em pó (\"Underground Pre Workout\", conforme a embalagem), no pote de 300 g.",
      "Pré-treinos são formulados para ser tomados antes da atividade física, e costumam trazer estimulantes como a cafeína. Confira no rótulo a lista de ingredientes, a quantidade de cada um e as advertências antes de consumir.",
      PREVENDA,
      AVISO,
    ),
  },
  {
    slug: "pre-treino-nuclear-rush-bodyaction-300g",
    name: "Pré-treino Nuclear Rush BodyAction",
    weight: "300 g",
    flavor: null,
    category: "PRE_TREINO",
    priceCents: 6275,
    fromCents: 7880,
    usage: USO_PRE,
    description: d(
      "O Nuclear Rush, da BodyAction, é um pré-treino em pó (\"Pre-workout powder\", conforme a embalagem), no pote de 300 g.",
      "Pré-treinos são formulados para ser tomados antes da atividade física, e costumam trazer estimulantes como a cafeína. Confira no rótulo a lista de ingredientes, a quantidade de cada um e as advertências antes de consumir.",
      PREVENDA,
      AVISO,
    ),
  },
  {
    slug: "pre-treino-ilegal-pump-3vs-300g",
    name: "Pré-treino Illegal Pump 3VS",
    weight: "300 g",
    flavor: null,
    category: "PRE_TREINO",
    priceCents: 7558,
    fromCents: 8499,
    usage: USO_PRE,
    description: d(
      "O Illegal Pump, da 3VS Nutrition, é um pré-treino em pó, no pote de 300 g.",
      "Pré-treinos são formulados para ser tomados antes da atividade física, e costumam trazer estimulantes como a cafeína. Confira no rótulo a lista de ingredientes, a quantidade de cada um e as advertências antes de consumir.",
      PREVENDA,
      AVISO,
    ),
  },
  // COMBOS (a loja não tem categoria "combo": ficam em Proteínas)
  {
    slug: "combo-whey-primal-soldiers-1kg-creatina-soldiers-500g",
    name: "Combo Whey Primal Soldiers 1 kg + Creatina Soldiers 500 g",
    weight: null,
    flavor: "Whey: Baunilha, Chocolate Belga, Banana, Morango e Beijinho",
    category: "PROTEINAS",
    priceCents: 15213,
    fromCents: 19760,
    usage: USO_COMBO,
    description: d(
      "Combo da Soldiers Nutrition com dois produtos: o Whey Primal Soldiers de 1 kg e a Creatina Soldiers de 500 g.",
      "O whey está disponível nos sabores Baunilha, Chocolate Belga, Banana, Morango e Beijinho; a creatina é monohidratada, 100% pura. Juntos, formam uma dupla clássica de quem treina: proteína para a alimentação e creatina para o consumo diário, por um preço menor do que comprar separado.",
      PREVENDA,
      AVISO,
    ),
  },
  {
    slug: "combo-whey-creatina",
    name: "Combo Whey + Creatina",
    weight: null,
    flavor: null,
    category: "PROTEINAS",
    priceCents: 12590,
    fromCents: 14715,
    usage: USO_COMBO,
    description: d(
      "Combo com um whey e uma creatina. Na foto, o Whey Basic Growth de 1 kg e a Creatina da Growth Supplements.",
      "Uma combinação prática para quem quer proteína para a alimentação e creatina para o consumo diário, por um preço menor do que comprar separado. Sabores e detalhes do combo: confirme com a Nutri Lab antes de finalizar a compra.",
      PREVENDA,
      AVISO,
    ),
  },
  {
    slug: "combo-whey-iso-probiotica-900g-creatina-300g",
    name: "Combo Whey ISO Probiótica 900 g + Creatina 300 g",
    weight: null,
    flavor: "Whey: Chocolate",
    category: "PROTEINAS",
    priceCents: 17740,
    fromCents: 19710,
    usage: USO_COMBO,
    description: d(
      "Combo da Probiótica com o ISO Protein Blend de 900 g (sabor Chocolate) e a creatina de 300 g (Mix Pro Creatine, conforme a embalagem da foto).",
      "O ISO Protein Blend é um whey que combina proteínas do soro do leite, e a creatina completa a dupla para o consumo diário. BRINDE: squeeze azul-marinho de 600 ml na compra do combo.",
      PREVENDA,
      AVISO,
    ),
  },
];
