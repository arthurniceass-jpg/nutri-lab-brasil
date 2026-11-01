from __future__ import annotations

from functools import lru_cache
from typing import Iterator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from .config import get_settings


@lru_cache
def get_engine() -> Engine:
    url, connect_args = get_settings().sqlalchemy_url
    return create_engine(url, pool_pre_ping=True, pool_size=5, max_overflow=5, connect_args=connect_args) \
        if not url.startswith("sqlite") else create_engine(url, connect_args=connect_args)


@lru_cache
def _factory() -> sessionmaker[Session]:
    return sessionmaker(bind=get_engine(), expire_on_commit=False)


def get_db() -> Iterator[Session]:
    db = _factory()()
    try:
        yield db
    finally:
        db.close()
