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
    desc: "Nota fiscal e procedência",
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
    <section
      id="confianca"
      className="flex min-h-[70vh] scroll-mt-16 items-center border-b border-border bg-carbon py-16"
    >
      <div className="container">
        <p className="font-mono text-xs uppercase leading-none tracking-widest text-lime">
          Por que nós
        </p>
        <h2 className="display mt-2 text-4xl text-foreground md:text-5xl">
          Compre com <span className="text-lime">confiança</span>
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-lg border border-border bg-card p-6 lime-edge"
            >
              <Icon className="size-9 text-lime" aria-hidden />
              <p className="mt-5 text-base font-bold uppercase leading-tight tracking-wide text-foreground">
                {title}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
