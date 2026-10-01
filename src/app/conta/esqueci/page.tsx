"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, KeyRound } from "lucide-react";
import { Logo } from "@/components/store/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EsqueciPage() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/conta/senha/solicitar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setLoading(false);
    setSent(true);
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
              Esqueci a <span className="text-lime">senha</span>
            </h1>
          </div>

          {sent ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Se existir uma conta com esse email, enviamos um link para
                redefinir a senha. Verifique sua caixa de entrada.
              </p>
              <Button asChild className="w-full">
                <Link href="/conta/entrar">Voltar para o login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email da conta</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Enviando
                  </>
                ) : (
                  "Enviar link de redefinição"
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link href="/conta/entrar" className="text-lime hover:underline">
                  Voltar para o login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
