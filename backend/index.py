"""Ponto de entrada para a Vercel (Python serverless): expõe o aplicativo FastAPI como `app`.

A Vercel detecta este arquivo e atende todas as rotas direto, sem redirecionamento.
"""
from app.main import app  # noqa: F401
