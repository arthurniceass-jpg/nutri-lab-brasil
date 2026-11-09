"""Limite de tentativas (janela deslizante) guardado no BANCO.

Vale em qualquer servidor/instância, inclusive na Vercel (serverless), onde a memória do
processo não é compartilhada entre as chamadas. Guarda só um hash da chave, nunca o IP ou e-mail.

Uso típico em login: conta só as FALHAS por (IP + e-mail), por IP e por conta (e-mail); ao acertar
a senha, zera o contador do par. O limite por conta existe porque o IP pode ser falsificado:
sem ele, quem troca de IP a cada tentativa nunca seria bloqueado.
"""
from __future__ import annotations

import hashlib
import random
from datetime import timedelta

from fastapi import HTTPException, Request
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from .config import get_settings
from .models import RateHit, utcnow


class SlidingWindow:
    def __init__(self, name: str, limit: int, window_seconds: int):
        self.name = name
        self.limit = limit
        self.window = window_seconds

    def _bucket(self, key: str) -> str:
        return f"{self.name}:{hashlib.sha256(key.encode()).hexdigest()[:40]}"

    def blocked(self, db: Session, key: str) -> int:
        """0 se liberado; senão, segundos até poder tentar de novo."""
        now = utcnow()
        since = now - timedelta(seconds=self.window)
        count, oldest = db.execute(
            select(func.count(RateHit.id), func.min(RateHit.ts)).where(RateHit.bucket == self._bucket(key), RateHit.ts > since)
        ).one()
        if count >= self.limit and oldest:
            return max(1, int((oldest + timedelta(seconds=self.window) - now).total_seconds()) + 1)
        return 0

    def add(self, db: Session, key: str) -> None:
        now = utcnow()
        bucket = self._bucket(key)
        db.execute(delete(RateHit).where(RateHit.bucket == bucket, RateHit.ts <= now - timedelta(seconds=self.window)))
        db.add(RateHit(bucket=bucket, ts=now))
        if random.random() < 0.02:  # faxina ocasional: nada fica mais de 2 dias
            db.execute(delete(RateHit).where(RateHit.ts <= now - timedelta(days=2)))
        db.commit()

    def clear(self, db: Session, key: str) -> None:
        db.execute(delete(RateHit).where(RateHit.bucket == self._bucket(key)))
        db.commit()


def client_ip(request: Request) -> str:
    """IP do cliente. Atrás da Vercel (TRUST_PROXY=true) usa o cabeçalho que a própria Vercel define."""
    if get_settings().trust_proxy:
        for header in ("x-vercel-forwarded-for", "x-real-ip", "x-forwarded-for"):
            value = request.headers.get(header, "")
            if value:
                return value.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def too_many(retry_after: int) -> HTTPException:
    return HTTPException(
        status_code=429,
        detail="Muitas tentativas. Aguarde alguns minutos e tente de novo.",
        headers={"Retry-After": str(retry_after)},
    )


def first_block(db: Session, *checks: tuple[SlidingWindow, str]) -> int:
    """Maior tempo de espera entre vários limites (0 = liberado em todos)."""
    return max((w.blocked(db, k) for w, k in checks), default=0)


# Falhas de login do dono: poucas, porque só existe um dono.
owner_fail_by_ip_email = SlidingWindow("owner_pair", limit=5, window_seconds=15 * 60)
owner_fail_by_ip = SlidingWindow("owner_ip", limit=15, window_seconds=15 * 60)
owner_fail_by_account = SlidingWindow("owner_acc", limit=20, window_seconds=60 * 60)
# Falhas de login de clientes.
customer_fail_by_ip_email = SlidingWindow("cust_pair", limit=8, window_seconds=15 * 60)
customer_fail_by_ip = SlidingWindow("cust_ip", limit=30, window_seconds=15 * 60)
customer_fail_by_account = SlidingWindow("cust_acc", limit=30, window_seconds=60 * 60)
# Quantidade de requisições (todas) em rotas que criam coisas.
register_by_ip = SlidingWindow("register", limit=6, window_seconds=60 * 60)
shaker_create_by_ip = SlidingWindow("shaker_new", limit=30, window_seconds=60 * 60)
shaker_read_by_ip = SlidingWindow("shaker_get", limit=240, window_seconds=60 * 60)


def reset_all_limiters(db: Session) -> None:  # usado nos testes
    db.execute(delete(RateHit))
    db.commit()
