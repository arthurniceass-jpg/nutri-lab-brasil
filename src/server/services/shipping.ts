// Estimativa de frete por região do CEP (primeiro digito define a região no Brasil).
// Simplificação realista: cada região tem um preço e um prazo.
// O frete grátis acima do limite continua valendo (tratado no checkout).

type Region = { uf: string; label: string; cents: number; days: number };

const REGIONS: Record<string, Region> = {
  "0": { uf: "SP", label: "Grande São Paulo", cents: 1990, days: 2 },
  "1": { uf: "SP/interior", label: "Interior de SP", cents: 2490, days: 3 },
  "2": { uf: "RJ/ES", label: "Rio de Janeiro e ES", cents: 2990, days: 4 },
  "3": { uf: "MG", label: "Minas Gerais", cents: 2990, days: 4 },
  "4": { uf: "BA/SE", label: "Bahia e Sergipe", cents: 3990, days: 6 },
  "5": { uf: "PE/AL/PB/RN", label: "Nordeste", cents: 4290, days: 7 },
  "6": { uf: "CE/PI/MA/PA/AM", label: "Norte e Nordeste", cents: 4590, days: 8 },
  "7": { uf: "DF/GO/TO/MT/MS", label: "Centro-Oeste", cents: 3490, days: 5 },
  "8": { uf: "PR/SC", label: "Parana e Santa Catarina", cents: 2990, days: 4 },
  "9": { uf: "RS", label: "Rio Grande do Sul", cents: 3290, days: 5 },
};

export type ShippingQuote = {
  cents: number;
  days: number;
  region: string;
  free: boolean;
};

// Calcula o frete para um CEP e subtotal. Retorna null se o CEP for inválido.
export function quoteShipping(
  cepRaw: string,
  subtotalCents: number,
  freeShippingCents: number,
): ShippingQuote | null {
  const cep = String(cepRaw ?? "").replace(/\D/g, "");
  if (cep.length < 8) return null;
  const region = REGIONS[cep[0]] ?? REGIONS["1"];
  const free = subtotalCents >= freeShippingCents;
  return {
    cents: free ? 0 : region.cents,
    days: region.days,
    region: region.label,
    free,
  };
}
