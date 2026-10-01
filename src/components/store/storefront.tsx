"use client";

import * as React from "react";
import { Search, X, Target } from "lucide-react";
import { ProductCard } from "./product-card";
import { CATEGORIES } from "@/shared/categories";
import { findGoal } from "@/shared/goals";
import { cn } from "@/shared/utils";
import type { ProductDTO } from "@/shared/types";
import type { Category } from "@prisma/client";

export function Storefront({
  products,
  initialObjetivo = null,
  initialCategoria = null,
}: {
  products: ProductDTO[];
  initialObjetivo?: string | null;
  initialCategoria?: string | null;
}) {
  const catInicial =
    (CATEGORIES.find((c) => c.key === initialCategoria)?.key as Category | undefined) ?? "ALL";
  const [active, setActive] = React.useState<Category | "ALL">(catInicial);
  const [query, setQuery] = React.useState("");
  const [goalKey, setGoalKey] = React.useState<string | null>(initialObjetivo);

  const goal = findGoal(goalKey);
  const goalCats = goal?.categories ?? null;

  const q = query.trim().toLowerCase();
  const filtered = products
    .filter((p) => !goalCats || goalCats.includes(p.category))
    .filter((p) => active === "ALL" || p.category === active)
    .filter(
      (p) =>
        q === "" ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );

  return (
    <section id="produtos" className="container py-16">
      {/* Banner de objetivo */}
      {goal && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-lime/40 bg-lime/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-lime/15">
              <Target className="size-5 text-lime" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-lime">
                Objetivo selecionado
              </p>
              <p className="text-lg font-bold uppercase tracking-wide text-foreground">
                {goal.label}
              </p>
              <p className="text-xs text-muted-foreground">{goal.desc}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setGoalKey(null);
              setActive("ALL");
            }}
            className="flex items-center gap-1.5 rounded-md border border-border bg-steel px-4 py-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:border-lime hover:text-lime"
          >
            <X className="size-4" /> Ver tudo
          </button>
        </div>
      )}

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="display text-4xl text-foreground md:text-5xl" id="categorias">
            Nossa <span className="text-lime">linha</span>
          </h2>
          <p className="text-muted-foreground">
            {goal
              ? "Selecionamos o que combina com o seu objetivo."
              : "Filtre por categoria e monte o seu protocolo."}
          </p>
        </div>
        {/* Busca */}
        <div className="relative w-full md:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar produto..."
            aria-label="Buscar produto"
            className="h-11 w-full rounded-md border border-border bg-steel pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-lime focus-visible:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Limpar busca"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-lime"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filtro por categoria */}
      <div
        role="tablist"
        aria-label="Filtrar por categoria"
        className="no-scrollbar mb-10 flex gap-2 overflow-x-auto pb-2"
      >
        <FilterChip
          label="Todos"
          selected={active === "ALL"}
          onClick={() => setActive("ALL")}
        />
        {CATEGORIES.filter(
          (cat) => !goalCats || goalCats.includes(cat.key),
        ).map((cat) => (
          <FilterChip
            key={cat.key}
            label={cat.label}
            selected={active === cat.key}
            onClick={() => setActive(cat.key)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center font-mono text-muted-foreground">
          Nenhum produto nesta categoria por enquanto.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-5 py-2 text-sm font-semibold uppercase tracking-wide transition-colors",
        selected
          ? "border-lime bg-lime text-ink"
          : "border-border bg-steel text-muted-foreground hover:border-lime/50 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
