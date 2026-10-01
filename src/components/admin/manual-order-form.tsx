"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Minus, Trash2, Loader2, ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/shared/format";

type Product = { id: string; name: string; priceCents: number; stock: number };
type Line = { id: string; name: string; priceCents: number; stock: number; quantity: number };

const PAYMENTS = ["Dinheiro", "Pix", "Cartão", "WhatsApp", "Outro"];

export function ManualOrderForm({ products }: { products: Product[] }) {
  const router = useRouter();
  const [lines, setLines] = React.useState<Line[]>([]);
  const [picker, setPicker] = React.useState("");
  const [customerName, setCustomerName] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("Dinheiro");
  const [status, setStatus] = React.useState<"PAGO" | "PENDENTE">("PAGO");
  const [discount, setDiscount] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  function addProduct(id: string) {
    if (!id) return;
    const p = products.find((x) => x.id === id);
    if (!p) return;
    setLines((prev) => {
      const found = prev.find((l) => l.id === id);
      if (found)
        return prev.map((l) =>
          l.id === id ? { ...l, quantity: Math.min(l.quantity + 1, l.stock) } : l,
        );
      return [...prev, { ...p, quantity: 1 }];
    });
    setPicker("");
  }

  function setQty(id: string, qty: number) {
    setLines((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, quantity: Math.max(0, Math.min(qty, l.stock)) } : l))
        .filter((l) => l.quantity > 0),
    );
  }

  const subtotal = lines.reduce((s, l) => s + l.priceCents * l.quantity, 0);
  const discountCents = Math.min(
    Math.round((parseFloat(discount.replace(",", ".")) || 0) * 100),
    subtotal,
  );
  const total = subtotal - discountCents;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) {
      setError("Adicione ao menos um produto.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ id: l.id, quantity: l.quantity })),
          customerName,
          paymentMethod,
          status,
          discountCents,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Não foi possível salvar.");
      else router.push(`/admin/pedidos/${data.reference}`);
    } catch {
      setError("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <Link
        href="/admin/pedidos"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-lime"
      >
        <ArrowLeft className="size-4" /> Voltar aos pedidos
      </Link>

      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-lime">
          Painel do proprietário
        </p>
        <h1 className="display text-4xl text-foreground md:text-5xl">Novo pedido</h1>
        <p className="mt-1 font-mono text-sm text-muted-foreground">
          Lançamento manual (venda no boca a boca, WhatsApp ou balcão)
        </p>
      </header>

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Itens */}
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="display mb-4 text-xl text-foreground">Produtos</h2>
            <div className="mb-4 flex gap-2">
              <select
                value={picker}
                onChange={(e) => addProduct(e.target.value)}
                className="flex h-11 w-full rounded-md border border-input bg-steel px-3 text-sm text-foreground focus-visible:border-lime focus-visible:outline-none"
              >
                <option value="">Adicionar produto...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                    {p.name} — {formatBRL(p.priceCents)}
                    {p.stock <= 0 ? " (sem estoque)" : ` (${p.stock} un)`}
                  </option>
                ))}
              </select>
            </div>

            {lines.length === 0 ? (
              <p className="py-6 text-center font-mono text-xs text-muted-foreground">
                Nenhum produto adicionado.
              </p>
            ) : (
              <ul className="space-y-3">
                {lines.map((l) => (
                  <li key={l.id} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold uppercase tracking-wide text-foreground">
                        {l.name}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {formatBRL(l.priceCents)}
                      </p>
                    </div>
                    <div className="flex items-center rounded-md border border-border">
                      <button type="button" onClick={() => setQty(l.id, l.quantity - 1)} className="flex size-8 items-center justify-center text-muted-foreground hover:text-lime">
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-8 text-center font-mono text-sm font-bold">{l.quantity}</span>
                      <button type="button" onClick={() => setQty(l.id, l.quantity + 1)} disabled={l.quantity >= l.stock} className="flex size-8 items-center justify-center text-muted-foreground hover:text-lime disabled:opacity-40">
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <span className="w-24 text-right font-mono text-sm font-bold text-foreground">
                      {formatBRL(l.priceCents * l.quantity)}
                    </span>
                    <button type="button" onClick={() => setQty(l.id, 0)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="display mb-4 text-xl text-foreground">Dados da venda</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cust">Cliente (opcional)</Label>
                <Input id="cust" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Venda balcão" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pay">Forma de pagamento</Label>
                <select id="pay" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="flex h-11 w-full rounded-md border border-input bg-steel px-3 text-sm text-foreground focus-visible:border-lime focus-visible:outline-none">
                  {PAYMENTS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="disc">Desconto (R$)</Label>
                <Input id="disc" inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0,00" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="st">Status</Label>
                <select id="st" value={status} onChange={(e) => setStatus(e.target.value as "PAGO" | "PENDENTE")} className="flex h-11 w-full rounded-md border border-input bg-steel px-3 text-sm text-foreground focus-visible:border-lime focus-visible:outline-none">
                  <option value="PAGO">Pago (baixa o estoque)</option>
                  <option value="PENDENTE">Pendente</option>
                </select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="obs">Observação</Label>
                <Input id="obs" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: entrega combinada, indicação de fulano" />
              </div>
            </div>
          </Card>
        </div>

        {/* Resumo */}
        <aside>
          <Card className="p-5 lg:sticky lg:top-6">
            <h2 className="display mb-4 text-xl text-foreground">Resumo</h2>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <dt>Subtotal</dt>
                <dd className="font-mono">{formatBRL(subtotal)}</dd>
              </div>
              {discountCents > 0 && (
                <div className="flex justify-between text-lime">
                  <dt>Desconto</dt>
                  <dd className="font-mono">- {formatBRL(discountCents)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2">
                <dt className="font-bold uppercase tracking-wide text-foreground">Total</dt>
                <dd className="display text-2xl text-lime">{formatBRL(total)}</dd>
              </div>
            </dl>

            {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}

            <Button type="submit" className="mt-5 w-full" size="lg" disabled={saving || lines.length === 0}>
              {saving ? (<><Loader2 className="size-5 animate-spin" /> Salvando</>) : (<><ShoppingCart className="size-5" /> Registrar pedido</>)}
            </Button>
            <p className="mt-2 text-center font-mono text-xs text-muted-foreground">
              Entra no faturamento, lucro e relatórios.
            </p>
          </Card>
        </aside>
      </form>
    </div>
  );
}
