"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/components/providers/cart-provider";
import { formatBRL, installments } from "@/shared/format";
import { CATEGORY_LABEL } from "@/shared/categories";
import type { ProductDTO } from "@/shared/types";

export function ProductCard({ product }: { product: ProductDTO }) {
  const { add } = useCart();
  const { parts, partCents } = installments(product.priceCents);
  const outOfStock = product.stock <= 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:border-lime/50 hover:shadow-[0_0_24px_rgba(194,238,62,0.12)]">
      <Link
        href={`/produto/${product.slug}`}
        className="relative aspect-square overflow-hidden bg-steel"
        aria-label={product.name}
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 300px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-0 top-3">
          <Badge variant="outline" className="rounded-l-none bg-ink/80">
            {CATEGORY_LABEL[product.category]}
          </Badge>
        </div>
        {product.featured && (
          <div className="absolute right-3 top-3">
            <Badge>Destaque</Badge>
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/70">
            <span className="display text-xl text-muted-foreground">
              Esgotado
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center gap-1.5">
          <Star className="size-3.5 fill-lime text-lime" aria-hidden />
          <span className="font-mono text-xs font-bold text-foreground">
            {product.rating.toFixed(1)}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            ({product.reviews} avaliações)
          </span>
        </div>

        <h3 className="text-sm font-bold uppercase leading-tight tracking-wide text-foreground">
          <Link href={`/produto/${product.slug}`} className="hover:text-lime">
            {product.name}
          </Link>
        </h3>
        {(product.flavor || product.weight) && (
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {[product.weight, product.flavor].filter(Boolean).join(" . ")}
          </p>
        )}

        <div className="mt-auto pt-4">
          <p className="display text-3xl text-lime">
            {formatBRL(product.priceCents)}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            ou {parts}x de {formatBRL(partCents)} sem juros
          </p>
        </div>

        <button
          onClick={() => add(product)}
          disabled={outOfStock}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-lime font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-lime-glow disabled:cursor-not-allowed disabled:bg-steel disabled:text-muted-foreground"
        >
          <Plus className="size-4" />
          {outOfStock ? "Indisponível" : "Adicionar"}
        </button>
      </div>
    </article>
  );
}
