"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, KeyRound } from "lucide-react";
import { Logo } from "@/components/store/logo";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

function RedefinirInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/conta/senha/redefinir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Não foi possível redefinir.");
      else {
        setDone(true);
        setTimeout(() => router.replace("/conta/entrar"), 1800);
      }
    } catch {
      setError("Erro de conexao.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex justify-center" aria-label="Loja">
          <Logo />
        </Link>
        <div className="rounded-lg border border-border bg-card p-8 card-grain">
          <div className="mb-6 flex items-center gap-2">
            <KeyRound className="size-5 text-lime" />
            <h1 className="display text-2xl text-foreground">
              Nova <span className="text-lime">senha</span>
            </h1>
          </div>

          {done ? (
            <p className="text-sm text-lime">
              Senha alterada! Redirecionando para o login...
            </p>
          ) : !token ? (
            <p className="text-sm text-destructive">
              Link inválido. Solicite a redefinição novamente.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">Nova senha</Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <p className="font-mono text-xs text-muted-foreground">
                  Mínimo de 6 caracteres.
                </p>
              </div>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Salvando
                  </>
                ) : (
                  "Redefinir senha"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

export default function RedefinirPage() {
  return (
    <Suspense>
      <RedefinirInner />
    </Suspense>
  );
}
