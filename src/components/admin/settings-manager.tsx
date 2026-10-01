"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  Truck,
  CreditCard,
  Ticket,
  Loader2,
  Check,
  Plus,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatBRL, formatNumber } from "@/shared/format";
import type { CouponType } from "@prisma/client";

type Settings = {
  storeName: string;
  slogan: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  cnpj: string | null;
  address: string | null;
  freeShippingCents: number;
  defaultShippingCents: number;
  mpAccessToken: string | null;
  pixEnabled: boolean;
  cardEnabled: boolean;
  boletoEnabled: boolean;
  lowStockThreshold: number;
};

type Coupon = {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minSubtotalCents: number;
  active: boolean;
  timesRedeemed: number;
};

const reais = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");
const toCents = (s: string) =>
  Math.round(parseFloat(String(s).replace(",", ".")) * 100) || 0;

export function SettingsManager({
  settings,
  coupons,
}: {
  settings: Settings;
  coupons: Coupon[];
}) {
  const router = useRouter();
  const [savingSection, setSavingSection] = React.useState<string | null>(null);
  const [savedSection, setSavedSection] = React.useState<string | null>(null);

  async function save(section: string, patch: Record<string, unknown>) {
    setSavingSection(section);
    setSavedSection(null);
    try {
      const res = await fetch("/api/admin/configuracoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        setSavedSection(section);
        router.refresh();
        setTimeout(() => setSavedSection(null), 2500);
      }
    } finally {
      setSavingSection(null);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-lime">
          Painel do proprietário
        </p>
        <h1 className="display text-4xl text-foreground md:text-5xl">
          Configurações
        </h1>
      </header>

      <StoreSection settings={settings} save={save} saving={savingSection} saved={savedSection} />
      <ShippingSection settings={settings} save={save} saving={savingSection} saved={savedSection} />
      <PaymentSection settings={settings} save={save} saving={savingSection} saved={savedSection} />
      <CouponsSection coupons={coupons} />
    </div>
  );
}

function SaveButton({
  section,
  saving,
  saved,
}: {
  section: string;
  saving: string | null;
  saved: string | null;
}) {
  return (
    <Button type="submit" disabled={saving === section}>
      {saving === section ? (
        <>
          <Loader2 className="size-4 animate-spin" /> Salvando
        </>
      ) : saved === section ? (
        <>
          <Check className="size-4" /> Salvo
        </>
      ) : (
        "Salvar"
      )}
    </Button>
  );
}

function SectionHeader({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex size-9 items-center justify-center rounded-md bg-lime/10 text-lime">
        {icon}
      </div>
      <div>
        <h2 className="display text-xl text-foreground">{title}</h2>
        <p className="font-mono text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

/* ---- Dados da loja ---- */
function StoreSection({ settings, save, saving, saved }: any) {
  const [f, setF] = React.useState({
    storeName: settings.storeName,
    slogan: settings.slogan,
    email: settings.email,
    phone: settings.phone ?? "",
    whatsapp: settings.whatsapp ?? "",
    instagram: settings.instagram ?? "",
    cnpj: settings.cnpj ?? "",
    address: settings.address ?? "",
  });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  return (
    <Card className="p-5">
      <SectionHeader
        icon={<Store className="size-5" />}
        title="Dados da loja"
        desc="Aparecem no rodapé e nos contatos"
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save("store", f);
        }}
        className="grid gap-4 md:grid-cols-2"
      >
        <Field label="Nome da loja" v={f.storeName} on={(v) => set("storeName", v)} />
        <Field label="Slogan" v={f.slogan} on={(v) => set("slogan", v)} />
        <Field label="Email" type="email" v={f.email} on={(v) => set("email", v)} />
        <Field label="WhatsApp" v={f.whatsapp} on={(v) => set("whatsapp", v)} placeholder="(11) 90000-0000" />
        <Field label="Telefone" v={f.phone} on={(v) => set("phone", v)} />
        <Field label="Instagram" v={f.instagram} on={(v) => set("instagram", v)} placeholder="@nutrilab" />
        <Field label="CNPJ" v={f.cnpj} on={(v) => set("cnpj", v)} />
        <Field label="Endereço" v={f.address} on={(v) => set("address", v)} />
        <div className="md:col-span-2">
          <SaveButton section="store" saving={saving} saved={saved} />
        </div>
      </form>
    </Card>
  );
}

/* ---- Frete ---- */
function ShippingSection({ settings, save, saving, saved }: any) {
  const [free, setFree] = React.useState(reais(settings.freeShippingCents));
  const [def, setDef] = React.useState(reais(settings.defaultShippingCents));

  return (
    <Card className="p-5">
      <SectionHeader
        icon={<Truck className="size-5" />}
        title="Frete"
        desc="Valores usados na loja e no checkout"
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save("ship", {
            freeShippingCents: toCents(free),
            defaultShippingCents: toCents(def),
          });
        }}
        className="grid gap-4 md:grid-cols-2"
      >
        <div className="space-y-1.5">
          <Label>Frete grátis a partir de (R$)</Label>
          <Input inputMode="decimal" value={free} onChange={(e) => setFree(e.target.value)} />
          <p className="font-mono text-xs text-muted-foreground">
            Compras acima desse valor tem frete grátis.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label>Valor do frete padrão (R$)</Label>
          <Input inputMode="decimal" value={def} onChange={(e) => setDef(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <SaveButton section="ship" saving={saving} saved={saved} />
        </div>
      </form>
    </Card>
  );
}

/* ---- Pagamento ---- */
function PaymentSection({ settings, save, saving, saved }: any) {
  const [token, setToken] = React.useState(settings.mpAccessToken ?? "");
  const [pix, setPix] = React.useState(settings.pixEnabled);
  const [card, setCard] = React.useState(settings.cardEnabled);
  const [boleto, setBoleto] = React.useState(settings.boletoEnabled);

  return (
    <Card className="p-5">
      <SectionHeader
        icon={<CreditCard className="size-5" />}
        title="Pagamento"
        desc="Mercado Pago e metodos aceitos"
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save("pay", {
            mpAccessToken: token,
            pixEnabled: pix,
            cardEnabled: card,
            boletoEnabled: boleto,
          });
        }}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <Label>Access Token do Mercado Pago</Label>
          <Input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="APP_USR-..."
            autoComplete="off"
          />
          <p className="font-mono text-xs text-muted-foreground">
            Com o token preenchido, o checkout usa o Mercado Pago real. Vazio =
            modo de demonstração.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Toggle label="Pix" checked={pix} on={setPix} />
          <Toggle label="Cartão" checked={card} on={setCard} />
          <Toggle label="Boleto" checked={boleto} on={setBoleto} />
        </div>
        <SaveButton section="pay" saving={saving} saved={saved} />
      </form>
    </Card>
  );
}

/* ---- Cupons ---- */
function CouponsSection({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const [code, setCode] = React.useState("");
  const [type, setType] = React.useState<CouponType>("PERCENT");
  const [value, setValue] = React.useState("");
  const [min, setMin] = React.useState("");
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      code,
      type,
      value: type === "PERCENT" ? Number(value) : toCents(value),
      minSubtotalCents: min ? toCents(min) : 0,
    };
    try {
      const res = await fetch("/api/admin/cupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Erro ao criar cupom.");
      else {
        setCode(""); setValue(""); setMin("");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggle(c: Coupon) {
    setBusyId(c.id);
    await fetch(`/api/admin/cupons/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !c.active }),
    });
    router.refresh();
    setBusyId(null);
  }

  async function remove(c: Coupon) {
    setBusyId(c.id);
    await fetch(`/api/admin/cupons/${c.id}`, { method: "DELETE" });
    router.refresh();
    setBusyId(null);
  }

  return (
    <Card className="p-5">
      <SectionHeader
        icon={<Ticket className="size-5" />}
        title="Cupons de desconto"
        desc="Crie e gerencie os cupons da loja"
      />

      <form onSubmit={create} className="mb-6 grid gap-3 md:grid-cols-5">
        <div className="space-y-1.5 md:col-span-2">
          <Label>Código</Label>
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="BLACK20" className="uppercase" required />
        </div>
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as CouponType)}
            className="flex h-11 w-full rounded-md border border-input bg-steel px-3 text-sm text-foreground focus-visible:border-lime focus-visible:outline-none"
          >
            <option value="PERCENT">Percentual (%)</option>
            <option value="FIXED">Valor fixo (R$)</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>{type === "PERCENT" ? "Desconto (%)" : "Desconto (R$)"}</Label>
          <Input inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Mínimo (R$)</Label>
          <Input inputMode="decimal" value={min} onChange={(e) => setMin(e.target.value)} placeholder="0" />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive md:col-span-5">
            {error}
          </p>
        )}
        <div className="md:col-span-5">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <><Plus className="size-4" /> Criar cupom</>}
          </Button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left font-mono text-xs uppercase text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">Código</th>
              <th className="pb-2 pr-4 font-medium">Desconto</th>
              <th className="pb-2 pr-4 font-medium">Mínimo</th>
              <th className="pb-2 pr-4 font-medium">Usos</th>
              <th className="pb-2 pr-4 font-medium">Status</th>
              <th className="pb-2 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-border/50 last:border-0">
                <td className="py-3 pr-4 font-mono font-bold text-lime">{c.code}</td>
                <td className="py-3 pr-4 text-foreground">
                  {c.type === "PERCENT" ? `${c.value}%` : formatBRL(c.value)}
                </td>
                <td className="py-3 pr-4 font-mono text-muted-foreground">
                  {c.minSubtotalCents > 0 ? formatBRL(c.minSubtotalCents) : "-"}
                </td>
                <td className="py-3 pr-4 font-mono text-muted-foreground">
                  {formatNumber(c.timesRedeemed)}
                </td>
                <td className="py-3 pr-4">
                  {c.active ? (
                    <Badge variant="success">Ativo</Badge>
                  ) : (
                    <Badge variant="muted">Inativo</Badge>
                  )}
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggle(c)}
                      disabled={busyId === c.id}
                      className="rounded-md border border-border px-2.5 py-1 text-xs font-semibold uppercase text-muted-foreground hover:border-lime hover:text-lime"
                    >
                      {c.active ? "Desativar" : "Ativar"}
                    </button>
                    <button
                      onClick={() => remove(c)}
                      disabled={busyId === c.id}
                      aria-label={`Excluir ${c.code}`}
                      className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center font-mono text-xs text-muted-foreground">
                  Nenhum cupom cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ---- helpers de UI ---- */
function Field({
  label,
  v,
  on,
  type = "text",
  placeholder,
}: {
  label: string;
  v: string;
  on: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={v} onChange={(e) => on(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function Toggle({
  label,
  checked,
  on,
}: {
  label: string;
  checked: boolean;
  on: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => on(e.target.checked)}
        className="size-4 accent-lime"
      />
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );
}
