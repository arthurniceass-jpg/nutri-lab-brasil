"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Boxes,
  Minus,
  Plus,
  Check,
  Loader2,
  DollarSign,
  Tag,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/shared/format";
import { CATEGORY_LABEL } from "@/shared/categories";
import type { Category } from "@prisma/client";

type Product = {
  id: string;
  name: string;
  category: Category;
  stock: number;
  priceCents: number;
  costCents: number;
  image: string;
};

const LOW = 12;

function StockRow({
  product,
  onSaved,
}: {
  product: Product;
  onSaved: () => void;
}) {
  const [value, setValue] = React.useState(product.stock);
  const [saving, setSaving] = React.useState(false);
  const changed = value !== product.stock;

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/admin/produtos/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: value }),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const status =
    product.stock <= 0
      ? { label: "Esgotado", variant: "danger" as const }
      : product.stock <= 5
        ? { label: "Critico", variant: "danger" as const }
        : product.stock <= LOW
          ? { label: "Baixo", variant: "warning" as const }
          : { label: "Em estoque", variant: "success" as const };

  return (
    <tr className="border-b border-border/50 last:border-0">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-border bg-steel">
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="40px"
              className="object-cover"
            />
          </div>
          <div>
            <p className="font-bold uppercase tracking-wide text-foreground">
              {product.name}
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              {CATEGORY_LABEL[product.category]}
            </p>
          </div>
        </div>
      </td>
      <td className="py-3 pr-4">
        <Badge variant={status.variant}>{status.label}</Badge>
      </td>
      <td className="py-3 pr-4 font-mono text-muted-foreground">
        {formatBRL(product.costCents * product.stock)}
      </td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-border">
            <button
              onClick={() => setValue((v) => Math.max(0, v - 1))}
              aria-label="Diminuir"
              className="flex size-8 items-center justify-center text-muted-foreground hover:text-lime"
            >
              <Minus className="size-3.5" />
            </button>
            <input
              type="number"
              min={0}
              value={value}
              onChange={(e) =>
                setValue(Math.max(0, Math.round(Number(e.target.value) || 0)))
              }
              aria-label={`Estoque de ${product.name}`}
              className="w-14 bg-transparent text-center font-mono text-sm font-bold text-foreground focus:outline-none"
            />
            <button
              onClick={() => setValue((v) => v + 1)}
              aria-label="Aumentar"
              className="flex size-8 items-center justify-center text-muted-foreground hover:text-lime"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          {changed && (
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1 rounded-md bg-lime px-2.5 py-1.5 text-xs font-semibold uppercase text-ink hover:bg-lime-glow"
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <>
                  <Check className="size-3.5" /> Salvar
                </>
              )}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export function StockManager({ products }: { products: Product[] }) {
  const router = useRouter();

  const totalUnits = products.reduce((s, p) => s + p.stock, 0);
  const costValue = products.reduce((s, p) => s + p.costCents * p.stock, 0);
  const saleValue = products.reduce((s, p) => s + p.priceCents * p.stock, 0);
  const lowCount = products.filter((p) => p.stock <= LOW).length;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-lime">
          Painel do proprietário
        </p>
        <h1 className="display text-4xl text-foreground md:text-5xl">Estoque</h1>
        <p className="mt-1 font-mono text-sm text-muted-foreground">
          {products.length} produtos ativos
        </p>
      </header>

      {/* Resumo */}
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <SummaryCard
          icon={<Boxes className="size-5" />}
          label="Unidades em estoque"
          value={String(totalUnits)}
        />
        <SummaryCard
          icon={<DollarSign className="size-5" />}
          label="Valor em custo"
          value={formatBRL(costValue)}
        />
        <SummaryCard
          icon={<Tag className="size-5" />}
          label="Valor em venda"
          value={formatBRL(saleValue)}
        />
        <SummaryCard
          icon={<AlertTriangle className="size-5" />}
          label="Produtos com estoque baixo"
          value={String(lowCount)}
          warn={lowCount > 0}
        />
      </section>

      <Card className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-xs uppercase text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Produto</th>
                <th className="pb-2 pr-4 font-medium">Situação</th>
                <th className="pb-2 pr-4 font-medium">Valor em custo</th>
                <th className="pb-2 font-medium">Ajustar estoque</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <StockRow
                  key={p.id}
                  product={p}
                  onSaved={() => router.refresh()}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  warn,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 card-grain">
      <div className="flex items-center gap-2">
        <div
          className={`flex size-9 items-center justify-center rounded-md ${warn ? "bg-warning/10 text-warning" : "bg-lime/10 text-lime"}`}
        >
          {icon}
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="display mt-3 text-3xl text-foreground">{value}</p>
    </div>
  );
}
