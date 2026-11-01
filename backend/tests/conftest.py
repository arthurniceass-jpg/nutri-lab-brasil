"""Ambiente de teste: SQLite em memória, segredos falsos e limites zerados a cada teste."""
import os

# Precisa ficar ANTES de importar o app (as configurações são lidas uma vez).
os.environ.update(
    APP_ENV="test",
    DATABASE_URL="sqlite://",
    AUTH_SECRET="s" * 48,
    OWNER_EMAIL="dono@nutrilab.test",
    MP_WEBHOOK_SECRET="whsec_teste_123",
    TRUST_PROXY="false",
)
import bcrypt  # noqa: E402

os.environ["OWNER_PASSWORD_HASH"] = bcrypt.hashpw(b"Dono!Segura2026", bcrypt.gensalt(4)).decode()

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app import ratelimit  # noqa: E402
from app.db import get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Base  # noqa: E402


@pytest.fixture()
def db_session():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, expire_on_commit=False)
    with Session() as s:
        yield s


@pytest.fixture()
def client(db_session):
    def _get_db():
        yield db_session

    app.dependency_overrides[get_db] = _get_db
    ratelimit.reset_all_limiters()
    yield TestClient(app)
    app.dependency_overrides.clear()
