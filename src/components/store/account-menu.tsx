"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, ChevronDown, Sparkles, Package, LogOut, LogIn } from "lucide-react";
import { TIERS, tierForPoints, type TierId } from "@/shared/tiers";
import { LevelUpModal } from "./level-up-modal";

// MOCK — enquanto não há backend de pontos. Só para dar a ideia no ícone.
// Depois vira prop vinda do servidor (customer.pointsLifetime).
const MOCK_POINTS = 720;

export function AccountMenu({ customerName }: { customerName?: string | null }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [celebrate, setCelebrate] = React.useState<TierId | null>(null);

  const loggedIn = Boolean(customerName);
  const firstName = customerName ? customerName.split(" ")[0] : null;

  const points = MOCK_POINTS;
  const current = tierForPoints(points);
  const idx = TIERS.findIndex((t) => t.id === current.id);
  const next = TIERS[idx + 1] ?? null;
  const remaining = next ? next.minPoints - points : 0;
  const pct = next
    ? Math.min(100, Math.round(((points - current.minPoints) / (next.minPoints - current.minPoints)) * 100))
    : 100;

  async function logout() {
    setOpen(false);
    await fetch("/api/conta/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Sua conta e nível"
        className="flex h-11 items-center gap-2 rounded-md border border-border bg-steel px-4 font-semibold uppercase tracking-wide text-foreground transition-colors hover:border-lime hover:text-lime"
      >
        <span className="relative">
          <User className="size-5" />
          {loggedIn && (
            <span
              aria-hidden
              style={{ background: current.cor }}
              className="absolute -right-1.5 -top-1.5 flex size-3.5 items-center justify-center rounded-full text-[8px] ring-2 ring-steel"
            >
              {current.emoji}
            </span>
          )}
        </span>
        <span className="hidden sm:inline">{firstName ?? "Entrar"}</span>
        <ChevronDown className={`hidden size-4 transition-transform sm:block ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <button
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-3 w-72 overflow-hidden rounded-xl border border-border bg-carbon shadow-2xl"
          >
            {loggedIn ? (
              <>
                {/* Perfil + nível */}
                <div className="border-b border-border p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <span
                      aria-hidden
                      style={{ boxShadow: `0 0 0 2px ${current.cor}` }}
                      className="relative flex size-11 items-center justify-center rounded-full bg-steel text-foreground"
                    >
                      <User className="size-5" />
                      <span
                        style={{ background: current.cor }}
                        className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full text-[10px] ring-2 ring-carbon"
                      >
                        {current.emoji}
                      </span>
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">{customerName}</p>
                      <p style={{ color: current.cor }} className="font-display text-base uppercase leading-none">
                        Nível {current.nome}
                      </p>
                    </div>
                  </div>

                  {/* Barra de XP */}
                  <div className="mb-1 flex items-baseline justify-between font-mono text-[11px]">
                    <span className="font-bold text-foreground">{points} XP</span>
                    <span className="text-muted-foreground">{next ? `${next.minPoints} XP` : "MAX"}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-steel">
                    <div
                      style={{ width: `${pct}%`, background: current.cor }}
                      className="h-full rounded-full transition-all"
                    />
                  </div>
                  {next ? (
                    <button
                      onClick={() => {
                        setCelebrate(next.id);
                        setOpen(false);
                      }}
                      className="mt-2 flex items-center gap-1 font-mono text-[11px] text-muted-foreground transition-colors hover:text-lime"
                    >
                      <Sparkles className="size-3" />
                      Faltam <span className="font-bold text-foreground">{remaining} XP</span> para{" "}
                      <span style={{ color: next.cor }}>{next.nome}</span>
                    </button>
                  ) : (
                    <p className="mt-2 font-mono text-[11px] text-lime">Nível máximo atingido 🏆</p>
                  )}
                </div>

                {/* Ações */}
                <div className="p-2">
                  <Link
                    href="/conta"
                    onClick={() => setOpen(false)}
                    role="menuitem"
                    className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-steel hover:text-lime"
                  >
                    <User className="size-4" /> Meu perfil
                  </Link>
                  <Link
                    href="/conta"
                    onClick={() => setOpen(false)}
                    role="menuitem"
                    className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-steel hover:text-lime"
                  >
                    <Package className="size-4" /> Meus pedidos
                  </Link>
                  <button
                    onClick={logout}
                    role="menuitem"
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-steel hover:text-destructive"
                  >
                    <LogOut className="size-4" /> Sair
                  </button>
                </div>
              </>
            ) : (
              /* Deslogado */
              <div className="p-4">
                <p className="text-sm font-bold text-foreground">Bem-vindo à Nutri Lab</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Entre para acumular XP, subir de nível e desbloquear benefícios.
                </p>
                <Link
                  href="/conta/entrar"
                  onClick={() => setOpen(false)}
                  className="mt-3 flex items-center justify-center gap-2 rounded-md bg-lime py-2.5 text-sm font-bold uppercase tracking-wide text-ink transition-colors hover:bg-lime-glow"
                >
                  <LogIn className="size-4" /> Entrar / Cadastrar
                </Link>
              </div>
            )}
          </div>
        </>
      )}

      <LevelUpModal tier={celebrate} onClose={() => setCelebrate(null)} />
    </div>
  );
}
