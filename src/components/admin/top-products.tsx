import { Card } from "@/components/ui/card";
import { formatBRL, formatNumber } from "@/shared/format";

type Item = { name: string; units: number; revenueCents: number };

export function TopProducts({ items }: { items: Item[] }) {
  const max = Math.max(1, ...items.map((i) => i.revenueCents));

  return (
    <Card className="p-5">
      <h2 className="display text-xl text-foreground">
        Mais <span className="text-lime">vendidos</span>
      </h2>
      <p className="mb-4 font-mono text-xs text-muted-foreground">
        Por faturamento no período
      </p>

      <ol className="space-y-4">
        {items.map((item, i) => (
          <li key={item.name}>
            <div className="mb-1.5 flex items-center gap-3">
              <span className="display w-6 text-lg text-lime">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 truncate text-sm font-bold uppercase tracking-wide text-foreground">
                {item.name}
              </span>
              <span className="font-mono text-sm text-foreground">
                {formatBRL(item.revenueCents)}
              </span>
            </div>
            <div className="ml-9 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-steel">
                <div
                  className="h-full rounded-full bg-lime"
                  style={{ width: `${(item.revenueCents / max) * 100}%` }}
                />
              </div>
              <span className="font-mono text-xs text-muted-foreground">
                {formatNumber(item.units)} un
              </span>
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <li className="font-mono text-xs text-muted-foreground">
            Sem vendas registradas.
          </li>
        )}
      </ol>
    </Card>
  );
}
