"use client";

import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { formatDelta } from "@/shared/format";
import { cn } from "@/shared/utils";

export function KpiCard({
  icon,
  label,
  value,
  sub,
  deltaRatio,
  spark,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  deltaRatio: number;
  spark: number[];
}) {
  const positive = deltaRatio >= 0;
  const data = spark.map((v, i) => ({ i, v }));
  const id = `spark-${label.replace(/\s+/g, "-")}`;

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card p-5 card-grain">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-md bg-lime/10 text-lime">
            {icon}
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
        </div>
        <span
          className={cn(
            "flex items-center gap-0.5 rounded-full px-2 py-0.5 font-mono text-xs font-bold",
            positive
              ? "bg-success/15 text-success"
              : "bg-destructive/15 text-destructive",
          )}
        >
          {positive ? (
            <ArrowUpRight className="size-3" />
          ) : (
            <ArrowDownRight className="size-3" />
          )}
          {formatDelta(deltaRatio)}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-2">
        <div>
          <p className="display text-3xl leading-none text-foreground">
            {value}
          </p>
          {sub && (
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {sub}
            </p>
          )}
        </div>
        <div className="h-12 w-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
              <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C2EE3E" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#C2EE3E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke="#C2EE3E"
                strokeWidth={2}
                fill={`url(#${id})`}
                isAnimationActive={false}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="mt-2 font-mono text-[11px] text-muted-foreground/70">
        vs. mês anterior
      </p>
    </div>
  );
}
