"""Integrações externas: Mercado Pago e e-mail (Resend)."""
from __future__ import annotations

import hashlib
import hmac
import html
import logging

import httpx

from .config import get_settings

log = logging.getLogger("nutrilab.services")
MP_API = "https://api.mercadopago.com"


def verify_mp_signature(signature: str | None, request_id: str | None, data_id: str, secret: str) -> bool:
    """Valida o cabeçalho `x-signature` (HMAC-SHA256) do Mercado Pago, em tempo constante."""
    if not signature or not secret:
        return False
    parts: dict[str, str] = {}
    for piece in signature.split(","):
        key, _, value = piece.partition("=")
        parts[key.strip()] = value.strip()
    ts, v1 = parts.get("ts"), parts.get("v1")
    if not ts or not v1:
        return False
    manifest = f"id:{data_id};request-id:{request_id or ''};ts:{ts};"
    computed = hmac.new(secret.encode(), manifest.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(computed, v1)


def fetch_payment(payment_id: str, access_token: str) -> dict:
    """Consulta o pagamento direto na API do Mercado Pago (a fonte da verdade do status)."""
    with httpx.Client(timeout=10) as client:
        r = client.get(f"{MP_API}/v1/payments/{payment_id}", headers={"Authorization": f"Bearer {access_token}"})
    r.raise_for_status()
    return r.json()


def _brl(cents: int) -> str:
    return f"R$ {cents / 100:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def send_order_confirmed_email(*, to: str, store: str, name: str, reference: str, total_cents: int) -> None:
    s = get_settings()
    if not s.resend_api_key:
        log.info("RESEND_API_KEY ausente: e-mail do pedido %s não enviado (modo dev).", reference)
        return
    e = html.escape
    body = (
        f"<h2>Pagamento confirmado</h2><p>Olá, {e(name)}! Recebemos o pagamento do pedido "
        f"<b>{e(reference)}</b> no valor de <b>{_brl(total_cents)}</b>.</p><p>Obrigado por comprar na {e(store)}.</p>"
    )
    with httpx.Client(timeout=10) as client:
        r = client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {s.resend_api_key}"},
            json={"from": s.email_from, "to": [to], "subject": f"Pagamento confirmado - pedido {reference}", "html": body},
        )
    r.raise_for_status()
