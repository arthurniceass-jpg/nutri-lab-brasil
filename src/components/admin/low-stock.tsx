import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

type Item = { name: string; stock: number; category: string; threshold: number };

export function LowStock({ items }: { items: Item[] }) {
  return (
    <Card id="estoque" className="border-warning/30 p-5">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="size-5 text-warning" />
        <h2 className="display text-xl text-foreground">
          Estoque <span className="text-warning">baixo</span>
        </h2>
      </div>

      {items.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground">
          Tudo certo. Nenhum produto abaixo do limite.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const critical = item.stock <= Math.floor(item.threshold / 3);
            return (
              <li
                key={item.name}
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold uppercase tracking-wide text-foreground">
                    {item.name}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {item.category}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-md px-2.5 py-1 font-mono text-xs font-bold ${
                    critical
                      ? "bg-destructive/15 text-destructive"
                      : "bg-warning/15 text-warning"
                  }`}
                >
                  {item.stock} un
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
