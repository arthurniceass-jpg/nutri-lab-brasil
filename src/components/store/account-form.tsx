"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, UserPlus, LogIn } from "lucide-react";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { maskCpf, maskCep } from "@/shared/format";

export function AccountForm({ mode }: { mode: "entrar" | "cadastro" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [cpf, setCpf] = React.useState("");
  const [cep, setCep] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [number, setNumber] = React.useState("");
  const [complement, setComplement] = React.useState("");
  const [neighborhood, setNeighborhood] = React.useState("");
  const [city, setCity] = React.useState("");
  const [uf, setUf] = React.useState("");
  const [cepLoading, setCepLoading] = React.useState(false);
  const [cepMsg, setCepMsg] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const isSignup = mode === "cadastro";

  // Busca automática do endereço pelo CEP (ViaCEP) quando tem 8 digitos.
  React.useEffect(() => {
    const digits = cep.replace(/\D/g, "");
    if (!isSignup || digits.length !== 8) return;
    let cancel = false;
    setCepLoading(true);
    setCepMsg("");
    fetch(`https://viacep.com.br/ws/${digits}/json/`)
      .then((r) => r.json())
      .then((d) => {
        if (cancel) return;
        if (d.erro) {
          setCepMsg("CEP não encontrado.");
          return;
        }
        if (d.logradouro) setAddress(d.logradouro);
        setNeighborhood(d.bairro ?? "");
        setCity(d.localidade ?? "");
        setUf(d.uf ?? "");
      })
      .catch(() => {
        if (!cancel) setCepMsg("Não foi possível buscar o CEP.");
      })
      .finally(() => {
        if (!cancel) setCepLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [cep, isSignup]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const endpoint = isSignup ? "/api/conta/registrar" : "/api/conta/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isSignup
            ? {
                name,
                email,
                password,
                cpf,
                cep,
                address,
                number,
                complement,
                neighborhood,
                city,
                state: uf,
              }
            : { email, password },
        ),
      });
      if (res.ok) {
        router.replace(params.get("from") ?? "/conta");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Não foi possível continuar.");
      }
    } catch {
      setError("Erro de conexao.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className={`w-full ${isSignup ? "max-w-md" : "max-w-sm"}`}>
        <Link
          href="/"
          className="mb-8 flex justify-center"
          aria-label="Voltar para a loja"
        >
          <Logo />
        </Link>

        <div className="rounded-lg border border-border bg-card p-8 card-grain">
          <div className="mb-6 flex items-center gap-2">
            {isSignup ? (
              <UserPlus className="size-5 text-lime" />
            ) : (
              <LogIn className="size-5 text-lime" />
            )}
            <h1 className="display text-2xl text-foreground">
              {isSignup ? (
                <>
                  Criar <span className="text-lime">conta</span>
                </>
              ) : (
                <>
                  Entrar na <span className="text-lime">conta</span>
                </>
              )}
            </h1>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {isSignup && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <PasswordInput
                id="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
              {isSignup ? (
                <p className="font-mono text-xs text-muted-foreground">
                  Mínimo de 6 caracteres.
                </p>
              ) : (
                <div className="text-right">
                  <Link
                    href="/conta/esqueci"
                    className="text-xs text-muted-foreground hover:text-lime"
                  >
                    Esqueci a senha
                  </Link>
                </div>
              )}
            </div>

            {isSignup && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    inputMode="numeric"
                    value={cpf}
                    onChange={(e) => setCpf(maskCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      value={cep}
                      onChange={(e) => setCep(maskCep(e.target.value))}
                      placeholder="00000-000"
                      minLength={8}
                      required
                    />
                    {cepLoading && (
                      <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-lime" />
                    )}
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {cepMsg || "No mínimo 8 digitos. Buscamos seu endereço automaticamente."}
                  </p>
                </div>
                <div className="grid grid-cols-[1fr_110px] gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      autoComplete="street-address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Rua, avenida..."
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="number">Número</Label>
                    <Input
                      id="number"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      placeholder="123"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Ex.: apt 102, bloco B (opcional)"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-[1fr_90px] gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="uf">UF</Label>
                    <Input
                      id="uf"
                      value={uf}
                      onChange={(e) => setUf(e.target.value.toUpperCase())}
                      maxLength={2}
                    />
                  </div>
                </div>
              </>
            )}

            {error && (
              <p
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {isSignup ? "Criando" : "Entrando"}
                </>
              ) : isSignup ? (
                "Criar conta"
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup ? (
              <>
                Já tem conta?{" "}
                <Link href="/conta/entrar" className="font-semibold text-lime hover:underline">
                  Entrar
                </Link>
              </>
            ) : (
              <>
                Ainda não tem conta?{" "}
                <Link href="/conta/cadastro" className="font-semibold text-lime hover:underline">
                  Cadastre-se
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </main>
  );
}
