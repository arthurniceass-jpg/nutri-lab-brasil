"""Ponto de entrada para a Vercel (Python serverless): expõe o aplicativo FastAPI como `app`."""
import os
import sys

# Garante que a pasta backend/ está no caminho de importação, para achar o pacote `app`.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app  # noqa: E402,F401
