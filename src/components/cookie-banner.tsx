"use client";

import * as React from "react";
import Link from "next/link";

export function CookieBanner() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    try {
      if (!localStorage.getItem("nl_cookie_ok")) setShow(true);
    } catch {
      /* ignora */
    }
  }, []);

  if (!show) return null;

  function accept() {
    try {
      localStorage.setItem("nl_cookie_ok", "1");
    } catch {
      /* ignora */
    }
    setShow(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] border-t border-border bg-carbon/95 backdrop-blur-md">
      <div className="container flex flex-col items-center gap-3 py-4 sm:flex-row sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Usamos cookies essenciais para o carrinho e o login. Ao continuar,
          você concorda com a nossa{" "}
          <Link href="/politicas/privacidade" className="text-lime hover:underline">
            política de privacidade
          </Link>
          .
        </p>
        <button
          onClick={accept}
          className="shrink-0 rounded-md bg-lime px-5 py-2 text-sm font-semibold uppercase tracking-wide text-ink hover:bg-lime-glow"
        >
          Aceitar
        </button>
      </div>
    </div>
  );
}
