"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  X,
  Loader2,
  Trash2,
  Building2,
  Mail,
  Phone,
  MapPin,
  User,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type Supplier = {
  id: string;
  name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  contactName: string | null;
  city: string | null;
  state: string | null;
  supplies: string | null;
  notes: string | null;
  active: boolean;
};

const EMPTY = {
  name: "",
  cnpj: "",
  email: "",
  phone: "",
  contactName: "",
  city: "",
  state: "",
  supplies: "",
  notes: "",
};

export function SuppliersManager({ suppliers }: { suppliers: Supplier[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ ...EMPTY });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/fornecedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível salvar.");
      } else {
        setForm({ ...EMPTY });
        setShowForm(false);
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
      await fetch(`/api/admin/fornecedores/${id}`, { method: "DELETE" });
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
          <h1 className="display text-4xl text-foreground md:text-5xl">
            Fornecedores
          </h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {suppliers.length} cadastrados
          </p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          {showForm ? (
            <>
              <X className="size-4" /> Fechar
            </>
          ) : (
            <>
              <Plus className="size-4" /> Novo fornecedor
            </>
          )}
        </Button>
      </header>

      {showForm && (
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="size-5 text-lime" />
            <h2 className="display text-xl text-foreground">Novo fornecedor</h2>
          </div>
          <form onSubmit={create} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="s-name">Nome / Razao social *</Label>
              <Input
                id="s-name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-cnpj">CNPJ</Label>
              <Input
                id="s-cnpj"
                value={form.cnpj}
                onChange={(e) => set("cnpj", e.target.value)}
                placeholder="00.000.000/0001-00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-contact">Pessoa de contato</Label>
              <Input
                id="s-contact"
                value={form.contactName}
                onChange={(e) => set("contactName", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-email">Email</Label>
              <Input
                id="s-email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-phone">Telefone</Label>
              <Input
                id="s-phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="(11) 90000-0000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-city">Cidade</Label>
              <Input
                id="s-city"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-state">Estado (UF)</Label>
              <Input
                id="s-state"
                value={form.state}
                onChange={(e) => set("state", e.target.value.toUpperCase())}
                maxLength={2}
                placeholder="SP"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="s-supplies">O que fornece</Label>
              <Input
                id="s-supplies"
                value={form.supplies}
                onChange={(e) => set("supplies", e.target.value)}
                placeholder="Ex.: Whey, creatina, embalagens"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="s-notes">Observações</Label>
              <Input
                id="s-notes"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Prazo de entrega, condições de pagamento, etc."
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive md:col-span-2"
              >
                {error}
              </p>
            )}

            <div className="flex gap-3 md:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Salvando
                  </>
                ) : (
                  "Salvar fornecedor"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {suppliers.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <Building2 className="size-12 text-muted-foreground/40" />
          <p className="font-mono text-sm text-muted-foreground">
            Nenhum fornecedor cadastrado ainda.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {suppliers.map((s) => (
            <Card key={s.id} className="flex flex-col p-5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold uppercase tracking-wide text-foreground">
                    {s.name}
                  </h3>
                  {s.cnpj && (
                    <p className="font-mono text-xs text-muted-foreground">
                      {s.cnpj}
                    </p>
                  )}
                </div>
                {confirmId === s.id ? (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => remove(s.id)}
                      disabled={busyId === s.id}
                      className="rounded-md bg-destructive px-2 py-1 text-xs font-semibold uppercase text-destructive-foreground"
                    >
                      {busyId === s.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        "Excluir"
                      )}
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="rounded-md border border-border px-2 py-1 text-xs uppercase text-muted-foreground"
                    >
                      Não
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(s.id)}
                    aria-label={`Excluir ${s.name}`}
                    className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>

              {s.supplies && (
                <Badge variant="outline" className="mb-3 w-fit">
                  {s.supplies}
                </Badge>
              )}

              <dl className="space-y-1.5 text-sm text-muted-foreground">
                {s.contactName && (
                  <div className="flex items-center gap-2">
                    <User className="size-3.5 text-lime" />
                    {s.contactName}
                  </div>
                )}
                {s.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="size-3.5 text-lime" />
                    <span className="break-all">{s.email}</span>
                  </div>
                )}
                {s.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="size-3.5 text-lime" />
                    {s.phone}
                  </div>
                )}
                {(s.city || s.state) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="size-3.5 text-lime" />
                    {[s.city, s.state].filter(Boolean).join(" / ")}
                  </div>
                )}
              </dl>

              {s.notes && (
                <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                  {s.notes}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
