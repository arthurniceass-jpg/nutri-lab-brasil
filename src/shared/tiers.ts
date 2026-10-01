// Níveis do programa de fidelidade NUTRI LAB (Level Up).
// Regras conforme o protótipo. Este módulo é a fonte única da verdade —
// quando a fase de backend chegar, o cálculo de pontos/tier deve importar daqui.

export type TierId = "bronze" | "prata" | "ouro" | "platina" | "diamante";

export type Tier = {
  id: TierId;
  nome: string;
  emoji: string;
  /** Cor de acento do nível (hex). */
  cor: string;
  /** Rótulo da faixa de pontos, para exibição. */
  faixa: string;
  /** Pontos acumulados mínimos para entrar no nível. */
  minPoints: number;
  beneficios: string[];
};

export const TIERS: Tier[] = [
  {
    id: "bronze",
    nome: "Bronze",
    emoji: "🥉",
    cor: "#F59E0B",
    faixa: "0–499 pontos",
    minPoints: 0,
    beneficios: [
      "1 ponto por real gasto",
      "100 pts = R$10 de desconto",
      "Cupom de aniversário",
    ],
  },
  {
    id: "prata",
    nome: "Prata",
    emoji: "🥈",
    cor: "#38BDF8",
    faixa: "500–1.199 pontos",
    minPoints: 500,
    beneficios: [
      "Frete grátis a partir de R$99",
      "Acesso a promoções 6h antes",
    ],
  },
  {
    id: "ouro",
    nome: "Ouro",
    emoji: "🥇",
    cor: "#FFD60A",
    faixa: "1.200–2.499 pontos",
    minPoints: 1200,
    beneficios: [
      "5% de desconto fixo",
      "Sachê de produto novo a cada 3 compras",
    ],
  },
  {
    id: "platina",
    nome: "Platina",
    emoji: "💎",
    cor: "#22D3EE",
    faixa: "2.500–6.999 pontos",
    minPoints: 2500,
    beneficios: [
      "10% de desconto fixo",
      "Prioridade nos eventos presenciais",
      "WhatsApp prioritário",
    ],
  },
  {
    id: "diamante",
    nome: "Diamante",
    emoji: "🖤",
    cor: "#F526B4",
    faixa: "7.000+ pontos",
    minPoints: 7000,
    beneficios: [
      "15% de desconto fixo (teto)",
      "Brinde completo todo mês",
      "Grupo fechado no WhatsApp",
      "Ingresso pago pra 1 evento por ano",
    ],
  },
];

export function getTier(id: TierId): Tier {
  const tier = TIERS.find((t) => t.id === id);
  if (!tier) throw new Error(`Tier desconhecido: ${id}`);
  return tier;
}

/** Deriva o nível a partir dos pontos acumulados (útil na fase de backend). */
export function tierForPoints(points: number): Tier {
  let current = TIERS[0];
  for (const t of TIERS) {
    if (points >= t.minPoints) current = t;
  }
  return current;
}
