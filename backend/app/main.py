"""API da Nutri Lab em Python (FastAPI).

Rodar local:   uvicorn app.main:app --reload --port 8000
Em produção:   uvicorn app.main:app --host 0.0.0.0 --port $PORT   (Railway)
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text as sql_text
from starlette.middleware.base import BaseHTTPMiddleware

from .config import get_settings
from .db import get_engine
from .http import ApiError, error_response
from .models import Base, ShakerStack
from .routers import auth, shaker, webhook

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("nutrilab")

MAX_BODY_BYTES = 64 * 1024  # nenhuma rota precisa de mais que isso

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "no-store",  # respostas de API (sessão, stacks) não devem ficar em cache
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
}


class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        length = request.headers.get("content-length")
        if length and length.isdigit() and int(length) > MAX_BODY_BYTES:
            return error_response(413, "Requisição grande demais.")
        response = await call_next(request)
        for k, v in SECURITY_HEADERS.items():
            response.headers.setdefault(k, v)
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    problems = settings.validate_for_runtime()
    for p in problems:
        log.error("configuração: %s", p)
    if problems and settings.is_prod:
        raise RuntimeError("Configuração insegura para produção: " + " | ".join(problems))
    try:  # cria SÓ a tabela do Python; as do Prisma nunca são tocadas
        Base.metadata.create_all(get_engine(), tables=[ShakerStack.__table__])
    except Exception as exc:
        log.error("não consegui preparar a tabela shaker_stacks: %s", exc)
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    docs = None if settings.is_prod else "/docs"
    app = FastAPI(title="Nutri Lab API", version="0.1.0", lifespan=lifespan,
                  docs_url=docs, redoc_url=None, openapi_url=None if settings.is_prod else "/openapi.json")

    app.add_middleware(SecurityMiddleware)
    if settings.cors_list:
        app.add_middleware(CORSMiddleware, allow_origins=settings.cors_list, allow_credentials=True,
                           allow_methods=["GET", "POST", "DELETE"], allow_headers=["Content-Type"])

    @app.exception_handler(ApiError)
    async def _api_error(_: Request, exc: ApiError):
        return error_response(exc.status, exc.message, exc.headers)

    @app.exception_handler(HTTPException)
    async def _http_error(_: Request, exc: HTTPException):
        return error_response(exc.status_code, str(exc.detail), dict(exc.headers or {}))

    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, exc: RequestValidationError):
        return error_response(400, "Dados inválidos.")

    @app.exception_handler(Exception)
    async def _unexpected(_: Request, exc: Exception):
        log.exception("erro inesperado")  # detalhes só no log, nunca na resposta
        return error_response(500, "Erro interno. Tente novamente.")

    @app.get("/health")
    def health():
        return {"status": "ok"}

    @app.get("/health/db")
    def health_db():
        with get_engine().connect() as conn:
            conn.execute(sql_text("SELECT 1"))
        return {"status": "ok", "db": "ok"}

    app.include_router(auth.router)
    app.include_router(webhook.router)
    app.include_router(shaker.router)
    return app


app = create_app()
