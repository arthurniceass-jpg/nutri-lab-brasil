from __future__ import annotations

import threading
from functools import lru_cache
from typing import Iterator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool

from .config import get_settings
from .models import Base, RateHit, ShakerStack

# Tabelas que pertencem ao Python (as do Prisma nunca são criadas/alteradas por aqui).
PYTHON_TABLES = [RateHit.__table__, ShakerStack.__table__]
_ready = False
_lock = threading.Lock()


@lru_cache
def get_engine() -> Engine:
    settings = get_settings()
    url, connect_args = settings.sqlalchemy_url
    if url.startswith("sqlite"):
        return create_engine(url, connect_args=connect_args)
    if settings.serverless:
        # Serverless: cada chamada abre e fecha a sua conexão (o pooler do Supabase faz o resto).
        return create_engine(url, poolclass=NullPool, connect_args=connect_args)
    return create_engine(url, pool_pre_ping=True, pool_size=5, max_overflow=5, connect_args=connect_args)


def ensure_tables(engine: Engine | None = None) -> None:
    """Cria as tabelas do Python na primeira chamada de cada instância (a Vercel não roda 'lifespan')."""
    global _ready
    if _ready:
        return
    with _lock:
        if _ready:
            return
        Base.metadata.create_all(engine or get_engine(), tables=PYTHON_TABLES)
        _ready = True


@lru_cache
def _factory() -> sessionmaker[Session]:
    return sessionmaker(bind=get_engine(), expire_on_commit=False)


def get_db() -> Iterator[Session]:
    ensure_tables()
    db = _factory()()
    try:
        yield db
    finally:
        db.close()
