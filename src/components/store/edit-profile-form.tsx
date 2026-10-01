"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { maskCpf, maskCep } from "@/shared/format";

type Profile = {
  name: string;
  cpf: string;
  cep: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export function EditProfileForm({ initial }: { initial: Profile }) {
  const router = useRouter();
  const [f, setF] = React.useState({
    ...initial,
    cpf: maskCpf(initial.cpf),
    cep: maskCep(initial.cep),
  });
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState("");
  const set = (k: keyof Profile, v: string) => setF((p) => ({ ...p, [k]: v }));

  // Busca CEP (ViaCEP)
  React.useEffect(() => {
    const digits = f.cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    let cancel = false;
    fetch(`https://viacep.com.br/ws/${digits}/json/`)
      .then((r) => r.json())
      .then((d) => {
        if (cancel || d.erro) return;
        setF((p) => ({
          ...p,
          address: d.logradouro || p.address,
          neighborhood: d.bairro || p.neighborhood,
          city: d.localidade || p.city,
          state: d.uf || p.state,
        }));
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, [f.cep]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/conta/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Não foi possível salvar.");
      else {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-1.5 md:col-span-2">
        <Label>Nome completo</Label>
        <Input value={f.name} onChange={(e) => set("name", e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label>CPF</Label>
        <Input value={f.cpf} onChange={(e) => set("cpf", maskCpf(e.target.value))} inputMode="numeric" maxLength={14} />
      </div>
      <div className="space-y-1.5">
        <Label>CEP</Label>
        <Input value={f.cep} onChange={(e) => set("cep", maskCep(e.target.value))} inputMode="numeric" maxLength={9} />
      </div>
      <div className="space-y-1.5">
        <Label>Endereço</Label>
        <Input value={f.address} onChange={(e) => set("address", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Número</Label>
        <Input value={f.number} onChange={(e) => set("number", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Complemento</Label>
        <Input value={f.complement} onChange={(e) => set("complement", e.target.value)} placeholder="Ex.: apt 102 (opcional)" />
      </div>
      <div className="space-y-1.5">
        <Label>Bairro</Label>
        <Input value={f.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
      </div>
      <div className="grid grid-cols-[1fr_90px] gap-3">
        <div className="space-y-1.5">
          <Label>Cidade</Label>
          <Input value={f.city} onChange={(e) => set("city", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>UF</Label>
          <Input value={f.state} onChange={(e) => set("state", e.target.value.toUpperCase())} maxLength={2} />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive md:col-span-2">
          {error}
        </p>
      )}
      <div className="md:col-span-2">
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Salvando
            </>
          ) : saved ? (
            <>
              <Check className="size-4" /> Salvo
            </>
          ) : (
            "Salvar alterações"
          )}
        </Button>
      </div>
    </form>
  );
}
