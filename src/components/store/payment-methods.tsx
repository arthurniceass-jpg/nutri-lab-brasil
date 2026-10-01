"use client";

import * as React from "react";
import {
  QrCode,
  CreditCard,
  Barcode,
  Copy,
  Check,
  Loader2,
  Info,
  Clock,
  RefreshCw,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/shared/format";
import { cn } from "@/shared/utils";

type Method = "pix" | "cartão" | "boleto";

const PIX_TTL = 10 * 60; // 10 minutos

// Grade pseudo-aleatoria deterministica que imita um QR code (decorativo).
function useQrCells(seed: string, size = 25) {
  return React.useMemo(() => {
    let h = 0;
    for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    let x = h || 1;
    const cells: boolean[] = [];
    for (let i = 0; i < size * size; i++) {
      x = (x * 1103515245 + 12345) & 0x7fffffff;
      cells.push(((x >> 16) & 1) === 1);
    }
    return cells;
  }, [seed, size]);
}

// String "copia e cola" ficticia no formato EMV do Pix (apenas demonstração).
function pixCode(reference: string, totalCents: number) {
  const val = (totalCents / 100).toFixed(2);
  return `00020126580014BR.GOV.BCB.PIX0136${reference}-nutrilab5204000053039865406${val}5802BR5913NUTRI LAB LTDA6009SAO PAULO62070503***6304DEMO`;
}

export function PaymentMethods({
  reference,
  totalCents,
  methods = { pix: true, cartão: true, boleto: true },
}: {
  reference: string;
  totalCents: number;
  methods?: { pix: boolean; cartão: boolean; boleto: boolean };
}) {
  const enabled = (["pix", "cartão", "boleto"] as Method[]).filter(
    (m) => methods[m],
  );
  const [method, setMethod] = React.useState<Method>(enabled[0] ?? "pix");
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [secondsLeft, setSecondsLeft] = React.useState(PIX_TTL);
  const [autoWaiting, setAutoWaiting] = React.useState(false);

  const cells = useQrCells(reference);
  const code = pixCode(reference, totalCents);
  const expired = secondsLeft <= 0;
  const size = 25;

  // Contagem regressiva do Pix (pausa durante a confirmação automática).
  React.useEffect(() => {
    if (autoWaiting) return;
    const id = setInterval(
      () => setSecondsLeft((s) => (s <= 0 ? 0 : s - 1)),
      1000,
    );
    return () => clearInterval(id);
  }, [autoWaiting]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  function goToSuccess() {
    window.location.href = `/checkout/sucesso?ref=${reference}&sim=1`;
  }

  function confirm() {
    setLoading(true);
    goToSuccess();
  }

  // Simula a notificação automática do provedor (webhook).
  function autoConfirm() {
    setAutoWaiting(true);
    setTimeout(goToSuccess, 2600);
  }

  function regenerate() {
    setSecondsLeft(PIX_TTL);
    setCopied(false);
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignora */
    }
  }

  // Tela de espera da confirmação automática
  if (autoWaiting) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card p-10 text-center card-grain">
        <Loader2 className="size-12 animate-spin text-lime" />
        <h2 className="display text-2xl text-foreground">
          Aguardando <span className="text-lime">confirmação</span>
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Isso simula a notificação automática do provedor de pagamento
          (webhook). Assim que o pagamento e aprovado, o pedido e confirmado
          sozinho.
        </p>
        <p className="font-mono text-xs text-muted-foreground">{reference}</p>
      </div>
    );
  }

  const payDisabled = loading || (method === "pix" && expired);

  return (
    <div className="rounded-lg border border-border bg-card p-5 card-grain">
      {/* Aviso de ambiente de demonstração */}
      <div className="mb-5 flex items-start gap-2 rounded-md border border-lime/30 bg-lime/5 px-3 py-2">
        <Info className="mt-0.5 size-4 shrink-0 text-lime" />
        <p className="text-xs text-muted-foreground">
          Ambiente de demonstração. Nenhuma cobranca real e feita. Com o token
          do Mercado Pago configurado, esta etapa passa a usar o checkout oficial
          (Pix, cartão e boleto reais).
        </p>
      </div>

      {/* Seletor de metodo */}
      <div
        role="tablist"
        aria-label="Forma de pagamento"
        className="mb-6 grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${Math.max(1, enabled.length)}, minmax(0, 1fr))`,
        }}
      >
        {methods.pix && (
          <MethodTab
            active={method === "pix"}
            onClick={() => setMethod("pix")}
            icon={<QrCode className="size-5" />}
            label="Pix"
          />
        )}
        {methods.cartão && (
          <MethodTab
            active={method === "cartão"}
            onClick={() => setMethod("cartão")}
            icon={<CreditCard className="size-5" />}
            label="Cartão"
          />
        )}
        {methods.boleto && (
          <MethodTab
            active={method === "boleto"}
            onClick={() => setMethod("boleto")}
            icon={<Barcode className="size-5" />}
            label="Boleto"
          />
        )}
      </div>

      {/* PIX */}
      {method === "pix" && (
        <div className="flex flex-col items-center gap-4">
          {/* Contagem regressiva */}
          <div
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-sm",
              expired
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-lime/40 bg-lime/5 text-lime",
            )}
            role="timer"
            aria-live="polite"
          >
            <Clock className="size-4" />
            {expired ? (
              <span>Código expirado</span>
            ) : (
              <span>
                Expira em {mm}:{ss}
              </span>
            )}
          </div>

          {expired ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <p className="max-w-xs text-center text-sm text-muted-foreground">
                O código Pix expirou. Gere um novo para continuar com o
                pagamento.
              </p>
              <Button variant="outline" onClick={regenerate}>
                <RefreshCw className="size-4" /> Gerar novo código
              </Button>
            </div>
          ) : (
            <>
              <p className="text-center text-sm text-muted-foreground">
                Escaneie o QR code ou use o código copia e cola.
              </p>
              <div className="rounded-lg bg-white p-3">
                <svg
                  width="200"
                  height="200"
                  viewBox={`0 0 ${size} ${size}`}
                  role="img"
                  aria-label="QR code Pix (demonstração)"
                  shapeRendering="crispEdges"
                >
                  <rect width={size} height={size} fill="#fff" />
                  {cells.map((on, i) =>
                    on ? (
                      <rect
                        key={i}
                        x={i % size}
                        y={Math.floor(i / size)}
                        width={1}
                        height={1}
                        fill="#0A0A0A"
                      />
                    ) : null,
                  )}
                  {[
                    [0, 0],
                    [size - 7, 0],
                    [0, size - 7],
                  ].map(([fx, fy], k) => (
                    <g key={k} fill="#0A0A0A">
                      <rect x={fx} y={fy} width={7} height={1} />
                      <rect x={fx} y={fy + 6} width={7} height={1} />
                      <rect x={fx} y={fy} width={1} height={7} />
                      <rect x={fx + 6} y={fy} width={1} height={7} />
                      <rect x={fx + 2} y={fy + 2} width={3} height={3} />
                    </g>
                  ))}
                </svg>
              </div>
              <p className="display text-2xl text-lime">
                {formatBRL(totalCents)}
              </p>

              <button
                onClick={copyCode}
                className="flex w-full min-w-0 items-center justify-between gap-2 rounded-md border border-border bg-steel px-3 py-2.5 text-left transition-colors hover:border-lime"
              >
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
                  {code}
                </span>
                {copied ? (
                  <Check className="size-4 shrink-0 text-lime" />
                ) : (
                  <Copy className="size-4 shrink-0 text-muted-foreground" />
                )}
              </button>
              {copied && (
                <p className="font-mono text-xs text-lime">Código copiado!</p>
              )}
            </>
          )}
        </div>
      )}

      {/* CARTAO (dados de teste, sem processamento real) */}
      {method === "cartão" && (
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-1.5">
            <Label htmlFor="card-number">Número do cartão</Label>
            <Input
              id="card-number"
              inputMode="numeric"
              defaultValue="5031 4332 1540 6351"
              autoComplete="off"
            />
            <p className="font-mono text-xs text-muted-foreground">
              Cartão de teste já preenchido. Não use dados reais aqui.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="card-exp">Validade</Label>
              <Input id="card-exp" defaultValue="11/30" autoComplete="off" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="card-cvv">CVV</Label>
              <Input id="card-cvv" defaultValue="123" autoComplete="off" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="card-name">Nome no cartão</Label>
            <Input id="card-name" defaultValue="APRO TESTE" autoComplete="off" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="card-parcelas">Parcelas</Label>
            <select
              id="card-parcelas"
              className="flex h-11 w-full rounded-md border border-input bg-steel px-3 text-sm text-foreground focus-visible:border-lime focus-visible:outline-none"
              defaultValue="1"
            >
              {[1, 2, 3, 6, 12].map((n) => (
                <option key={n} value={n}>
                  {n}x de {formatBRL(Math.round(totalCents / n))}
                  {n === 1 ? " a vista" : " sem juros"}
                </option>
              ))}
            </select>
          </div>
        </form>
      )}

      {/* BOLETO */}
      {method === "boleto" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            O boleto vence em 3 dias úteis. A confirmação do pagamento pode levar
            até 2 dias úteis.
          </p>
          <div className="rounded-md border border-border bg-steel p-4">
            <div className="mb-3 flex h-14 items-end gap-[2px]">
              {Array.from({ length: 70 }).map((_, i) => (
                <span
                  key={i}
                  className="block bg-foreground"
                  style={{
                    width: i % 3 === 0 ? 3 : 1.5,
                    height: "100%",
                    opacity: i % 2 === 0 ? 1 : 0.5,
                  }}
                />
              ))}
            </div>
            <p className="break-all font-mono text-xs text-muted-foreground">
              23793.38128 60007.812637 95000.063305 4 10120000
              {String(totalCents).padStart(10, "0")}
            </p>
          </div>
          <p className="display text-2xl text-lime">{formatBRL(totalCents)}</p>
        </div>
      )}

      {!(method === "pix" && expired) && (
        <Button
          className="mt-6 w-full"
          size="lg"
          onClick={confirm}
          disabled={payDisabled}
        >
          {loading ? (
            <>
              <Loader2 className="size-5 animate-spin" /> Processando
            </>
          ) : method === "pix" ? (
            "Já paguei com Pix"
          ) : method === "boleto" ? (
            "Confirmar e gerar boleto"
          ) : (
            "Pagar com cartão"
          )}
        </Button>
      )}

      {/* Atalho de demonstração: confirma sozinho como faria o webhook */}
      <button
        onClick={autoConfirm}
        disabled={method === "pix" && expired}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-lime/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-lime transition-colors hover:bg-lime/5 disabled:opacity-40"
      >
        <Zap className="size-4" />
        Simular confirmação automática (webhook)
      </button>
    </div>
  );
}

function MethodTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-md border px-3 py-4 text-sm font-semibold uppercase tracking-wide transition-colors",
        active
          ? "border-lime bg-lime/10 text-lime"
          : "border-border bg-steel text-muted-foreground hover:border-lime/50 hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
