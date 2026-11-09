import pytest

from app.config import Settings


def url_of(database_url: str):
    return Settings(database_url=database_url, auth_secret="s" * 40).sqlalchemy_url


def test_prisma_url_is_converted_and_prisma_only_params_removed():
    url, args = url_of("postgresql://u:p@db.x.supabase.co:5432/postgres?schema=public&connection_limit=1")
    assert url == "postgresql+psycopg://u:p@db.x.supabase.co:5432/postgres"
    assert args == {}


@pytest.mark.parametrize("raw", [
    "postgresql://u:p@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
    "postgresql://u:p@aws-0-sa-east-1.pooler.supabase.com:5432/postgres",   # só o host do pooler
    "postgresql://u:p@qualquer-host.com:6543/postgres",                       # só a porta 6543
])
def test_pooler_disables_prepared_statements(raw):
    url, args = url_of(raw)
    assert url.startswith("postgresql+psycopg://") and "pgbouncer" not in url
    assert args == {"prepare_threshold": None}


def test_sslmode_is_kept_and_sqlite_untouched():
    assert "sslmode=require" in url_of("postgres://u:p@h:5432/d?sslmode=require&schema=public")[0]
    assert url_of("sqlite://")[0] == "sqlite://"


def test_production_refuses_insecure_configuration():
    s = Settings(app_env="production", database_url="sqlite://", auth_secret="curto", owner_email="")
    problems = " | ".join(s.validate_for_runtime())
    assert "AUTH_SECRET" in problems and "SQLite" in problems and "OWNER_EMAIL" in problems
    ok = Settings(app_env="production", database_url="postgresql://u:p@h:5432/d", auth_secret="x" * 40,
                  owner_email="d@x.com", owner_password_hash="$2b$12$abc")
    assert ok.validate_for_runtime() == []
