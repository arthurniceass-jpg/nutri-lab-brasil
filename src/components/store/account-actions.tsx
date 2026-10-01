"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/conta/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="flex items-center gap-2 rounded-md border border-border bg-steel px-4 py-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
    >
      <LogOut className="size-4" />
      Sair
    </button>
  );
}
