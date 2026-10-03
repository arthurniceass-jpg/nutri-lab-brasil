"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, ChevronDown, Package, LogOut, LogIn } from "lucide-react";

export function AccountMenu({ customerName }: { customerName?: string | null }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const loggedIn = Boolean(customerName);
  const firstName = customerName ? customerName.split(" ")[0] : null;

  async function logout() {
    setOpen(false);
    await fetch("/api/conta/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Sua conta"
        className="flex h-11 items-center gap-2 rounded-md border border-border bg-steel px-4 font-semibold uppercase tracking-wide text-foreground transition-colors hover:border-lime hover:text-lime"
      >
        <User className="size-5" />
        <span className="hidden sm:inline">{firstName ?? "Entrar"}</span>
        <ChevronDown className={`hidden size-4 transition-transform sm:block ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <button
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-3 w-72 overflow-hidden rounded-xl border border-border bg-carbon shadow-2xl"
          >
            {loggedIn ? (
              <>
                {/* Perfil */}
                <div className="border-b border-border p-4">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="flex size-11 items-center justify-center rounded-full bg-steel text-foreground"
                    >
                      <User className="size-5" />
                    </span>
                    <p className="min-w-0 truncate text-sm font-bold text-foreground">{customerName}</p>
                  </div>
                </div>

                {/* Ações */}
                <div className="p-2">
                  <Link
                    href="/conta"
                    onClick={() => setOpen(false)}
                    role="menuitem"
                    className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-steel hover:text-lime"
                  >
                    <User className="size-4" /> Meu perfil
                  </Link>
                  <Link
                    href="/conta"
                    onClick={() => setOpen(false)}
                    role="menuitem"
                    className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-steel hover:text-lime"
                  >
                    <Package className="size-4" /> Meus pedidos
                  </Link>
                  <button
                    onClick={logout}
                    role="menuitem"
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-steel hover:text-destructive"
                  >
                    <LogOut className="size-4" /> Sair
                  </button>
                </div>
              </>
            ) : (
              /* Deslogado */
              <div className="p-4">
                <p className="text-sm font-bold text-foreground">Bem-vindo à Nutri Lab</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Entre para acompanhar seus pedidos e agilizar suas compras.
                </p>
                <Link
                  href="/conta/entrar"
                  onClick={() => setOpen(false)}
                  className="mt-3 flex items-center justify-center gap-2 rounded-md bg-lime py-2.5 text-sm font-bold uppercase tracking-wide text-ink transition-colors hover:bg-lime-glow"
                >
                  <LogIn className="size-4" /> Entrar / Cadastrar
                </Link>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
