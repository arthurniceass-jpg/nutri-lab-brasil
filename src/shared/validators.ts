// Validação de CPF com digito verificador (não depende de servidor).
export function isValidCPF(raw: string): boolean {
  const c = String(raw ?? "").replace(/\D/g, "");
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(c[i]) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== Number(c[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(c[i]) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === Number(c[10]);
}

export function formatCPF(c: string): string {
  const d = String(c ?? "").replace(/\D/g, "");
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function formatCEP(c: string): string {
  const d = String(c ?? "").replace(/\D/g, "");
  return d.replace(/(\d{5})(\d{3})/, "$1-$2");
}
