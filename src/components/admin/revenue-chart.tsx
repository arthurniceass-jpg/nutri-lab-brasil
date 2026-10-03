"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { formatBRL, formatCompactBRL } from "@/shared/format";
import { cn } from "@/shared/utils";
import type { MonthPoint } from "@/server/services/dashboard";

export function RevenueChart({ monthly }: { monthly: MonthPoint[] }) {
  const [range, setRange] = React.useState<6 | 12>(6);
  const data = monthly.slice(-range).map((m) => ({
    label: m.label,
    Faturamento: m.faturamentoCents / 100,
    Lucro: m.lucroCents / 100,
  }));

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="display text-xl text-foreground">
            Faturamento <span className="text-lime">x</span> Lucro
          </h2>
          <p className="font-mono text-xs text-muted-foreground">
            Evolução mensal
          </p>
        </div>
        <div className="flex gap-1 rounded-md border border-border bg-steel p-1">
          {([6, 12] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded px-3 py-1 font-mono text-xs font-bold transition-colors",
                range === r
                  ? "bg-lime text-ink"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r}M
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C2EE3E" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#C2EE3E" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="lucGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7FB800" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#7FB800" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.25)" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#A1A1A1"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#A1A1A1"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCompactBRL(v * 100)}
              width={64}
            />
            <Tooltip
              contentStyle={{
                background: "#121212",
                border: "1px solid #262626",
                borderRadius: 8,
                fontSize: 13,
              }}
              labelStyle={{ color: "#FAFAFA", fontWeight: 700 }}
              formatter={(value: number, name) => [
                formatBRL((value as number) * 100),
                name,
              ]}
            />
            <Area
              type="monotone"
              dataKey="Faturamento"
              stroke="#C2EE3E"
              strokeWidth={2.5}
              fill="url(#fatGrad)"
            />
            <Area
              type="monotone"
              dataKey="Lucro"
              stroke="#7FB800"
              strokeWidth={2.5}
              fill="url(#lucGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex gap-6">
        <Legend color="#C2EE3E" label="Faturamento" />
        <Legend color="#7FB800" label="Lucro líquido" />
      </div>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="size-3 rounded-sm"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className="font-mono text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
