import { Card } from "@/components/ui/card";
import { prisma } from "@/server/db/prisma";
import { formatDate } from "@/shared/format";
import { formatCPF } from "@/shared/validators";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      cpf: true,
      city: true,
      state: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
  });

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-lime">
          Painel do proprietário
        </p>
        <h1 className="display text-4xl text-foreground md:text-5xl">Clientes</h1>
        <p className="mt-1 font-mono text-sm text-muted-foreground">
          {customers.length} cadastrados
        </p>
      </header>

      <Card className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-xs uppercase text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Cliente</th>
                <th className="pb-2 pr-4 font-medium">CPF</th>
                <th className="pb-2 pr-4 font-medium">Cidade</th>
                <th className="pb-2 pr-4 font-medium">Pedidos</th>
                <th className="pb-2 font-medium">Desde</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-border/50 last:border-0">
                  <td className="py-3 pr-4">
                    <p className="font-bold uppercase tracking-wide text-foreground">
                      {c.name}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {c.email}
                    </p>
                  </td>
                  <td className="py-3 pr-4 font-mono text-muted-foreground">
                    {c.cpf ? formatCPF(c.cpf) : "-"}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {[c.city, c.state].filter(Boolean).join("/") || "-"}
                  </td>
                  <td className="py-3 pr-4 font-mono text-foreground">
                    {c._count.orders}
                  </td>
                  <td className="py-3 font-mono text-xs text-muted-foreground">
                    {formatDate(c.createdAt)}
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center font-mono text-xs text-muted-foreground">
                    Nenhum cliente cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
