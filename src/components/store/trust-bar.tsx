import { ShieldCheck, BadgeCheck, Truck, HeartPulse } from "lucide-react";

const ITEMS = [
  {
    icon: ShieldCheck,
    title: "Suplementos de qualidade",
    desc: "Marcas auditadas e lacradas",
  },
  {
    icon: BadgeCheck,
    title: "Produtos 100% originais",
    desc: "Nota fiscal e procedencia",
  },
  {
    icon: Truck,
    title: "Envio rápido para todo Brasil",
    desc: "Frete grátis acima de R$ 199",
  },
  {
    icon: HeartPulse,
    title: "Seu melhor estilo de vida",
    desc: "Performance e saúde juntas",
  },
];

export function TrustBar() {
  return (
    <section id="confianca" className="border-b border-border bg-carbon">
      <div className="container grid grid-cols-2 gap-px overflow-hidden lg:grid-cols-4">
        {ITEMS.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="flex items-start gap-3 px-4 py-6 lime-edge"
          >
            <Icon className="mt-0.5 size-6 shrink-0 text-lime" aria-hidden />
            <div>
              <p className="text-sm font-bold uppercase leading-tight tracking-wide text-foreground">
                {title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
