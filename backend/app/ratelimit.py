"""Limite de tentativas (janela deslizante) em memória.

Uso típico em login: conta só as FALHAS por (IP + e-mail) e por IP; ao acertar a senha, zera.
Assim quem erra a senha de vez em quando não é bloqueado, e quem tenta várias vezes sim.

Limite conhecido: o contador vive dentro do processo. Com uma única instância (Railway) basta;
com várias instâncias, troque `_store` por Redis mantendo esta mesma interface.
"""
from __future__ import annotations

import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

from .config import get_settings


class SlidingWindow:
    def __init__(self, limit: int, window_seconds: int):
        self.limit = limit
        self.window = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def _prune(self, key: str, now: float) -> deque[float]:
        q = self._hits[key]
        while q and q[0] <= now - self.window:
            q.popleft()
        if not q:
            self._hits.pop(key, None)
            return deque()
        return q

    def _gc(self, now: float) -> None:
        if len(self._hits) > 20_000:  # evita crescer sem limite sob ataque com muitos IPs
            for k in list(self._hits):
                self._prune(k, now)

    def blocked(self, key: str) -> int:
        """0 se liberado; senão, segundos até poder tentar de novo."""
        now = time.monotonic()
        with self._lock:
            q = self._prune(key, now)
            if len(q) >= self.limit:
                return max(1, int(q[0] + self.window - now) + 1)
            return 0

    def add(self, key: str) -> None:
        now = time.monotonic()
        with self._lock:
            self._gc(now)
            self._hits[key].append(now)

    def clear(self, key: str) -> None:
        with self._lock:
            self._hits.pop(key, None)

    def reset_all(self) -> None:
        with self._lock:
            self._hits.clear()


def client_ip(request: Request) -> str:
    if get_settings().trust_proxy:
        fwd = request.headers.get("x-forwarded-for", "")
        if fwd:
            return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def too_many(retry_after: int) -> HTTPException:
    return HTTPException(
        status_code=429,
        detail="Muitas tentativas. Aguarde alguns minutos e tente de novo.",
        headers={"Retry-After": str(retry_after)},
    )


# Falhas de login do dono: poucas, porque só existe um dono.
owner_fail_by_ip_email = SlidingWindow(limit=5, window_seconds=15 * 60)
owner_fail_by_ip = SlidingWindow(limit=15, window_seconds=15 * 60)
# Falhas de login de clientes.
customer_fail_by_ip_email = SlidingWindow(limit=8, window_seconds=15 * 60)
customer_fail_by_ip = SlidingWindow(limit=30, window_seconds=15 * 60)
# Quantidade de requisições (todas) em rotas que criam coisas.
register_by_ip = SlidingWindow(limit=6, window_seconds=60 * 60)
shaker_create_by_ip = SlidingWindow(limit=30, window_seconds=60 * 60)
shaker_read_by_ip = SlidingWindow(limit=240, window_seconds=60 * 60)

ALL = [owner_fail_by_ip_email, owner_fail_by_ip, customer_fail_by_ip_email, customer_fail_by_ip,
       register_by_ip, shaker_create_by_ip, shaker_read_by_ip]


def reset_all_limiters() -> None:  # usado nos testes
    for w in ALL:
        w.reset_all()
