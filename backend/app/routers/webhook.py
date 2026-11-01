"""Webhook do Mercado Pago.

Diferenças em relação à versão atual do Next.js (que este arquivo substitui):
  1. FALHA FECHADO: sem MP_WEBHOOK_SECRET configurado, recusa (503). Antes, aceitava qualquer chamada.
  2. Notificação atrasada não "desfaz" um pedido: PAGO/ENVIADO/ENTREGUE nunca voltam para PENDENTE.
  3. Estoque nunca fica negativo.
Mantém: reconsulta do pagamento na API do Mercado Pago e baixa de estoque/cupom apenas UMA vez.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Request
from sqlalchemy import case, select, update
from sqlalchemy.orm import Session

from ..config import get_settings
from ..db import get_db
from ..http import ApiError, json_body
from ..models import Coupon, Order, OrderItem, Product, StoreSettings, utcnow
from .. import services

log = logging.getLogger("nutrilab.webhook")
router = APIRouter()

_PAID_FAMILY = ("PAGO", "ENVIADO", "ENTREGUE")


def map_status(mp_status: str) -> str:
    if mp_status == "approved":
        return "PAGO"
    if mp_status in ("cancelled", "rejected", "refunded", "charged_back"):
        return "CANCELADO"
    return "PENDENTE"


@router.post("/api/webhooks/mercadopago")
def mercadopago_webhook(request: Request, body: dict = Depends(json_body), db: Session = Depends(get_db)):
    settings = get_settings()
    query = request.query_params

    kind = body.get("type") or query.get("type")
    payment_id = str((body.get("data") or {}).get("id") or query.get("data.id") or "")
    if kind != "payment" or not payment_id:
        return {"ignored": True}

    # ---- assinatura (falha fechado) ----
    if settings.mp_webhook_secret:
        if not services.verify_mp_signature(
            request.headers.get("x-signature"), request.headers.get("x-request-id"), payment_id, settings.mp_webhook_secret
        ):
            log.warning("webhook com assinatura inválida (payment=%s)", payment_id)
            raise ApiError(401, "Assinatura inválida")
    elif not (settings.allow_unsigned_webhook and not settings.is_prod):
        log.error("MP_WEBHOOK_SECRET não configurado: webhook recusado.")
        raise ApiError(503, "Webhook não configurado.")

    cfg = db.get(StoreSettings, "singleton")
    token = ((cfg.mpAccessToken or "").strip() if cfg else "") or settings.mp_access_token
    if not token:
        raise ApiError(500, "MP não configurado")

    try:
        payment = services.fetch_payment(payment_id, token)
    except Exception as exc:  # rede/MP fora do ar: responder erro faz o MP tentar de novo depois
        log.error("falha ao consultar pagamento %s: %s", payment_id, exc)
        raise ApiError(502, "Não foi possível consultar o pagamento.")

    reference = payment.get("external_reference")
    if not reference:
        return {"ignored": True}
    order = db.scalar(select(Order).where(Order.reference == reference))
    if not order:
        return {"ignored": True}

    new_status = map_status(str(payment.get("status") or ""))
    payer = payment.get("payer") or {}
    payer_name = (f"{payer.get('first_name', '')} {payer.get('last_name') or ''}").strip() or order.customerName
    payer_email = payer.get("email") or order.customerEmail
    now = utcnow()
    did_pay = False

    if new_status == "PAGO":
        # Transição ATÔMICA: só uma chamada ganha; notificações repetidas não baixam estoque de novo.
        res = db.execute(
            update(Order)
            .where(Order.id == order.id, Order.status.not_in(_PAID_FAMILY))
            .values(status="PAGO", mpPaymentId=payment_id, customerName=payer_name, customerEmail=payer_email, updatedAt=now)
        )
        if res.rowcount == 1:
            did_pay = True
            for item in db.scalars(select(OrderItem).where(OrderItem.orderId == order.id)):
                db.execute(
                    update(Product)
                    .where(Product.id == item.productId)
                    .values(stock=case((Product.stock - item.quantity < 0, 0), else_=Product.stock - item.quantity), updatedAt=now)
                )
            if order.couponCode:
                db.execute(update(Coupon).where(Coupon.code == order.couponCode).values(timesRedeemed=Coupon.timesRedeemed + 1))
    elif new_status == "CANCELADO":
        # Estorno/recusa: vale a partir de qualquer estado que ainda não foi cancelado.
        db.execute(
            update(Order)
            .where(Order.id == order.id, Order.status != "CANCELADO")
            .values(status="CANCELADO", mpPaymentId=payment_id, updatedAt=now)
        )
    else:
        # PENDENTE: só vale se o pedido ainda está pendente (nunca rebaixa um pedido pago).
        db.execute(
            update(Order)
            .where(Order.id == order.id, Order.status == "PENDENTE")
            .values(mpPaymentId=payment_id, customerName=payer_name, customerEmail=payer_email, updatedAt=now)
        )
    db.commit()

    if did_pay:  # e-mail fora da transação, só quando ESTA chamada confirmou o pagamento
        try:
            services.send_order_confirmed_email(
                to=payer_email, store=(cfg.storeName if cfg else "NUTRI LAB BRASIL"),
                name=payer_name, reference=order.reference, total_cents=order.totalCents,
            )
        except Exception as exc:
            log.error("falha ao enviar e-mail de confirmação: %s", exc)

    return {"ok": True}
