"use client";

import * as React from "react";
import Link from "next/link";
import { ShoppingBag, Target, ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { AccountMenu } from "./account-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCart } from "@/components/providers/cart-provider";
import { GOALS } from "@/shared/goals";
import { CATEGORIES } from "@/shared/categories";

export function SiteHeader({ customerName }: { customerName?: string | null }) {
  const { count, open } = useCart();
  const [goalsOpen, setGoalsOpen] = React.useState(false);
  const [catsOpen, setCatsOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link href="/" aria-label="NUTRI LAB BRASIL, página inicial">
            <Logo />
          </Link>

          <nav
            aria-label="Navegação principal"
            className="hidden items-center gap-8 md:flex"
          >
            <a
              href="/#produtos"
              className="text-sm font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-lime"
            >
              Produtos
            </a>
            {/* Categorias (dropdown desktop) */}
            <div className="relative">
              <button
                onClick={() => setCatsOpen((o) => !o)}
                aria-expanded={catsOpen}
                aria-haspopup="menu"
                className="flex items-center gap-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-lime"
              >
                Categorias
                <ChevronDown
                  className={`size-4 transition-transform ${catsOpen ? "rotate-180" : ""}`}
                />
              </button>
              {catsOpen && (
                <>
                  <button
                    aria-hidden
                    onClick={() => setCatsOpen(false)}
                    className="fixed inset-0 z-40 cursor-default"
                    tabIndex={-1}
                  />
                  <div
                    role="menu"
                    className="absolute left-1/2 top-full z-50 mt-3 w-56 -translate-x-1/2 overflow-hidden rounded-lg border border-border bg-carbon shadow-2xl"
                  >
                    <p className="border-b border-border px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-lime">
                      Categorias
                    </p>
                    {CATEGORIES.map((c) => (
                      <a
                        key={c.key}
                        href={`/?categoria=${c.key}#produtos`}
                        onClick={() => setCatsOpen(false)}
                        role="menuitem"
                        className="block border-b border-border/50 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-foreground transition-colors last:border-0 hover:bg-steel hover:text-lime"
                      >
                        {c.label}
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Objetivo (dropdown desktop) */}
            <div className="relative">
              <button
                onClick={() => setGoalsOpen((o) => !o)}
                aria-expanded={goalsOpen}
                aria-haspopup="menu"
                className="flex items-center gap-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-lime"
              >
                <Target className="size-4" />
                Objetivo
                <ChevronDown
                  className={`size-4 transition-transform ${goalsOpen ? "rotate-180" : ""}`}
                />
              </button>
              {goalsOpen && (
                <>
                  <button
                    aria-hidden
                    onClick={() => setGoalsOpen(false)}
                    className="fixed inset-0 z-40 cursor-default"
                    tabIndex={-1}
                  />
                  <div
                    role="menu"
                    className="absolute left-1/2 top-full z-50 mt-3 w-72 -translate-x-1/2 overflow-hidden rounded-lg border border-border bg-carbon shadow-2xl"
                  >
                    <p className="border-b border-border px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-lime">
                      Qual seu objetivo?
                    </p>
                    {GOALS.map((g) => (
                      <a
                        key={g.key}
                        href={`/?objetivo=${g.key}#produtos`}
                        onClick={() => setGoalsOpen(false)}
                        role="menuitem"
                        className="block border-b border-border/50 px-4 py-3 transition-colors last:border-0 hover:bg-steel"
                      >
                        <span className="block text-sm font-bold uppercase tracking-wide text-foreground">
                          {g.label}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {g.desc}
                        </span>
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>

            <a
              href="/#confianca"
              className="text-sm font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-lime"
            >
              Por que nós
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle showLabel={false} />
            <AccountMenu customerName={customerName} />

            <button
              onClick={open}
              aria-label={`Abrir carrinho, ${count} ${count === 1 ? "item" : "itens"}`}
              className="relative flex h-11 items-center gap-2 rounded-md border border-border bg-steel px-4 font-semibold uppercase tracking-wide text-foreground transition-colors hover:border-lime hover:text-lime"
            >
              <ShoppingBag className="size-5" />
              <span className="hidden sm:inline">Carrinho</span>
              {count > 0 && (
                <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-lime px-1.5 font-mono text-xs font-bold text-ink">
                  {count}
                </span>
              )}
            </button>

            {/* Hamburguer (mobile) */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={mobileOpen}
              className="flex size-11 items-center justify-center rounded-md border border-border bg-steel text-foreground transition-colors hover:border-lime hover:text-lime md:hidden"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Menu mobile (fora do header para o backdrop funcionar) */}
      {mobileOpen && (
        <div className="md:hidden">
          {/* Backdrop: fecha ao tocar fora */}
          <button
            aria-hidden
            tabIndex={-1}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 top-16 z-40 cursor-default bg-black/50 backdrop-blur-sm"
          />
          <nav
            aria-label="Navegação mobile"
            className="fixed inset-x-0 top-16 z-50 max-h-[calc(100vh-4rem)] animate-fade-up overflow-y-auto border-b border-border bg-background shadow-2xl"
          >
            <div className="container flex flex-col py-3">
              <a href="/#produtos" onClick={() => setMobileOpen(false)} className="py-2.5 text-sm font-semibold uppercase tracking-wide text-foreground hover:text-lime">
                Produtos
              </a>
              <a href="/#confianca" onClick={() => setMobileOpen(false)} className="py-2.5 text-sm font-semibold uppercase tracking-wide text-foreground hover:text-lime">
                Por que nós
              </a>

              <p className="mt-3 border-t border-border pt-3 font-mono text-[10px] uppercase tracking-widest text-lime">
                Categorias
              </p>
              {CATEGORIES.map((c) => (
                <a
                  key={c.key}
                  href={`/?categoria=${c.key}#produtos`}
                  onClick={() => setMobileOpen(false)}
                  className="py-2 text-sm font-bold uppercase tracking-wide text-foreground hover:text-lime"
                >
                  {c.label}
                </a>
              ))}

              <p className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 font-mono text-[10px] uppercase tracking-widest text-lime">
                <Target className="size-3.5" /> Qual seu objetivo?
              </p>
              {GOALS.map((g) => (
                <a
                  key={g.key}
                  href={`/?objetivo=${g.key}#produtos`}
                  onClick={() => setMobileOpen(false)}
                  className="border-b border-border/40 py-2.5 last:border-0"
                >
                  <span className="block text-sm font-bold uppercase tracking-wide text-foreground">
                    {g.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">{g.desc}</span>
                </a>
              ))}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
