"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { formatBRL, formatPercent } from "@/shared/format";

type Slice = {
  category: string;
  label: string;
  color: string;
  valueCents: number;
  share: number;
};

export function CategoryDonut({ data }: { data: Slice[] }) {
  const total = data.reduce((sum, d) => sum + d.valueCents, 0);
  const chartData = data.map((d) => ({ ...d, value: d.valueCents / 100 }));

  return (
    <Card className="p-5">
      <h2 className="display text-xl text-foreground">
        Vendas por <span className="text-lime">categoria</span>
      </h2>
      <p className="mb-2 font-mono text-xs text-muted-foreground">
        Participação no faturamento
      </p>

      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="relative h-44 w-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={80}
                paddingAngle={2}
                stroke="none"
              >
                {chartData.map((d) => (
                  <Cell key={d.category} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#121212",
                  border: "1px solid #262626",
                  borderRadius: 8,
                  fontSize: 13,
                }}
                formatter={(v: number) => formatBRL((v as number) * 100)}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-[10px] uppercase text-muted-foreground">
              Total
            </span>
            <span className="display text-lg text-foreground">
              {formatBRL(total)}
            </span>
          </div>
        </div>

        <ul className="flex-1 space-y-2">
          {data.map((d) => (
            <li key={d.category} className="flex items-center gap-2 text-sm">
              <span
                className="size-3 shrink-0 rounded-sm"
                style={{ backgroundColor: d.color }}
                aria-hidden
              />
              <span className="flex-1 text-foreground">{d.label}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {formatPercent(d.share)}
              </span>
            </li>
          ))}
          {data.length === 0 && (
            <li className="font-mono text-xs text-muted-foreground">
              Sem vendas no período.
            </li>
          )}
        </ul>
      </div>
    </Card>
  );
}
