import { ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const WORDS = ["Energia", "Foco", "Disciplina", "Evolução"];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* Faixa diagonal de assinatura */}
      <div
        aria-hidden
        className="absolute -right-32 top-0 h-full w-2/3 bg-gradient-to-l from-lime/10 to-transparent clip-nl"
      />
      <div className="container relative grid gap-10 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
        <div className="flex flex-col justify-center">
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-lime bg-lime px-3 py-1 dark:border-lime/40 dark:bg-lime/5">
            <Zap className="size-3.5 text-ink dark:text-lime" />
            <span className="font-mono text-xs uppercase tracking-widest text-ink dark:text-lime">
              Suplementos . Performance . Resultados
            </span>
          </div>

          <h1 className="display text-5xl leading-[0.9] text-foreground sm:text-6xl md:text-7xl lg:text-8xl">
            Treine como
            <br />
            um <span className="text-lime">laboratorio</span>
          </h1>

          <p className="mt-6 max-w-md text-balance text-lg text-muted-foreground">
            Suplementos de alta performance, 100% originais, formulados para
            quem não aceita o comum. Combustível para a sua evolução.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Button asChild size="lg">
              <a href="/catalogo">
                Ver produtos <ArrowRight className="size-5" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#categorias">Explorar categorias</a>
            </Button>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-3 gap-y-2">
            {WORDS.map((word, i) => (
              <li key={word} className="flex items-center gap-3">
                <span
                  className={`display text-2xl ${i === WORDS.length - 1 ? "text-lime" : "text-foreground/40"}`}
                >
                  {word}.
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative hidden items-center justify-center md:flex">
          <div className="clip-nl relative flex aspect-square w-full max-w-md items-center justify-center bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A]">
            <span className="display text-[14rem] leading-none">
              <span className="text-white">N</span>
              <span className="text-lime">L</span>
            </span>
            <div
              aria-hidden
              className="absolute inset-0 animate-pulse-lime rounded-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
