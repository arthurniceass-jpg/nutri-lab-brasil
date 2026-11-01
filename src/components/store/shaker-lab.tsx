"use client";

import * as React from "react";
import Image from "next/image";
import { Check, Copy, MessageCircle, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { formatBRL } from "@/shared/format";
import { cn } from "@/shared/utils";
import type { ProductDTO } from "@/shared/types";

type SlotKey = "whey" | "cre" | "pre";
type SlotState = { on: boolean; id: string; fl: string };
type Slots = Record<SlotKey, SlotState>;
type GoalKey = "massa" | "definicao" | "energia";

const SLOTS: { key: SlotKey; label: string; hint: string }[] = [
  { key: "whey", label: "Proteína", hint: "whey para o pós-treino" },
  { key: "cre", label: "Creatina", hint: "todos os dias" },
  { key: "pre", label: "Pré-treino", hint: "antes de treinar" },
];

const GOALS: { key: GoalKey; label: string }[] = [
  { key: "massa", label: "Ganhar massa" },
  { key: "definicao", label: "Definição" },
  { key: "energia", label: "Energia no treino" },
];

/* cores do pó no shaker */
const FLAVOR_COLOR: Record<string, string> = {
  chocolate: "#6b4430",
  baunilha: "#efe0b0",
  morango: "#f08aa6",
  "doce de leite": "#c99557",
  natural: "#e8dfcb",
  banana: "#f3dc7a",
  beijinho: "#f4ead2",
  "chocolate belga": "#4e2f22",
};
const PRE_COLORS: [RegExp, string][] = [
  [/integralmedica|prime/i, "#e0352f"],
  [/soldiers|evolution/i, "#2fc6a4"],
  [/raze|dark/i, "#7b8a82"],
  [/nuclear/i, "#f2c418"],
  [/illegal|ilegal/i, "#c01f2c"],
];

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function blend(cols: [string, number][]) {
  const tot = cols.reduce((a, c) => a + c[1], 0) || 1;
  const rgb = [0, 1, 2].map((k) =>
    Math.round(cols.reduce((a, c) => a + hex(c[0])[k] * c[1], 0) / tot),
  );
  return "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");
}

const flavorsOf = (p: ProductDTO) =>
  (p.flavor ?? "")
    .replace(/^[^:]*:\s*/, "")
    .split(/,| e /)
    .map((s) => s.trim())
    .filter(Boolean);

const isCombo = (p: ProductDTO) => /^combo/i.test(p.name);

function fmtHour(h: number) {
  const hh = ((h % 24) + 24) % 24;
  let H = Math.floor(hh);
  let m = Math.round((hh - H) * 60);
  if (m === 60) {
    H = (H + 1) % 24;
    m = 0;
  }
  return `${String(H).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const INNER = "M58 96 L182 96 L173 338 Q172 352 158 352 L82 352 Q68 352 67 338 Z";

export function ShakerLab({ products }: { products: ProductDTO[] }) {
  const { add, open } = useCart();

  const pools = React.useMemo(() => {
    const ok = products.filter((p) => p.stock > 0);
    return {
      whey: ok.filter((p) => p.category === "PROTEINAS" && !isCombo(p)),
      cre: ok.filter((p) => p.category === "CREATINA"),
      pre: ok.filter((p) => p.category === "PRE_TREINO"),
    } as Record<SlotKey, ProductDTO[]>;
  }, [products]);
  const byId = React.useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const bySlug = React.useMemo(() => new Map(products.map((p) => [p.slug, p])), [products]);

  const cheapest = (l: ProductDTO[]) => [...l].sort((a, b) => a.priceCents - b.priceCents)[0];

  const preset = React.useCallback(
    (goal: GoalKey): Slots => {
      const isolado = pools.whey.find((p) => /isolad/i.test(p.name));
      const whey =
        goal === "massa"
          ? pools.whey.find((p) => !/isolad/i.test(p.name)) ?? pools.whey[0]
          : goal === "definicao"
            ? isolado ?? pools.whey[0]
            : undefined;
      const cre = goal !== "definicao" ? cheapest(pools.cre) : undefined;
      const pre = goal !== "massa" ? cheapest(pools.pre) : undefined;
      const mk = (list: ProductDTO[], chosen?: ProductDTO): SlotState => {
        const p = chosen ?? list[0];
        return { on: !!chosen, id: p?.id ?? "", fl: p ? flavorsOf(p)[0] ?? "" : "" };
      };
      return { whey: mk(pools.whey, whey), cre: mk(pools.cre, cre), pre: mk(pools.pre, pre) };
    },
    [pools],
  );

  const [goal, setGoal] = React.useState<GoalKey>("massa");
  const [slots, setSlots] = React.useState<Slots>(() => preset("massa"));
  const [peso, setPeso] = React.useState(75);
  const [hora, setHora] = React.useState(18);
  const [nome, setNome] = React.useState("");
  const [mixed, setMixed] = React.useState(false);
  const [shaking, setShaking] = React.useState(false);
  const [bubbles, setBubbles] = React.useState<{ id: number; cx: number; cy: number; r: number; d: number; t: number }[]>([]);
  const [status, setStatus] = React.useState("Escolha um objetivo ou troque os itens e aperte Misturar.");
  const [toast, setToast] = React.useState("");
  const timers = React.useRef<number[]>([]);
  const bid = React.useRef(0);

  React.useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // Link compartilhado: ?stack=slug1,slug2&sabor=Chocolate&nome=Fulano
  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const s = q.get("stack");
    if (q.get("nome")) setNome(q.get("nome")!.slice(0, 18));
    if (!s) return;
    const next = preset("massa");
    (Object.keys(next) as SlotKey[]).forEach((k) => (next[k] = { ...next[k], on: false }));
    for (const slug of s.split(",")) {
      const p = bySlug.get(slug);
      if (!p) continue;
      const k: SlotKey | null =
        p.category === "CREATINA" ? "cre" : p.category === "PRE_TREINO" ? "pre" : p.category === "PROTEINAS" && !isCombo(p) ? "whey" : null;
      if (!k) continue;
      const fls = flavorsOf(p);
      const want = q.get("sabor");
      next[k] = { on: true, id: p.id, fl: k === "whey" && want && fls.includes(want) ? want : fls[0] ?? "" };
    }
    setSlots(next);
    setStatus("Stack carregado do link. Agora é só misturar.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const touch = (fn: (s: Slots) => Slots) => {
    setSlots(fn);
    setMixed(false);
  };

  const colorOf = (k: SlotKey): string | null => {
    const s = slots[k];
    if (!s.on) return null;
    const p = byId.get(s.id);
    if (!p) return null;
    if (k === "whey") return FLAVOR_COLOR[s.fl.toLowerCase()] ?? "#e8dfcb";
    if (k === "cre") return "#f3f6f8";
    return PRE_COLORS.find(([re]) => re.test(p.name))?.[1] ?? "#c01f2c";
  };

  const active = SLOTS.filter((sl) => slots[sl.key].on && byId.get(slots[sl.key].id));
  const chosen = active.map((sl) => ({ sl, p: byId.get(slots[sl.key].id)!, fl: slots[sl.key].fl }));
  const totalCents = chosen.reduce((a, x) => a + x.p.priceCents, 0);

  const heights: Record<SlotKey, number> = { whey: 54, cre: 18, pre: 30 };
  let y = 352;
  const powders = active.map((sl) => {
    const h = heights[sl.key];
    y -= h;
    return { key: sl.key, y, h, c: colorOf(sl.key)! };
  });
  const mixColor = active.length
    ? blend([
        ...powders.map((pw) => [pw.c, pw.key === "whey" ? 3 : pw.key === "cre" ? 0.7 : 1.4] as [string, number]),
        ["#d7e6ee", 0.9],
      ])
    : "#d7e6ee";

  function shake() {
    if (shaking) return;
    if (!active.length) {
      setStatus("Ligue pelo menos um item no passo 3.");
      return;
    }
    setShaking(true);
    setStatus("Misturando…");
    const mk = (n: number) =>
      Array.from({ length: n }, () => ({
        id: ++bid.current,
        cx: 62 + Math.random() * 116,
        cy: 340 - Math.random() * 40,
        r: 2 + Math.random() * 4,
        d: Math.random() * 1.2,
        t: 1.8 + Math.random() * 1.6,
      }));
    setBubbles(mk(26));
    timers.current.push(
      window.setTimeout(() => {
        setShaking(false);
        setMixed(true);
        setBubbles((b) => [...b, ...mk(14)]);
        setStatus(`Shake pronto! ${active.length} ${active.length > 1 ? "itens misturados" : "item misturado"}. Veja a rotina abaixo.`);
        timers.current.push(window.setTimeout(() => setBubbles([]), 4200));
      }, 1700),
    );
  }

  // rotina
  const events: { t: number; k: number; title: string; ds: string; train?: boolean }[] = [];
  const pick = (k: SlotKey) => (slots[k].on ? byId.get(slots[k].id) : undefined);
  const pre = pick("pre"), wh = pick("whey"), cr = pick("cre");
  if (pre) events.push({ t: hora - 0.5, k: 0, title: "Pré-treino", ds: `${pre.name}: tome cerca de 30 minutos antes.` });
  events.push({ t: hora, k: 1, title: "Treino", ds: "Hora de render.", train: true });
  if (wh) events.push({ t: hora + 1, k: 2, title: "Shaker de whey", ds: `${wh.name}${slots.whey.fl ? ` (${slots.whey.fl})` : ""}: depois do treino ou na refeição seguinte.` });
  if (cr) events.push({ t: hora + 1, k: 3, title: "Creatina", ds: `${cr.name}: todos os dias, inclusive nos dias sem treino. Junto do shaker fica fácil de lembrar.` });
  events.sort((a, b) => a.t - b.t || a.k - b.k);

  const cardTitle = (nome.trim() ? `Stack do ${nome.trim()}` : "Seu stack") + " · " + GOALS.find((g) => g.key === goal)!.label;

  function shareUrl() {
    const q = new URLSearchParams();
    q.set("stack", chosen.map((x) => x.p.slug).join(","));
    if (slots.whey.on && slots.whey.fl) q.set("sabor", slots.whey.fl);
    if (nome.trim()) q.set("nome", nome.trim());
    return `${window.location.origin}/shaker?${q.toString()}`;
  }
  function shareText() {
    return (
      `${cardTitle} — Nutri Lab\n` +
      chosen.map(({ p, fl }) => `• ${p.name}${fl && flavorsOf(p).length > 1 ? ` (${fl})` : ""} — ${formatBRL(p.priceCents)}`).join("\n") +
      `\nTotal: ${formatBRL(totalCents)}\n${shareUrl()}`
    );
  }
  async function copyShare() {
    const txt = shareText();
    try {
      await navigator.clipboard.writeText(txt);
      setToast("Texto e link copiados. Cole no WhatsApp ou no Instagram.");
    } catch {
      setToast("Não consegui copiar automaticamente. Use o botão do WhatsApp.");
    }
  }
  function addAll() {
    chosen.forEach(({ p }) => add(p, 1));
    setToast(`${chosen.length} ${chosen.length > 1 ? "itens adicionados" : "item adicionado"} ao carrinho.`);
    open();
  }

  const chip = (on: boolean) =>
    cn(
      "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
      on ? "border-lime bg-lime text-ink" : "border-border bg-steel text-muted-foreground hover:border-lime/60 hover:text-foreground",
    );
  const sectionCard = "rounded-lg border border-border bg-card p-5 card-grain";

  if (!pools.whey.length && !pools.cre.length && !pools.pre.length) {
    return (
      <section className="container py-16">
        <p className="font-mono text-muted-foreground">Ainda não há produtos disponíveis para montar um stack.</p>
      </section>
    );
  }

  return (
    <section className="container py-12">
      <header className="mb-8">
        <p className="mb-2 font-mono text-xs uppercase leading-none tracking-widest text-lime">Laboratório Nutri Lab</p>
        <h1 className="display text-4xl leading-[1.05] text-foreground md:text-6xl">
          Monte seu <span className="text-lime">shaker</span>
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Escolha seu objetivo, monte o stack com os nossos produtos e veja o pó virar shake. No fim, você leva a rotina do dia e um
          link para compartilhar.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
        {/* palco do shaker */}
        <aside className={cn(sectionCard, "flex flex-col items-center gap-4 py-6 lg:sticky lg:top-24")} aria-label="Seu shaker">
          <svg viewBox="0 0 240 380" role="img" aria-label="Shaker com os produtos escolhidos" className="h-auto w-full max-w-[250px] overflow-visible">
            <defs>
              <clipPath id="shk-clip"><path d={INNER} /></clipPath>
              <linearGradient id="shk-glass" x1="0" x2="1">
                <stop offset="0" stopColor="#fff" stopOpacity=".16" />
                <stop offset=".35" stopColor="#fff" stopOpacity=".02" />
                <stop offset="1" stopColor="#fff" stopOpacity=".1" />
              </linearGradient>
            </defs>
            <ellipse cx="120" cy="364" rx="62" ry="8" fill="#000" opacity=".28" />
            <g className={cn("shk-body", shaking && "shk-shaking", mixed && "shk-mixed")}>
              <g className="shk-idle">
                <path d={INNER} style={{ fill: "hsl(var(--steel))" }} opacity=".9" />
                <g clipPath="url(#shk-clip)">
                  <rect className="shk-wat" x="50" y="128" width="140" height="230" fill="#9fd0e6" opacity=".32" />
                  <rect className="shk-mix" x="50" y="128" width="140" height="230" fill={mixColor} />
                  {powders.map((pw) => (
                    <rect key={pw.key} className="shk-pow" x="50" y={pw.y} width="140" height={pw.h} fill={pw.c} />
                  ))}
                  {bubbles.map((b) => (
                    <circle key={b.id} className="shk-bub" cx={b.cx} cy={b.cy} r={b.r} fill="#fff" opacity=".8" style={{ animationDelay: `${b.d}s`, animationDuration: `${b.t}s` }} />
                  ))}
                </g>
                <path d={INNER} fill="url(#shk-glass)" strokeWidth="2" strokeLinejoin="round" opacity=".95" style={{ stroke: "hsl(var(--muted-foreground))" }} />
                {[150, 200, 250, 300].map((t, i) => (
                  <line key={t} x1="64" x2={i % 2 ? 80 : 90} y1={t} y2={t} strokeWidth="1.2" opacity=".55" style={{ stroke: "hsl(var(--muted-foreground))" }} />
                ))}
                <rect x="52" y="76" width="136" height="22" rx="7" fill="#C2EE3E" />
                <path d="M82 76 L82 58 Q82 48 92 48 L148 48 Q158 48 158 58 L158 76 Z" fill="#C2EE3E" opacity=".92" />
                <rect x="104" y="36" width="32" height="14" rx="5" fill="#C2EE3E" />
                <text x="120" y="92" textAnchor="middle" fontFamily="monospace" fontSize="9" fontWeight="700" fill="#0A0A0A" letterSpacing="1.5">NUTRI LAB</text>
              </g>
            </g>
          </svg>

          <ul className="grid min-h-[66px] w-full content-start gap-1.5 text-sm">
            {chosen.length === 0 && <li className="text-muted-foreground">Ligue um item no passo 3 para encher o shaker.</li>}
            {chosen.map(({ sl, p, fl }) => (
              <li key={sl.key} className="flex items-center gap-2.5">
                <span className="size-3 shrink-0 rounded-full border border-white/25" style={{ background: colorOf(sl.key) ?? undefined }} />
                <span className="min-w-0 flex-1 break-words">{p.name}{p.weight ? ` · ${p.weight}` : ""}</span>
                {fl && flavorsOf(p).length > 1 && <span className="font-mono text-[11px] text-muted-foreground">{fl}</span>}
              </li>
            ))}
          </ul>

          <button
            onClick={shake}
            disabled={shaking}
            className="h-12 w-full rounded-md bg-lime font-bold uppercase tracking-wide text-ink transition-colors hover:bg-lime-glow disabled:opacity-60"
          >
            {mixed ? "Misturar de novo" : "Misturar!"}
          </button>
          <p className="min-h-[34px] text-center font-mono text-xs text-muted-foreground" aria-live="polite">{status}</p>
        </aside>

        {/* painel de montagem */}
        <div className="min-w-0 space-y-4">
          <section className={sectionCard} aria-labelledby="sh-s1">
            <span className="mb-1 block font-mono text-[11px] font-bold tracking-widest text-lime">PASSO 1</span>
            <h2 id="sh-s1" className="display text-2xl text-foreground">Qual é o seu objetivo?</h2>
            <p className="mb-3 text-sm text-muted-foreground">Isso monta um stack inicial. Você troca tudo depois.</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Objetivo">
              {GOALS.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  aria-pressed={goal === g.key}
                  className={chip(goal === g.key)}
                  onClick={() => {
                    setGoal(g.key);
                    setSlots(preset(g.key));
                    setMixed(false);
                    setStatus("Stack montado. Agora é só misturar.");
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </section>

          <section className={sectionCard} aria-labelledby="sh-s2">
            <span className="mb-1 block font-mono text-[11px] font-bold tracking-widest text-lime">PASSO 2</span>
            <h2 id="sh-s2" className="display text-2xl text-foreground">Seu corpo e seu treino</h2>
            <p className="mb-3 text-sm text-muted-foreground">Usamos para calcular a meta de proteína e os horários.</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="sh-peso" className="mb-1 flex justify-between text-sm font-semibold">Peso <output className="font-mono text-lime">{peso} kg</output></label>
                <input id="sh-peso" type="range" min={45} max={140} step={1} value={peso} onChange={(e) => setPeso(+e.target.value)} className="w-full accent-[#C2EE3E]" />
              </div>
              <div>
                <label htmlFor="sh-hora" className="mb-1 flex justify-between text-sm font-semibold">Hora do treino <output className="font-mono text-lime">{fmtHour(hora)}</output></label>
                <input id="sh-hora" type="range" min={5} max={22} step={0.5} value={hora} onChange={(e) => setHora(+e.target.value)} className="w-full accent-[#C2EE3E]" />
              </div>
              <div>
                <label htmlFor="sh-nome" className="mb-1 block text-sm font-semibold">Seu nome</label>
                <input id="sh-nome" type="text" maxLength={18} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como vamos te chamar?" autoComplete="off" className="h-10 w-full rounded-md border border-border bg-steel px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-lime focus-visible:outline-none" />
              </div>
            </div>
          </section>

          <section className={sectionCard} aria-labelledby="sh-s3">
            <span className="mb-1 block font-mono text-[11px] font-bold tracking-widest text-lime">PASSO 3</span>
            <h2 id="sh-s3" className="display text-2xl text-foreground">Monte o stack</h2>
            <p className="mb-3 text-sm text-muted-foreground">Ligue ou desligue cada item e escolha o produto. Preços e fotos são os da loja.</p>
            <div className="space-y-3">
              {SLOTS.filter((sl) => pools[sl.key].length > 0).map((sl) => {
                const s = slots[sl.key];
                const cur = byId.get(s.id);
                const fls = cur ? flavorsOf(cur) : [];
                return (
                  <div key={sl.key} className={cn("rounded-lg border border-border bg-steel p-3.5", !s.on && "opacity-60")}>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-bold">{sl.label}<small className="ml-2 font-normal text-muted-foreground">{sl.hint}</small></h3>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={s.on}
                        aria-label={`Incluir ${sl.label.toLowerCase()}`}
                        onClick={() => touch((st) => ({ ...st, [sl.key]: { ...st[sl.key], on: !st[sl.key].on } }))}
                        className={cn("relative h-6 w-11 shrink-0 rounded-full border transition-colors", s.on ? "border-lime bg-lime" : "border-border bg-card")}
                      >
                        <span className={cn("absolute left-[3px] top-[3px] size-4 rounded-full transition-transform", s.on ? "translate-x-5 bg-ink" : "bg-muted-foreground")} />
                      </button>
                    </div>
                    {s.on && (
                      <>
                        <div className="no-scrollbar mt-3 flex snap-x gap-2.5 overflow-x-auto pb-1.5" role="group" aria-label={sl.label}>
                          {pools[sl.key].map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              aria-pressed={s.id === p.id}
                              onClick={() => touch((st) => ({ ...st, [sl.key]: { on: true, id: p.id, fl: flavorsOf(p).includes(st[sl.key].fl) ? st[sl.key].fl : flavorsOf(p)[0] ?? "" } }))}
                              className={cn("flex w-32 shrink-0 snap-start flex-col gap-1.5 rounded-lg border bg-card p-2 text-left transition-colors", s.id === p.id ? "border-lime ring-1 ring-lime" : "border-border hover:border-lime/60")}
                            >
                              <span className="relative block aspect-square w-full overflow-hidden rounded-md bg-white">
                                <Image src={p.image} alt="" fill sizes="128px" className="object-cover" />
                              </span>
                              <span className="min-h-[30px] text-xs font-semibold leading-tight">{p.name}{p.weight ? ` · ${p.weight}` : ""}</span>
                              <span className="font-mono text-xs font-bold text-lime">{formatBRL(p.priceCents)}</span>
                            </button>
                          ))}
                        </div>
                        {fls.length > 1 && (
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            <span className="mr-1 font-mono text-[11px] text-muted-foreground">SABOR</span>
                            {fls.map((f) => (
                              <button
                                key={f}
                                type="button"
                                aria-pressed={s.fl === f}
                                onClick={() => touch((st) => ({ ...st, [sl.key]: { ...st[sl.key], fl: f } }))}
                                className={cn(chip(s.fl === f), "px-3 py-1 text-xs")}
                              >
                                {f}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* rotina + meta */}
      <section className="mt-12" aria-labelledby="sh-rt">
        <h2 id="sh-rt" className="display text-3xl text-foreground md:text-4xl">Sua rotina do dia</h2>
        <p className="mb-5 mt-1 max-w-xl text-sm text-muted-foreground">Os horários mudam conforme você arrasta a hora do treino. É uma sugestão de organização, não uma prescrição.</p>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className={sectionCard}>
            <ol className="relative">
              <span aria-hidden className="absolute bottom-2 left-[71px] top-2 w-px bg-border" />
              {events.map((e) => (
                <li key={e.k} className="grid grid-cols-[52px_22px_minmax(0,1fr)] gap-x-2 py-2.5">
                  <time className="pt-0.5 font-mono text-sm font-bold text-lime">{fmtHour(e.t)}</time>
                  <span className={cn("relative ml-1.5 mt-1.5 size-[11px] rounded-full ring-4 ring-card", e.train ? "bg-amber-500" : "bg-lime")} />
                  <div>
                    <div className="font-bold">{e.title}</div>
                    <div className="text-sm text-muted-foreground">{e.ds}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className={cn(sectionCard, "flex flex-col gap-2")}>
            <span className="font-mono text-[11px] font-bold tracking-widest text-lime">META DE PROTEÍNA ESTIMADA</span>
            <div className="display text-5xl leading-none text-lime">{Math.round(peso * 1.8)} g</div>
            <div className="font-mono text-xs text-muted-foreground">faixa de {Math.round(peso * 1.6)} a {Math.round(peso * 2.2)} g por dia</div>
            <p className="mt-2 text-xs text-muted-foreground">
              Estimativa geral de 1,6 a 2,2 g de proteína por kg para quem treina. O shaker ajuda a completar parte da meta; o resto vem
              da alimentação. Não substitui a orientação de um nutricionista.
            </p>
          </div>
        </div>
      </section>

      {/* cartão do stack */}
      <section className="mt-12" aria-labelledby="sh-cd">
        <h2 id="sh-cd" className="display text-3xl text-foreground md:text-4xl">Cartão do seu stack</h2>
        <p className="mb-5 mt-1 max-w-xl text-sm text-muted-foreground">Leve tudo para o carrinho de uma vez ou compartilhe o link: quem abrir já encontra o seu stack montado.</p>
        <div className="max-w-xl rounded-xl border border-border bg-card p-6 card-grain">
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-lime">Nutri Lab · stack pessoal</span>
          <h3 className="display mb-4 mt-2 break-words text-3xl leading-[1.05] text-foreground">{cardTitle}</h3>
          {chosen.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum item ligado.</p>
          ) : (
            <ul className="grid gap-2.5">
              {chosen.map(({ sl, p, fl }) => (
                <li key={sl.key} className="grid grid-cols-[54px_minmax(0,1fr)_auto] items-center gap-3">
                  <span className="relative block size-[54px] overflow-hidden rounded-md bg-white">
                    <Image src={p.image} alt="" fill sizes="54px" className="object-cover" />
                  </span>
                  <div className="min-w-0">
                    <div className="break-words text-sm font-semibold leading-tight">{p.name}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{sl.label.toUpperCase()}{p.weight ? ` · ${p.weight}` : ""}{fl && flavorsOf(p).length > 1 ? ` · ${fl}` : ""}</div>
                  </div>
                  <span className="font-mono text-sm font-bold">{formatBRL(p.priceCents)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-dashed border-border pt-3.5">
            <span className="font-mono text-xs text-muted-foreground">TOTAL DO STACK</span>
            <span className="display text-4xl leading-none text-lime">{formatBRL(totalCents)}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={addAll}
              disabled={!chosen.length}
              className="flex min-h-12 w-full flex-1 basis-full items-center justify-center gap-2 rounded-md bg-lime px-5 py-3 font-bold uppercase tracking-wide text-ink transition-colors hover:bg-lime-glow disabled:opacity-50 sm:basis-full"
            >
              <ShoppingBag className="size-5 shrink-0" /> Adicionar ao carrinho
            </button>
            <button
              type="button"
              onClick={copyShare}
              disabled={!chosen.length}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-md border border-border px-4 py-2 font-semibold transition-colors hover:border-lime hover:text-lime disabled:opacity-50"
            >
              <Copy className="size-4" /> Copiar link do stack
            </button>
            <button
              type="button"
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText())}`, "_blank", "noopener,noreferrer")}
              disabled={!chosen.length}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-md border border-border px-4 py-2 font-semibold transition-colors hover:border-lime hover:text-lime disabled:opacity-50"
            >
              <MessageCircle className="size-4" /> WhatsApp
            </button>
          </div>
          <p className="mt-3 flex min-h-[18px] items-center gap-1.5 font-mono text-xs text-lime" aria-live="polite">
            {toast && <Check className="size-3.5" />}
            {toast}
          </p>
        </div>
      </section>
    </section>
  );
}
