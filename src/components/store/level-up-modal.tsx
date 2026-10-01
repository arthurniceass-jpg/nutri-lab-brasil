"use client";

import { useEffect, useMemo, useRef } from "react";
import { Check, X } from "lucide-react";
import { TIERS, type Tier, type TierId } from "@/shared/tiers";
import { Button } from "@/components/ui/button";

type Props = {
  /** Nível a exibir. `null` mantém o modal fechado. */
  tier: Tier | TierId | null;
  onClose: () => void;
  /** Texto do botão principal (padrão: "Ver meus benefícios"). */
  ctaLabel?: string;
  onCta?: () => void;
};

const CONFETTI_COUNT = 42;

export function LevelUpModal({ tier, onClose, ctaLabel = "Ver meus benefícios", onCta }: Props) {
  const resolved: Tier | null =
    typeof tier === "string" ? TIERS.find((t) => t.id === tier) ?? null : tier;
  const open = resolved !== null;

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // ESC para fechar, trava o scroll do fundo e joga o foco pro modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  // Confete gerado no cliente (evita mismatch de hidratação), refeito por nível.
  const pieces = useMemo(() => {
    if (!resolved) return [];
    const palette = [resolved.cor, "#ffffff", "#C2EE3E"];
    return Array.from({ length: CONFETTI_COUNT }, (_, n) => ({
      left: Math.random() * 100,
      bg: palette[n % palette.length],
      duration: 1.2 + Math.random(),
      delay: Math.random() * 0.35,
      rotate: 220 + Math.random() * 200,
    }));
  }, [resolved]);

  if (!resolved) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="levelup-title"
      aria-describedby="levelup-sub"
      ref={dialogRef}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm animate-in fade-in-0 duration-300"
    >
      <div
        style={{ borderColor: resolved.cor, boxShadow: `0 0 70px -12px ${resolved.cor}` }}
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border-[1.5px] bg-gradient-to-b from-carbon to-ink p-8 pt-10 text-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-500"
      >
        {/* Confete */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {pieces.map((p, i) => (
            <span
              key={i}
              className="nl-confetti-piece absolute top-[-12%] block h-3.5 w-2 rounded-[2px]"
              style={
                {
                  left: `${p.left}%`,
                  background: p.bg,
                  animationDuration: `${p.duration}s`,
                  animationDelay: `${p.delay}s`,
                  "--nl-rot": `${p.rotate}deg`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        {/* Fechar */}
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" />
        </button>

        {/* Badge */}
        <div
          style={{
            background: `radial-gradient(circle at 35% 30%, #ffffff55, transparent 60%), ${resolved.cor}`,
            boxShadow: `0 0 34px ${resolved.cor}`,
          }}
          className="relative mx-auto mb-5 flex size-24 items-center justify-center rounded-full text-5xl motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-500"
        >
          <span aria-hidden>{resolved.emoji}</span>
        </div>

        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
          Você subiu de nível
        </p>
        <h2
          id="levelup-title"
          style={{ color: resolved.cor }}
          className="font-display text-4xl uppercase leading-none"
        >
          {resolved.nome}
        </h2>
        <p id="levelup-sub" className="mt-1.5 text-sm text-muted-foreground">
          Você já está na faixa {resolved.faixa}
        </p>

        {/* Benefícios */}
        <ul className="relative mt-6 space-y-0 text-left">
          {resolved.beneficios.map((b, i) => (
            <li
              key={b}
              style={{ animationDelay: `${0.15 + i * 0.09}s` }}
              className="flex items-start gap-2.5 border-b border-white/10 py-2.5 text-sm text-foreground last:border-b-0 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:fill-mode-both"
            >
              <Check className="mt-0.5 size-4 shrink-0" style={{ color: resolved.cor }} />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <Button
          onClick={onCta ?? onClose}
          className="mt-6 w-full font-bold"
          style={{ background: resolved.cor, color: "#0A0A0A" }}
        >
          {ctaLabel}
        </Button>
        <button
          onClick={onClose}
          className="mt-2.5 text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
        >
          continuar comprando
        </button>
      </div>

      {/* Keyframe do confete (auto-contido; some com prefers-reduced-motion). */}
      <style>{`
        @keyframes nl-confetti-fall {
          to { transform: translateY(520px) rotate(var(--nl-rot, 320deg)); opacity: 0; }
        }
        .nl-confetti-piece {
          animation-name: nl-confetti-fall;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .nl-confetti-piece { display: none; }
        }
      `}</style>
    </div>
  );
}
