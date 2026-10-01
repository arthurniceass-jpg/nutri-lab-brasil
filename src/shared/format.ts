// Formatação em Real brasileiro (BRL) e pt-BR.
// Todos os valores monetarios trafegam em centavos (inteiros).

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const brlNoSymbol = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compact = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

const pct = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatBRL(cents: number): string {
  return brl.format(cents / 100);
}

export function formatBRLValue(cents: number): string {
  return brlNoSymbol.format(cents / 100);
}

export function formatCompactBRL(cents: number): string {
  return compact.format(cents / 100);
}

export function formatPercent(ratio: number): string {
  return pct.format(ratio);
}

// Variação percentual com sinal explicito (ex.: +12,4%)
export function formatDelta(ratio: number): string {
  const sign = ratio > 0 ? "+" : "";
  return sign + pct.format(ratio);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

// Máscara de CPF: aplica 000.000.000-00 conforme os digitos vão sendo digitados.
export function maskCpf(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  let out = d.slice(0, 3);
  if (d.length > 3) out += "." + d.slice(3, 6);
  if (d.length > 6) out += "." + d.slice(6, 9);
  if (d.length > 9) out += "-" + d.slice(9, 11);
  return out;
}

// Máscara de CEP: aplica 00000-000 conforme os digitos vão sendo digitados.
export function maskCep(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? d.slice(0, 5) + "-" + d.slice(5) : d;
}

// Parcelamento sem juros (padrão: até 12x, parcela minima de R$ 30)
export function installments(
  totalCents: number,
  maxParts = 12,
  minPartCents = 3000,
): { parts: number; partCents: number } {
  let parts = maxParts;
  while (parts > 1 && totalCents / parts < minPartCents) {
    parts -= 1;
  }
  return { parts, partCents: Math.round(totalCents / parts) };
}
