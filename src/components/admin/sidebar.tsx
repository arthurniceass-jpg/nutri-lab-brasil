"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
  Store,
  Menu,
  X,
  Boxes,
  Building2,
  Users,
} from "lucide-react";
import { Logo } from "@/components/store/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/shared/utils";

const NAV = [
  { icon: LayoutDashboard, label: "Visão geral", href: "/admin" },
  { icon: ShoppingCart, label: "Pedidos", href: "/admin/pedidos" },
  { icon: Package, label: "Produtos", href: "/admin/produtos" },
  { icon: Boxes, label: "Estoque", href: "/admin/estoque" },
  { icon: Users, label: "Clientes", href: "/admin/clientes" },
  { icon: Building2, label: "Fornecedores", href: "/admin/fornecedores" },
  { icon: BarChart3, label: "Relatórios", href: "/admin/relatorios" },
  { icon: Settings, label: "Configurações", href: "/admin/configuracoes" },
];

export function Sidebar({ ownerEmail }: { ownerEmail: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <>
      {/* Topbar mobile */}
      <div className="flex items-center justify-between border-b border-border bg-carbon px-4 py-3 md:hidden">
        <Logo />
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Abrir menu"
          className="rounded-md border border-border p-2 text-foreground"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <aside
        className={cn(
          "z-30 flex w-64 shrink-0 flex-col border-r border-border bg-carbon md:sticky md:top-0 md:h-screen",
          open ? "block" : "hidden md:flex",
        )}
      >
        <div className="hidden border-b border-border p-6 md:block">
          <Logo />
        </div>

        <nav aria-label="Navegação do painel" className="flex-1 space-y-1 p-4">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <a
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors",
                  active
                    ? "bg-lime/10 text-lime lime-edge"
                    : "text-muted-foreground hover:bg-steel hover:text-foreground",
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-border p-4">
          <ThemeToggle className="mb-1 w-full justify-start" />
          <a
            href="/"
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:bg-steel hover:text-foreground"
          >
            <Store className="size-5" />
            Ver loja
          </a>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="size-5" />
            Sair
          </button>
          <p className="truncate px-3 pt-2 font-mono text-xs text-muted-foreground/60">
            {ownerEmail}
          </p>
        </div>
      </aside>
    </>
  );
}
