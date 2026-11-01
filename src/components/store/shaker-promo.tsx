import Link from "next/link";
import { FlaskConical } from "lucide-react";

// Chamada na home para a página /shaker.
export function ShakerPromo() {
  return (
    <section className="container py-10">
      <div className="flex flex-col items-start gap-4 rounded-lg border border-lime/40 bg-lime/5 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-lime/15">
            <FlaskConical className="size-6 text-lime" aria-hidden />
          </div>
          <div>
            <p className="font-mono text-xs uppercase leading-none tracking-widest text-lime">
              Novo no laboratório
            </p>
            <h2 className="display mt-2 text-3xl leading-[1.05] text-foreground md:text-4xl">
              Monte seu <span className="text-lime">shaker</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Escolha seu objetivo, monte o stack, veja o pó virar shake e leve a rotina do dia.
            </p>
          </div>
        </div>
        <Link
          href="/shaker"
          className="flex h-12 shrink-0 items-center justify-center rounded-md bg-lime px-6 font-bold uppercase tracking-wide text-ink transition-colors hover:bg-lime-glow"
        >
          Montar meu stack
        </Link>
      </div>
    </section>
  );
}
