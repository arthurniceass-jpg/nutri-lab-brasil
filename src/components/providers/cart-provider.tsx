"use client";

import * as React from "react";
import {
  type CartItem,
  type ProductDTO,
  FREE_SHIPPING_CENTS,
  DEFAULT_SHIPPING_CENTS,
} from "@/shared/types";

type AppliedCoupon = {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minSubtotalCents: number;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
};

type CartContextValue = CartState & {
  add: (product: ProductDTO, qty?: number) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, qty: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  count: number;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  missingForFreeCents: number;
  freeShippingReached: boolean;
  freeShippingCents: number;
  coupon: AppliedCoupon | null;
  applyCoupon: (code: string) => Promise<{ ok: boolean; error?: string }>;
  removeCoupon: () => void;
  cep: string;
  setCep: (cep: string) => void;
  shippingQuote: { cents: number; days: number; region: string } | null;
  quoting: boolean;
  calcularFrete: () => Promise<{ ok: boolean; error?: string }>;
};

const CartContext = React.createContext<CartContextValue | null>(null);
const STORAGE_KEY = "nl_cart_v1";
const COUPON_KEY = "nl_coupon_v1";
const CEP_KEY = "nl_cep_v1";

export function CartProvider({
  children,
  freeShippingCents = FREE_SHIPPING_CENTS,
  defaultShippingCents = DEFAULT_SHIPPING_CENTS,
}: {
  children: React.ReactNode;
  freeShippingCents?: number;
  defaultShippingCents?: number;
}) {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [coupon, setCoupon] = React.useState<AppliedCoupon | null>(null);
  const [cep, setCepState] = React.useState("");
  const [shippingQuote, setShippingQuote] = React.useState<{
    cents: number;
    days: number;
    region: string;
  } | null>(null);
  const [quoting, setQuoting] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  // Hidrata do localStorage
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
      const rawCoupon = localStorage.getItem(COUPON_KEY);
      if (rawCoupon) setCoupon(JSON.parse(rawCoupon));
      const rawCep = localStorage.getItem(CEP_KEY);
      if (rawCep) setCepState(rawCep);
    } catch {
      /* ignora */
    }
    setHydrated(true);
  }, []);

  const setCep = React.useCallback((value: string) => {
    setCepState(value);
    try {
      localStorage.setItem(CEP_KEY, value);
    } catch {
      /* ignora */
    }
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  React.useEffect(() => {
    if (!hydrated) return;
    if (coupon) localStorage.setItem(COUPON_KEY, JSON.stringify(coupon));
    else localStorage.removeItem(COUPON_KEY);
  }, [coupon, hydrated]);

  const add = React.useCallback((product: ProductDTO, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id
            ? { ...i, quantity: Math.min(i.quantity + qty, i.stock) }
            : i,
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          priceCents: product.priceCents,
          image: product.image,
          quantity: Math.min(qty, product.stock),
          stock: product.stock,
        },
      ];
    });
    setIsOpen(true);
  }, []);

  const remove = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const setQuantity = React.useCallback((id: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.id === id
            ? { ...i, quantity: Math.max(0, Math.min(qty, i.stock)) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const clear = React.useCallback(() => {
    setItems([]);
    setCoupon(null);
  }, []);

  const subtotalCents = items.reduce(
    (sum, i) => sum + i.priceCents * i.quantity,
    0,
  );

  // Desconto do cupom recalculado sobre o subtotal atual (0 se abaixo do mínimo)
  const discountCents =
    coupon && subtotalCents >= coupon.minSubtotalCents
      ? Math.max(
          0,
          Math.min(
            coupon.type === "PERCENT"
              ? Math.round((subtotalCents * coupon.value) / 100)
              : coupon.value,
            subtotalCents,
          ),
        )
      : 0;

  const applyCoupon = React.useCallback(
    async (code: string) => {
      try {
        const res = await fetch("/api/coupon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, subtotalCents }),
        });
        const data = await res.json();
        if (!res.ok) return { ok: false, error: data.error ?? "Cupom inválido." };
        setCoupon({
          code: data.code,
          type: data.type,
          value: data.value,
          minSubtotalCents: data.minSubtotalCents,
        });
        return { ok: true };
      } catch {
        return { ok: false, error: "Erro ao validar o cupom." };
      }
    },
    [subtotalCents],
  );

  const removeCoupon = React.useCallback(() => setCoupon(null), []);

  const calcularFrete = React.useCallback(async () => {
    if (cep.replace(/\D/g, "").length < 8) {
      return { ok: false, error: "CEP inválido." };
    }
    setQuoting(true);
    try {
      const res = await fetch("/api/frete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep, subtotalCents }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error ?? "CEP inválido." };
      setShippingQuote({ cents: data.cents, days: data.days, region: data.region });
      return { ok: true };
    } catch {
      return { ok: false, error: "Erro ao calcular o frete." };
    } finally {
      setQuoting(false);
    }
  }, [cep, subtotalCents]);

  const shippingCents =
    items.length === 0 || subtotalCents >= freeShippingCents
      ? 0
      : shippingQuote
        ? shippingQuote.cents
        : defaultShippingCents;
  const totalCents = Math.max(0, subtotalCents - discountCents) + shippingCents;
  const missingForFreeCents = Math.max(0, freeShippingCents - subtotalCents);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  const value: CartContextValue = {
    items,
    isOpen,
    add,
    remove,
    setQuantity,
    clear,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((o) => !o),
    count,
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents,
    missingForFreeCents,
    freeShippingReached: subtotalCents >= freeShippingCents,
    freeShippingCents,
    coupon,
    applyCoupon,
    removeCoupon,
    cep,
    setCep,
    shippingQuote,
    quoting,
    calcularFrete,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de CartProvider");
  return ctx;
}
