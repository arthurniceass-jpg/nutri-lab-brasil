from __future__ import annotations

from typing import Any

from fastapi import Request
from fastapi.responses import JSONResponse


class ApiError(Exception):
    """Erro de API. Vira `{"error": "..."}`, o mesmo formato das rotas atuais do Next.js."""

    def __init__(self, status: int, message: str, headers: dict[str, str] | None = None):
        self.status = status
        self.message = message
        self.headers = headers or {}


def error_response(status: int, message: str, headers: dict[str, str] | None = None) -> JSONResponse:
    return JSONResponse({"error": message}, status_code=status, headers=headers)


async def json_body(request: Request) -> dict[str, Any]:
    """Corpo JSON como dict; qualquer coisa inválida vira {} (as rotas respondem 400 com mensagem)."""
    try:
        data = await request.json()
    except Exception:
        return {}
    return data if isinstance(data, dict) else {}


def text(value: Any, max_len: int = 200) -> str:
    """Texto limpo: string, sem espaços nas pontas, sem caracteres de controle, com tamanho máximo."""
    s = "" if value is None else str(value)
    s = "".join(ch for ch in s if ch == "\n" or ch >= " ").strip()
    return s[:max_len]
