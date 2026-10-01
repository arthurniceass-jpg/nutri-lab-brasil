"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Loader2,
  X,
  PackagePlus,
  Pencil,
  Star,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatBRL, formatPercent } from "@/shared/format";
import { CATEGORIES, CATEGORY_LABEL } from "@/shared/categories";
import type { Category } from "@prisma/client";

type Product = {
  id: string;
  name: string;
  description: string;
  category: Category;
  priceCents: number;
  costCents: number;
  stock: number;
  active: boolean;
  featured: boolean;
  image: string;
  flavor: string | null;
  weight: string | null;
  usage: string | null;
  ingredients: string | null;
  supplierId: string | null;
};

type Supplier = { id: string; name: string };

const reais = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");
const EMPTY = {
  name: "",
  category: "PROTEINAS" as Category,
  price: "",
  cost: "",
  stock: "",
  weight: "",
  flavor: "",
  image: "",
  description: "",
  usage: "",
  ingredients: "",
  supplierId: "",
  featured: false,
};

export function ProductsManager({
  products,
  suppliers,
}: {
  products: Product[];
  suppliers: Supplier[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ ...EMPTY });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState("");

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY });
    setError("");
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      category: p.category,
      price: reais(p.priceCents),
      cost: reais(p.costCents),
      stock: String(p.stock),
      weight: p.weight ?? "",
      flavor: p.flavor ?? "",
      image: p.image,
      description: p.description,
      usage: p.usage ?? "",
      ingredients: p.ingredients ?? "",
      supplierId: p.supplierId ?? "",
      featured: p.featured,
    });
    setError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const priceCents = Math.round(parseFloat(form.price.replace(",", ".")) * 100);
    const costCents = Math.round(parseFloat(form.cost.replace(",", ".")) * 100);
    const payload = {
      name: form.name,
      category: form.category,
      priceCents,
      costCents,
      stock: Number(form.stock || 0),
      weight: form.weight,
      flavor: form.flavor,
      image: form.image,
      description: form.description,
      usage: form.usage,
      ingredients: form.ingredients,
      supplierId: form.supplierId || null,
      featured: form.featured,
    };
    try {
      const res = editingId
        ? await fetch(`/api/admin/produtos/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/produtos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível salvar.");
      } else {
        setForm({ ...EMPTY });
        setShowForm(false);
        setNotice(editingId ? "Produto atualizado." : "Produto adicionado.");
        setEditingId(null);
        router.refresh();
      }
    } catch {
      setError("Erro de conexao.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/produtos/${id}`, { method: "DELETE" });
      const data = await res.json();
      setNotice(
        data.softDeleted
          ? (data.message ?? "Produto desativado.")
          : "Produto excluido.",
      );
      router.refresh();
    } finally {
      setBusyId(null);
      setConfirmId(null);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-lime">
            Painel do proprietário
          </p>
          <h1 className="display text-4xl text-foreground md:text-5xl">Produtos</h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {products.length} cadastrados
          </p>
        </div>
        <Button onClick={() => (showForm ? setShowForm(false) : openCreate())}>
          {showForm ? (
            <>
              <X className="size-4" /> Fechar
            </>
          ) : (
            <>
              <Plus className="size-4" /> Novo produto
            </>
          )}
        </Button>
      </header>

      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-lime/40 bg-lime/5 px-4 py-2 text-sm text-lime">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Fechar aviso">
            <X className="size-4" />
          </button>
        </div>
      )}

      {showForm && (
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <PackagePlus className="size-5 text-lime" />
            <h2 className="display text-xl text-foreground">
              {editingId ? "Editar produto" : "Novo produto"}
            </h2>
          </div>
          <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="p-name">Nome *</Label>
              <Input id="p-name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-cat">Categoria *</Label>
              <select
                id="p-cat"
                value={form.category}
                onChange={(e) => set("category", e.target.value as Category)}
                className="flex h-11 w-full rounded-md border border-input bg-steel px-3 text-sm text-foreground focus-visible:border-lime focus-visible:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-stock">Estoque</Label>
              <Input id="p-stock" type="number" min={0} value={form.stock} onChange={(e) => set("stock", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-price">Preço de venda (R$) *</Label>
              <Input id="p-price" inputMode="decimal" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="149,90" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-cost">Custo (R$) *</Label>
              <Input id="p-cost" inputMode="decimal" value={form.cost} onChange={(e) => set("cost", e.target.value)} placeholder="78,00" required />
              <p className="font-mono text-xs text-muted-foreground">
                Usado só no painel para calcular o lucro. Nunca aparece na loja.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-weight">Peso / tamanho</Label>
              <Input id="p-weight" value={form.weight} onChange={(e) => set("weight", e.target.value)} placeholder="900g" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-flavor">Sabor</Label>
              <Input id="p-flavor" value={form.flavor} onChange={(e) => set("flavor", e.target.value)} placeholder="Chocolate" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-supplier">Fornecedor</Label>
              <select
                id="p-supplier"
                value={form.supplierId}
                onChange={(e) => set("supplierId", e.target.value)}
                className="flex h-11 w-full rounded-md border border-input bg-steel px-3 text-sm text-foreground focus-visible:border-lime focus-visible:outline-none"
              >
                <option value="">Sem fornecedor</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-img">URL da imagem</Label>
              <Input id="p-img" value={form.image} onChange={(e) => set("image", e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="p-desc">Descrição</Label>
              <Input id="p-desc" value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="p-usage">Modo de uso</Label>
              <Input id="p-usage" value={form.usage} onChange={(e) => set("usage", e.target.value)} placeholder="Ex.: 1 dose (30g) após o treino" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="p-ing">Ingredientes</Label>
              <Input id="p-ing" value={form.ingredients} onChange={(e) => set("ingredients", e.target.value)} />
            </div>
            <label className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="size-4 accent-lime" />
              <span className="text-sm text-foreground">Marcar como destaque</span>
            </label>

            {error && (
              <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive md:col-span-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 md:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? (<><Loader2 className="size-4 animate-spin" /> Salvando</>) : editingId ? "Salvar alterações" : "Salvar produto"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-xs uppercase text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Produto</th>
                <th className="pb-2 pr-4 font-medium">Categoria</th>
                <th className="pb-2 pr-4 font-medium">Preço</th>
                <th className="pb-2 pr-4 font-medium">Custo</th>
                <th className="pb-2 pr-4 font-medium">Margem</th>
                <th className="pb-2 pr-4 font-medium">Estoque</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const margin = p.priceCents > 0 ? (p.priceCents - p.costCents) / p.priceCents : 0;
                return (
                  <tr key={p.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-border bg-steel">
                          <Image src={p.image} alt={p.name} fill sizes="40px" className="object-cover" />
                        </div>
                        <p className="flex items-center gap-1.5 font-bold uppercase tracking-wide text-foreground">
                          {p.name}
                          {p.featured && <Star className="size-3.5 fill-lime text-lime" />}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{CATEGORY_LABEL[p.category]}</td>
                    <td className="py-3 pr-4 font-mono font-bold text-foreground">{formatBRL(p.priceCents)}</td>
                    <td className="py-3 pr-4 font-mono text-muted-foreground">{formatBRL(p.costCents)}</td>
                    <td className="py-3 pr-4 font-mono text-lime">{formatPercent(margin)}</td>
                    <td className="py-3 pr-4">
                      <span className={`font-mono ${p.stock <= 5 ? "text-destructive" : p.stock <= 12 ? "text-warning" : "text-foreground"}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {p.active ? <Badge variant="success">Ativo</Badge> : <Badge variant="muted">Inativo</Badge>}
                    </td>
                    <td className="py-3">
                      {confirmId === p.id ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => remove(p.id)} disabled={busyId === p.id} className="rounded-md bg-destructive px-2.5 py-1 text-xs font-semibold uppercase text-destructive-foreground hover:bg-destructive/85">
                            {busyId === p.id ? <Loader2 className="size-3.5 animate-spin" /> : "Confirmar"}
                          </button>
                          <button onClick={() => setConfirmId(null)} className="rounded-md border border-border px-2.5 py-1 text-xs font-semibold uppercase text-muted-foreground hover:text-foreground">Não</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(p)} aria-label={`Editar ${p.name}`} className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-steel hover:text-lime">
                            <Pencil className="size-4" />
                          </button>
                          <button onClick={() => setConfirmId(p.id)} aria-label={`Excluir ${p.name}`} className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center font-mono text-xs text-muted-foreground">Nenhum produto cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          <AlertTriangle className="size-3.5 text-warning" />
          Produtos que já tem pedidos são desativados em vez de excluidos, para preservar o histórico.
        </p>
      </Card>
    </div>
  );
}
