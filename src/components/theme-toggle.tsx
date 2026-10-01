"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/shared/utils";

// Alterna entre Night (escuro) e Evening (claro).
// O estado inicial vem da classe já aplicada no <html> pelo script anti-flash.
export function ThemeToggle({
  className,
  showLabel = true,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const [dark, setDark] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    const root = document.documentElement;
    root.classList.toggle("dark", next);
    try {
      localStorage.setItem("nl-theme", next ? "dark" : "light");
    } catch {
      /* ignora */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={
        dark ? "Ativar modo claro (evening)" : "Ativar modo escuro (night)"
      }
      title={dark ? "Modo Evening (claro)" : "Modo Night (escuro)"}
      className={cn(
        "flex h-11 items-center gap-2 rounded-md border border-border bg-steel px-3 font-semibold uppercase tracking-wide text-foreground transition-colors hover:border-lime hover:text-lime",
        className,
      )}
    >
      {/* Renderiza o icone só após montar para não divergir do SSR */}
      <span className="flex size-5 items-center justify-center">
        {mounted ? (
          dark ? (
            <Sun className="size-5" />
          ) : (
            <Moon className="size-5" />
          )
        ) : null}
      </span>
      {showLabel && (
        <span className="hidden sm:inline">
          {mounted ? (dark ? "Evening" : "Night") : ""}
        </span>
      )}
    </button>
  );
}
