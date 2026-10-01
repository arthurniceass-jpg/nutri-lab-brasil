"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils";

export function ReviewForm({
  productId,
  isLoggedIn,
}: {
  productId: string;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [rating, setRating] = React.useState(0);
  const [hover, setHover] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [done, setDone] = React.useState(false);

  if (!isLoggedIn) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
        <Link href="/conta/entrar" className="font-semibold text-lime hover:underline">
          Entre na sua conta
        </Link>{" "}
        para avaliar este produto.
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-lg border border-lime/40 bg-lime/5 p-5 text-sm text-lime">
        Obrigado! Sua avaliação foi publicada.
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Não foi possível enviar.");
      else {
        setDone(true);
        router.refresh();
      }
    } catch {
      setError("Erro de conexao.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-border bg-card p-5">
      <p className="mb-2 text-sm font-bold uppercase tracking-wide text-foreground">
        Deixe sua avaliação
      </p>
      <div className="mb-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} estrelas`}
          >
            <Star
              className={cn(
                "size-7 transition-colors",
                (hover || rating) >= n
                  ? "fill-lime text-lime"
                  : "text-muted-foreground",
              )}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Conte como foi sua experiência com o produto"
        rows={3}
        className="w-full rounded-md border border-input bg-steel px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-lime focus-visible:outline-none"
      />
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <Button type="submit" className="mt-3" disabled={loading || rating === 0}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : "Enviar avaliação"}
      </Button>
    </form>
  );
}
