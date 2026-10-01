"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/shared/utils";
import type { OrderStatus } from "@prisma/client";

const FLOW: { key: OrderStatus; label: string }[] = [
  { key: "PENDENTE", label: "Pendente" },
  { key: "PAGO", label: "Pago" },
  { key: "ENVIADO", label: "Enviado" },
  { key: "ENTREGUE", label: "Entregue" },
  { key: "CANCELADO", label: "Cancelado" },
];

export function OrderStatusEditor({
  reference,
  initialStatus,
  initialTracking,
  initialNote,
}: {
  reference: string;
  initialStatus: OrderStatus;
  initialTracking: string | null;
  initialNote: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = React.useState<OrderStatus>(initialStatus);
  const [tracking, setTracking] = React.useState(initialTracking ?? "");
  const [note, setNote] = React.useState(initialNote ?? "");
  const [changing, setChanging] = React.useState<OrderStatus | null>(null);
  const [savingInfo, setSavingInfo] = React.useState(false);
  const [savedInfo, setSavedInfo] = React.useState(false);

  async function patch(body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/pedidos/${reference}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  }

  async function changeStatus(next: OrderStatus) {
    if (next === status) return;
    setChanging(next);
    const ok = await patch({ status: next });
    if (ok) {
      setStatus(next);
      router.refresh();
    }
    setChanging(null);
  }

  async function saveInfo() {
    setSavingInfo(true);
    setSavedInfo(false);
    const ok = await patch({ trackingCode: tracking, shippingNote: note });
    if (ok) {
      setSavedInfo(true);
      router.refresh();
      setTimeout(() => setSavedInfo(false), 2500);
    }
    setSavingInfo(false);
  }

  return (
    <Card className="p-5">
      <h2 className="display mb-1 text-xl text-foreground">
        Status do <span className="text-lime">pedido</span>
      </h2>
      <p className="mb-4 font-mono text-xs text-muted-foreground">
        Clique para mudar a situação
      </p>

      <div className="flex flex-wrap gap-2">
        {FLOW.map((s) => {
          const active = status === s.key;
          const danger = s.key === "CANCELADO";
          return (
            <button
              key={s.key}
              onClick={() => changeStatus(s.key)}
              disabled={changing !== null}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold uppercase tracking-wide transition-colors",
                active
                  ? danger
                    ? "border-destructive bg-destructive/15 text-destructive"
                    : "border-lime bg-lime/15 text-lime"
                  : "border-border text-muted-foreground hover:border-lime/50 hover:text-foreground",
              )}
            >
              {changing === s.key ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : active ? (
                <Check className="size-3.5" />
              ) : null}
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-4 border-t border-border pt-5">
        <div className="flex items-center gap-2">
          <Truck className="size-4 text-lime" />
          <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
            Envio
          </h3>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tracking">Código de rastreio</Label>
          <Input
            id="tracking"
            value={tracking}
            onChange={(e) => setTracking(e.target.value.toUpperCase())}
            placeholder="Ex.: BR123456789BR"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="note">Observação de envio</Label>
          <Input
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex.: Enviado pelos Correios, PAC"
          />
        </div>
        <Button onClick={saveInfo} disabled={savingInfo}>
          {savingInfo ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Salvando
            </>
          ) : savedInfo ? (
            <>
              <Check className="size-4" /> Salvo
            </>
          ) : (
            "Salvar envio"
          )}
        </Button>
      </div>
    </Card>
  );
}
