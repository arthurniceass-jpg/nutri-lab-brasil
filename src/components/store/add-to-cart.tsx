"use client";

import * as React from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import type { ProductDTO } from "@/shared/types";

export function AddToCart({ product }: { product: ProductDTO }) {
  const { add } = useCart();
  const [qty, setQty] = React.useState(1);
  const out = product.stock <= 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-md border border-border">
        <button
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          aria-label="Diminuir"
          className="flex size-11 items-center justify-center text-muted-foreground hover:text-lime"
        >
          <Minus className="size-4" />
        </button>
        <span className="w-10 text-center font-mono text-base font-bold">
          {qty}
        </span>
        <button
          onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
          disabled={qty >= product.stock}
          aria-label="Aumentar"
          className="flex size-11 items-center justify-center text-muted-foreground hover:text-lime disabled:opacity-40"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <button
        onClick={() => add(product, qty)}
        disabled={out}
        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-lime px-6 font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-lime-glow disabled:cursor-not-allowed disabled:bg-steel disabled:text-muted-foreground"
      >
        <ShoppingBag className="size-5" />
        {out ? "Indisponível" : "Adicionar ao carrinho"}
      </button>
    </div>
  );
}
