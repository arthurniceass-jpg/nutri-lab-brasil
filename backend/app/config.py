"""Configuração do back-end, lida de variáveis de ambiente (nunca do código).

Os nomes das variáveis são os MESMOS do front-end (AUTH_SECRET, OWNER_EMAIL, DATABASE_URL...),
porque o Python e o Next.js compartilham sessão (JWT) e banco de dados.
"""
from __future__ import annotations

import logging
from functools import lru_cache
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic_settings import BaseSettings, SettingsConfigDict

log = logging.getLogger("nutrilab.config")

# Parâmetros de conexão que o driver Python entende. O resto (schema, pgbouncer,
# connection_limit...) é do Prisma e precisa ser removido da URL.
_PG_QUERY_ALLOW = {"sslmode", "connect_timeout", "application_name"}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"  # "production" liga todas as travas
    database_url: str = "sqlite:///./dev.db"

    # Sessão (mesmo segredo e mesmo formato JWT do Next.js)
    auth_secret: str = ""
    owner_email: str = ""
    # Recomendado: hash bcrypt da senha do dono (veja README). `owner_password` (texto puro) é legado.
    owner_password_hash: str = ""
    owner_password: str = ""

    # Mercado Pago / e-mail
    mp_webhook_secret: str = ""
    mp_access_token: str = ""
    resend_api_key: str = ""
    email_from: str = "NUTRI LAB BRASIL <no-reply@nutrilab.com.br>"
    allow_unsigned_webhook: bool = False  # SÓ para testes locais; ignorado em produção

    # Rede
    trust_proxy: bool = False  # true atrás da Vercel/Railway: lê o IP real de X-Forwarded-For
    cors_origins: str = ""  # vazio = sem CORS (o site chama a API pelo mesmo domínio)
    public_base_url: str = "http://localhost:3000"

    @property
    def serverless(self) -> bool:
        """Na Vercel cada chamada pode rodar numa máquina diferente: sem pool de conexões fixo."""
        import os
        return bool(os.environ.get("VERCEL"))

    @property
    def is_prod(self) -> bool:
        return self.app_env.lower() == "production"

    @property
    def sqlalchemy_url(self) -> tuple[str, dict]:
        """URL no formato do SQLAlchemy + connect_args. Aceita a URL do Prisma/Supabase."""
        url = self.database_url
        if url.startswith("sqlite"):
            return url, {"check_same_thread": False}
        parts = urlsplit(url)
        scheme = "postgresql+psycopg" if parts.scheme in ("postgres", "postgresql") else parts.scheme
        query = parse_qsl(parts.query, keep_blank_values=True)
        # Pooler do Supabase (modo transação) não aceita prepared statements: detecta pela URL do Prisma
        # (?pgbouncer=true), pela porta 6543 ou pelo host "pooler".
        pgbouncer = (
            any(k == "pgbouncer" and v.lower() == "true" for k, v in query)
            or parts.port == 6543
            or "pooler." in (parts.hostname or "")
        )
        kept = [(k, v) for k, v in query if k in _PG_QUERY_ALLOW]
        clean = urlunsplit((scheme, parts.netloc, parts.path, urlencode(kept), ""))
        connect_args: dict = {}
        if pgbouncer:  # pooler em modo transação não aceita prepared statements
            connect_args["prepare_threshold"] = None
        return clean, connect_args

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    def validate_for_runtime(self) -> list[str]:
        """Devolve avisos; em produção, problemas graves viram erro e a API não sobe."""
        problems: list[str] = []
        if len(self.auth_secret) < 32:
            problems.append("AUTH_SECRET precisa ter pelo menos 32 caracteres.")
        if not self.owner_email:
            problems.append("OWNER_EMAIL não configurado.")
        if not (self.owner_password_hash or self.owner_password):
            problems.append("Configure OWNER_PASSWORD_HASH (recomendado) ou OWNER_PASSWORD.")
        if self.owner_password and not self.owner_password_hash:
            log.warning("OWNER_PASSWORD em texto puro está em uso: troque por OWNER_PASSWORD_HASH.")
        if not self.mp_webhook_secret:
            log.warning("MP_WEBHOOK_SECRET ausente: o webhook do Mercado Pago será RECUSADO (503).")
        if self.is_prod:
            if self.sqlalchemy_url[0].startswith("sqlite"):
                problems.append("DATABASE_URL aponta para SQLite em produção.")
            if self.allow_unsigned_webhook:
                problems.append("ALLOW_UNSIGNED_WEBHOOK não pode ficar ligado em produção.")
        return problems


@lru_cache
def get_settings() -> Settings:
    return Settings()
