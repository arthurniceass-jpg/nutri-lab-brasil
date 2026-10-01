"use client";

import { useEffect } from "react";

// Limpa o carrinho salvo após a compra ser concluida.
export function ClearCart() {
  useEffect(() => {
    try {
      localStorage.removeItem("nl_cart_v1");
    } catch {
      /* ignora */
    }
  }, []);
  return null;
}
