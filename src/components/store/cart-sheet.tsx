"use client";

import * as React from "react";
import Image from "next/image";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Truck,
  Loader2,
  Tag,
  X,
  Check,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/components/providers/cart-provider";
import { formatBRL, maskCep } from "@/shared/format";

export function CartSheet() {
  const cart = useCart();
  const [loading, setLoading] = React.useState(false);
  const [couponInput, setCouponInput] = React.useState("");
  const [couponError, setCouponError] = React.useState("");
  const [couponLoading, setCouponLoading] = React.useState(false);

  const progress = Math.min(
    100,
    Math.round((cart.subtotalCents / cart.freeShippingCents) * 100),
  );

  async function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    const res = await cart.applyCoupon(couponInput);
    if (!res.ok) setCouponError(res.error ?? "Cupom inválido.");
    else setCouponInput("");
    setCouponLoading(false);
  }

  const [cepError, setCepError] = React.useState("");

  async function calcFrete(e: React.FormEvent) {
    e.preventDefault();
    setCepError("");
    const res = await cart.calcularFrete();
    if (!res.ok) setCepError(res.error ?? "CEP inválido.");
  }

  async function checkout() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.items.map((i) => ({ id: i.id, quantity: i.quantity })),
          coupon: cart.coupon?.code ?? null,
          cep: cart.cep,
        }),
      });
      const data = await res.json();
      if (data.initPoint) {
        window.location.href = data.initPoint;
      } else {
        alert(data.error ?? "Não foi possível iniciar o pagamento.");
      }
    } catch {
      alert("Erro de conexao ao iniciar o pagamento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={cart.isOpen} onOpenChange={(o) => (o ? cart.open() : cart.close())}>
      <SheetContent className="gap-0 p-0">
        <div className="flex items-center gap-2 border-b border-border p-5">
          <ShoppingBag className="size-5 text-lime" />
          <SheetTitle>Seu carrinho</SheetTitle>
          <span className="font-mono text-sm text-muted-foreground">
            ({cart.count})
          </span>
        </div>

        {/* Barra de frete grátis */}
        <div className="border-b border-border bg-carbon px-5 py-4">
          <div className="mb-2 flex items-center gap-2 text-sm">
            <Truck className="size-4 text-lime" />
            {cart.freeShippingReached ? (
              <span className="font-semibold text-lime">
                Você ganhou frete grátis!
              </span>
            ) : (
              <span className="text-muted-foreground">
                Faltam{" "}
                <span className="font-bold text-foreground">
                  {formatBRL(cart.missingForFreeCents)}
                </span>{" "}
                para o frete grátis
              </span>
            )}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-steel">
            <div
              className="h-full rounded-full bg-lime transition-all duration-500"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progresso para frete grátis"
            />
          </div>
        </div>

        {/* Itens */}
        <div className="flex-1 overflow-y-auto p-5">
          {cart.items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <ShoppingBag className="size-12 text-muted-foreground/40" />
              <p className="font-mono text-sm text-muted-foreground">
                Seu carrinho esta vazio.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {cart.items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-md border border-border bg-steel">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <p className="text-sm font-bold uppercase leading-tight tracking-wide text-foreground">
                      {item.name}
                    </p>
                    <p className="font-mono text-sm text-lime">
                      {formatBRL(item.priceCents)}
                    </p>

                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center rounded-md border border-border">
                        <button
                          onClick={() =>
                            cart.setQuantity(item.id, item.quantity - 1)
                          }
                          aria-label="Diminuir quantidade"
                          className="flex size-8 items-center justify-center text-muted-foreground hover:text-lime"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-8 text-center font-mono text-sm font-bold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            cart.setQuantity(item.id, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.stock}
                          aria-label="Aumentar quantidade"
                          className="flex size-8 items-center justify-center text-muted-foreground hover:text-lime disabled:opacity-40"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => cart.remove(item.id)}
                        aria-label={`Remover ${item.name}`}
                        className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Resumo + checkout */}
        {cart.items.length > 0 && (
          <div className="border-t border-border bg-carbon p-5">
            {/* Frete por CEP */}
            <form onSubmit={calcFrete} className="mb-4">
              <div className="flex gap-2">
                <Input
                  value={cart.cep}
                  onChange={(e) => {
                    cart.setCep(maskCep(e.target.value));
                    setCepError("");
                  }}
                  inputMode="numeric"
                  maxLength={9}
                  placeholder="Seu CEP para calcular o frete"
                  aria-label="CEP"
                />
                <Button
                  type="submit"
                  variant="outline"
                  disabled={cart.quoting}
                >
                  {cart.quoting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Calcular"
                  )}
                </Button>
              </div>
              {cepError && (
                <p role="alert" className="mt-1.5 text-xs text-destructive">
                  {cepError}
                </p>
              )}
              {cart.shippingQuote && !cepError && (
                <p className="mt-1.5 font-mono text-xs text-muted-foreground">
                  {cart.shippingQuote.region} . entrega em até{" "}
                  {cart.shippingQuote.days} dias úteis
                </p>
              )}
            </form>

            {/* Cupom de desconto */}
            {cart.coupon ? (
              <div className="mb-4 flex items-center justify-between rounded-md border border-lime/40 bg-lime/5 px-3 py-2">
                <span className="flex items-center gap-2 text-sm">
                  <Check className="size-4 text-lime" />
                  <span className="font-mono font-bold uppercase text-lime">
                    {cart.coupon.code}
                  </span>
                  {cart.discountCents === 0 && (
                    <span className="text-xs text-muted-foreground">
                      (não atinge o mínimo)
                    </span>
                  )}
                </span>
                <button
                  onClick={cart.removeCoupon}
                  aria-label="Remover cupom"
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={applyCoupon} className="mb-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        setCouponError("");
                      }}
                      placeholder="Cupom de desconto"
                      aria-label="Cupom de desconto"
                      className="pl-9 uppercase"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={couponLoading || !couponInput.trim()}
                  >
                    {couponLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Aplicar"
                    )}
                  </Button>
                </div>
                {couponError && (
                  <p role="alert" className="mt-1.5 text-xs text-destructive">
                    {couponError}
                  </p>
                )}
              </form>
            )}

            <dl className="mb-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <dt>Subtotal</dt>
                <dd className="font-mono">{formatBRL(cart.subtotalCents)}</dd>
              </div>
              {cart.discountCents > 0 && (
                <div className="flex justify-between text-lime">
                  <dt>Desconto</dt>
                  <dd className="font-mono">
                    - {formatBRL(cart.discountCents)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <dt>Frete</dt>
                <dd className="font-mono">
                  {cart.shippingCents === 0
                    ? "Grátis"
                    : formatBRL(cart.shippingCents)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base">
                <dt className="font-bold uppercase tracking-wide text-foreground">
                  Total
                </dt>
                <dd className="display text-2xl text-lime">
                  {formatBRL(cart.totalCents)}
                </dd>
              </div>
            </dl>
            <Button
              className="w-full"
              size="lg"
              onClick={checkout}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="size-5 animate-spin" /> Processando
                </>
              ) : (
                "Ir para o pagamento"
              )}
            </Button>
            <p className="mt-2 text-center font-mono text-xs text-muted-foreground">
              Pagamento seguro . Pix, boleto ou cartão
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
