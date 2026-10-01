import "server-only";
import { prisma } from "@/server/db/prisma";
import { formatBRL } from "@/shared/format";
import type { CouponType } from "@prisma/client";

export type CouponOk = {
  ok: true;
  code: string;
  type: CouponType;
  value: number;
  minSubtotalCents: number;
  discountCents: number;
};
export type CouponFail = { ok: false; error: string };
export type CouponResult = CouponOk | CouponFail;

function computeDiscount(
  type: CouponType,
  value: number,
  subtotalCents: number,
): number {
  const raw =
    type === "PERCENT"
      ? Math.round((subtotalCents * value) / 100)
      : value;
  // Nunca desconta mais que o próprio subtotal
  return Math.max(0, Math.min(raw, subtotalCents));
}

export async function validateCoupon(
  rawCode: string,
  subtotalCents: number,
): Promise<CouponResult> {
  const code = String(rawCode ?? "").trim().toUpperCase();
  if (!code) return { ok: false, error: "Informe um cupom." };

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.active) {
    return { ok: false, error: "Cupom inválido." };
  }
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "Cupom expirado." };
  }
  if (
    coupon.maxRedemptions !== null &&
    coupon.timesRedeemed >= coupon.maxRedemptions
  ) {
    return { ok: false, error: "Cupom esgotado." };
  }
  if (subtotalCents < coupon.minSubtotalCents) {
    return {
      ok: false,
      error: `Valido em compras a partir de ${formatBRL(coupon.minSubtotalCents)}.`,
    };
  }

  return {
    ok: true,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    minSubtotalCents: coupon.minSubtotalCents,
    discountCents: computeDiscount(coupon.type, coupon.value, subtotalCents),
  };
}
