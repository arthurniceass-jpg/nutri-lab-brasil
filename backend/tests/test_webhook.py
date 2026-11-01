import hashlib
import hmac

import pytest
from sqlalchemy import select

from app import services
from app.config import get_settings
from app.models import Coupon, Order, OrderItem, Product, StoreSettings, utcnow

SECRET = "whsec_teste_123"


def sign(payment_id: str, request_id: str = "req-1", ts: str = "1700000000", secret: str = SECRET) -> dict:
    manifest = f"id:{payment_id};request-id:{request_id};ts:{ts};"
    v1 = hmac.new(secret.encode(), manifest.encode(), hashlib.sha256).hexdigest()
    return {"x-signature": f"ts={ts},v1={v1}", "x-request-id": request_id}


def post(client, payment_id="999", headers=None):
    return client.post(
        f"/api/webhooks/mercadopago?data.id={payment_id}&type=payment",
        json={"type": "payment", "data": {"id": payment_id}},
        headers=headers if headers is not None else sign(payment_id),
    )


@pytest.fixture()
def loja(db_session):
    now = utcnow()
    db_session.add(StoreSettings(id="singleton", storeName="Nutri Lab", mpAccessToken="TEST-token"))
    db_session.add(Product(id="p1", slug="whey-x", name="Whey X", category="PROTEINAS", priceCents=9000, image="/x.webp", stock=10, active=True, updatedAt=now))
    db_session.add(Coupon(id="cp1", code="BEMVINDO", timesRedeemed=0))
    db_session.add(Order(id="o1", reference="NL-0001", status="PENDENTE", customerName="Ana", customerEmail="ana@x.com",
                         couponCode="BEMVINDO", totalCents=18000, updatedAt=now))
    db_session.add(OrderItem(id="i1", orderId="o1", productId="p1", quantity=2))
    db_session.commit()
    return db_session


def fake_mp(monkeypatch, status="approved", reference="NL-0001"):
    monkeypatch.setattr(services, "fetch_payment", lambda pid, token: {
        "status": status, "external_reference": reference, "payer": {"first_name": "Ana", "last_name": "Souza", "email": "ana@x.com"},
    })
    monkeypatch.setattr(services, "send_order_confirmed_email", lambda **kw: None)


def state(db):
    db.expire_all()
    return (db.get(Order, "o1").status, db.get(Product, "p1").stock, db.get(Coupon, "cp1").timesRedeemed)


def test_signature_verifier_unit():
    h = sign("1")
    assert services.verify_mp_signature(h["x-signature"], h["x-request-id"], "1", SECRET)
    assert not services.verify_mp_signature(h["x-signature"], h["x-request-id"], "2", SECRET)  # outro id
    assert not services.verify_mp_signature(h["x-signature"], "outro", "1", SECRET)  # outro request-id
    assert not services.verify_mp_signature(h["x-signature"], h["x-request-id"], "1", "chave-errada")
    assert not services.verify_mp_signature(None, "r", "1", SECRET)
    assert not services.verify_mp_signature("lixo", "r", "1", SECRET)
    assert not services.verify_mp_signature("ts=1,v1=", "r", "1", SECRET)


def test_missing_or_bad_signature_is_rejected_and_changes_nothing(client, loja, monkeypatch):
    fake_mp(monkeypatch)
    assert post(client, headers={}).status_code == 401
    bad = sign("999", secret="chave-errada")
    assert post(client, headers=bad).status_code == 401
    assert state(loja) == ("PENDENTE", 10, 0)


def test_fails_closed_without_secret(client, loja, monkeypatch):
    fake_mp(monkeypatch)
    monkeypatch.setenv("MP_WEBHOOK_SECRET", "")
    get_settings.cache_clear()
    try:
        assert post(client, headers={}).status_code == 503  # antes: aceitava tudo
        assert state(loja) == ("PENDENTE", 10, 0)
    finally:
        monkeypatch.setenv("MP_WEBHOOK_SECRET", SECRET)
        get_settings.cache_clear()


def test_approved_payment_marks_paid_and_decrements_once(client, loja, monkeypatch):
    fake_mp(monkeypatch)
    assert post(client).json() == {"ok": True}
    assert state(loja) == ("PAGO", 8, 1)
    # o Mercado Pago repete notificações: estoque e cupom NÃO podem baixar de novo
    for _ in range(3):
        assert post(client).status_code == 200
    assert state(loja) == ("PAGO", 8, 1)


def test_late_pending_notification_does_not_downgrade_paid_order(client, loja, monkeypatch):
    fake_mp(monkeypatch, "approved")
    post(client)
    fake_mp(monkeypatch, "pending")  # notificação atrasada, fora de ordem
    post(client)
    assert state(loja)[0] == "PAGO"


def test_refund_cancels_order(client, loja, monkeypatch):
    fake_mp(monkeypatch, "approved")
    post(client)
    fake_mp(monkeypatch, "refunded")
    post(client)
    assert state(loja)[0] == "CANCELADO"


def test_stock_never_goes_negative(client, loja, monkeypatch):
    loja.get(Product, "p1").stock = 1
    loja.commit()
    fake_mp(monkeypatch)
    post(client)
    assert state(loja)[1] == 0


def test_unknown_reference_and_irrelevant_events_are_ignored(client, loja, monkeypatch):
    fake_mp(monkeypatch, reference="NL-NAO-EXISTE")
    assert post(client).json() == {"ignored": True}
    r = client.post("/api/webhooks/mercadopago", json={"type": "merchant_order", "data": {"id": "1"}})
    assert r.json() == {"ignored": True}
    assert state(loja) == ("PENDENTE", 10, 0)


def test_mp_outage_returns_502_so_mp_retries(client, loja, monkeypatch):
    def boom(pid, token):
        raise RuntimeError("mp fora do ar")

    monkeypatch.setattr(services, "fetch_payment", boom)
    assert post(client).status_code == 502
    assert state(loja) == ("PENDENTE", 10, 0)
