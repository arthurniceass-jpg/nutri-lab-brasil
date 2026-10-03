"use client";

import * as React from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "./product-card";
import { CATEGORIES } from "@/shared/categories";
import { GOALS, findGoal } from "@/shared/goals";
import { cn } from "@/shared/utils";
import type { ProductDTO } from "@/shared/types";
import type { Category } from "@prisma/client";

type Sort = "relevancia" | "menor" | "maior" | "avaliacao";

const SORTS: { key: Sort; label: string }[] = [
  { key: "relevancia", label: "Destaques" },
  { key: "menor", label: "Menor preço" },
  { key: "maior", label: "Maior preço" },
  { key: "avaliacao", label: "Mais bem avaliados" },
];

const fieldClass =
  "h-11 w-full rounded-md border border-border bg-steel px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-lime focus-visible:outline-none";

export function CatalogView({
  products,
  initialObjetivo = null,
  initialCategoria = null,
}: {
  products: ProductDTO[];
  initialObjetivo?: string | null;
  initialCategoria?: string | null;
}) {
  const [query, setQuery] = React.useState("");
  const [categoria, setCategoria] = React.useState<Category | "ALL">(
    (CATEGORIES.find((c) => c.key === initialCategoria)?.key as Category | undefined) ?? "ALL",
  );
  const [goalKey, setGoalKey] = React.useState<string>(
    findGoal(initialObjetivo)?.key ?? "ALL",
  );
  const [minPrice, setMinPrice] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [onlyStock, setOnlyStock] = React.useState(false);
  const [sort, setSort] = React.useState<Sort>("relevancia");
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const goal = findGoal(goalKey);
  const min = minPrice === "" ? null : Math.round(Number(minPrice) * 100);
  const max = maxPrice === "" ? null : Math.round(Number(maxPrice) * 100);
  const q = query.trim().toLowerCase();

  const filtered = products
    .filter((p) => !goal || goal.categories.includes(p.category))
    .filter((p) => categoria === "ALL" || p.category === categoria)
    .filter((p) => !onlyStock || p.stock > 0)
    .filter((p) => min === null || Number.isNaN(min) || p.priceCents >= min)
    .filter((p) => max === null || Number.isNaN(max) || p.priceCents <= max)
    .filter(
      (p) =>
        q === "" ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case "menor":
        return a.priceCents - b.priceCents;
      case "maior":
        return b.priceCents - a.priceCents;
      case "avaliacao":
        return b.rating - a.rating || b.reviews - a.reviews;
      default:
        return Number(b.featured) - Number(a.featured);
    }
  });

  const hasFilters =
    q !== "" ||
    categoria !== "ALL" ||
    goalKey !== "ALL" ||
    minPrice !== "" ||
    maxPrice !== "" ||
    onlyStock ||
    sort !== "relevancia";

  function clear() {
    setQuery("");
    setCategoria("ALL");
    setGoalKey("ALL");
    setMinPrice("");
    setMaxPrice("");
    setOnlyStock(false);
    setSort("relevancia");
  }

  return (
    <section className="container py-12">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase leading-none tracking-widest text-lime">
            Loja completa
          </p>
          <h1 className="display mt-2 text-4xl leading-[1.1] text-foreground md:text-5xl">
            Nosso <span className="text-lime">catálogo</span>
          </h1>
        </div>
        <p className="font-mono text-sm text-muted-foreground">
          {sorted.length} produto{sorted.length === 1 ? "" : "s"}
        </p>
      </header>

      <button
        onClick={() => setFiltersOpen((o) => !o)}
        aria-expanded={filtersOpen}
        className="mb-4 flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-steel text-sm font-semibold uppercase tracking-wide text-foreground lg:hidden"
      >
        <SlidersHorizontal className="size-4" />
        {filtersOpen ? "Esconder filtros" : "Filtrar e ordenar"}
      </button>

      <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
        <aside
          aria-label="Filtros"
          className={cn(
            "h-fit space-y-5 rounded-lg border border-border bg-card p-5 card-grain lg:sticky lg:top-24 lg:block",
            filtersOpen ? "block" : "hidden",
          )}
        >
          <div>
            <label htmlFor="cat-busca" className="mb-2 block text-sm font-semibold text-foreground">
              Buscar
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="cat-busca"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nome do produto..."
                className={cn(fieldClass, "pl-9")}
              />
            </div>
          </div>

          <div>
            <label htmlFor="cat-categoria" className="mb-2 block text-sm font-semibold text-foreground">
              Categoria
            </label>
            <select
              id="cat-categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as Category | "ALL")}
              className={fieldClass}
            >
              <option value="ALL">Todas</option>
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="cat-objetivo" className="mb-2 block text-sm font-semibold text-foreground">
              Objetivo
            </label>
            <select
              id="cat-objetivo"
              value={goalKey}
              onChange={(e) => setGoalKey(e.target.value)}
              className={fieldClass}
            >
              <option value="ALL">Qualquer</option>
              {GOALS.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">Preço (R$)</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={0}
                inputMode="decimal"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Mín."
                aria-label="Preço mínimo"
                className={fieldClass}
              />
              <input
                type="number"
                min={0}
                inputMode="decimal"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Máx."
                aria-label="Preço máximo"
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="cat-ordem" className="mb-2 block text-sm font-semibold text-foreground">
              Ordenar por
            </label>
            <select
              id="cat-ordem"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className={fieldClass}
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={onlyStock}
              onChange={(e) => setOnlyStock(e.target.checked)}
              className="size-4 accent-[#C2EE3E]"
            />
            Somente em estoque
          </label>

          <button
            onClick={clear}
            disabled={!hasFilters}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-steel text-sm font-semibold uppercase tracking-wide text-muted-foreground transition-colors enabled:hover:border-lime enabled:hover:text-lime disabled:opacity-50"
          >
            <X className="size-4" /> Limpar filtros
          </button>
        </aside>

        <div>
          {goal && (
            <p className="mb-4 font-mono text-xs text-muted-foreground">
              <span className="text-lime">{goal.label}:</span> {goal.desc}
            </p>
          )}
          {sorted.length === 0 ? (
            <p className="py-16 text-center font-mono text-muted-foreground">
              Nenhum produto encontrado com esses filtros.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              {sorted.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
