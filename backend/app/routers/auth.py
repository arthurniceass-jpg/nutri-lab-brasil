"""Autenticação: login do dono, login/cadastro/saída de clientes.

Caminhos, corpos e respostas iguais aos das rotas atuais do Next.js (/api/auth, /api/conta/*),
para o site poder trocar para o Python só com um redirecionamento (rewrite), sem mexer nas telas.
"""
from __future__ import annotations

import logging
import re

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import ratelimit as rl
from ..config import get_settings
from ..db import get_db
from ..http import ApiError, json_body, text
from ..models import Customer, utcnow
from ..security import (
    CUSTOMER_COOKIE,
    CUSTOMER_MAX_AGE,
    OWNER_COOKIE,
    OWNER_MAX_AGE,
    create_customer_token,
    create_owner_token,
    decode_token,
    hash_password,
    is_valid_cpf,
    new_id,
    password_problem,
    verify_owner,
    verify_password,
)

log = logging.getLogger("nutrilab.auth")
router = APIRouter()

_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def _set_cookie(response: Response, name: str, token: str, max_age: int) -> None:
    response.set_cookie(
        name, token, max_age=max_age, path="/", httponly=True, samesite="lax",
        secure=get_settings().is_prod,
    )


def _guard(blocked_seconds: int) -> None:
    if blocked_seconds:
        raise rl.too_many(blocked_seconds)  # 429; o handler converte para {"error": ...}


# ---------------- dono ----------------
@router.post("/api/auth")
def owner_login(request: Request, response: Response, body: dict = Depends(json_body), db: Session = Depends(get_db)):
    email, password = text(body.get("email"), 254), str(body.get("password") or "")[:256]
    if not email or not password:
        raise ApiError(400, "Informe email e senha.")

    ip, acct = rl.client_ip(request), email.lower()
    k_pair = f"{ip}|{acct}"
    _guard(rl.first_block(db, (rl.owner_fail_by_ip_email, k_pair), (rl.owner_fail_by_ip, ip), (rl.owner_fail_by_account, acct)))

    if not verify_owner(email, password):
        for window, key in ((rl.owner_fail_by_ip_email, k_pair), (rl.owner_fail_by_ip, ip), (rl.owner_fail_by_account, acct)):
            window.add(db, key)
        log.warning("login do dono FALHOU ip=%s", ip)  # nunca registrar a senha
        raise ApiError(401, "Credenciais invalidas.")

    rl.owner_fail_by_ip_email.clear(db, k_pair)
    _set_cookie(response, OWNER_COOKIE, create_owner_token(email.strip().lower()), OWNER_MAX_AGE)
    return {"ok": True}


@router.delete("/api/auth")
def owner_logout(response: Response):
    response.delete_cookie(OWNER_COOKIE, path="/")
    return {"ok": True}


# ---------------- clientes ----------------
@router.post("/api/conta/login")
def customer_login(request: Request, response: Response, body: dict = Depends(json_body), db: Session = Depends(get_db)):
    email, password = text(body.get("email"), 254).lower(), str(body.get("password") or "")[:256]
    if not email or not password:
        raise ApiError(400, "Informe email e senha.")

    ip = rl.client_ip(request)
    k_pair = f"{ip}|{email}"
    _guard(rl.first_block(db, (rl.customer_fail_by_ip_email, k_pair), (rl.customer_fail_by_ip, ip), (rl.customer_fail_by_account, email)))

    customer = db.scalar(select(Customer).where(Customer.email == email))
    # Mesmo tempo de resposta com e sem conta (verify_password usa um hash falso quando não há conta).
    if not verify_password(password, customer.passwordHash if customer else None):
        for window, key in ((rl.customer_fail_by_ip_email, k_pair), (rl.customer_fail_by_ip, ip), (rl.customer_fail_by_account, email)):
            window.add(db, key)
        raise ApiError(401, "Email ou senha incorretos.")

    rl.customer_fail_by_ip_email.clear(db, k_pair)
    _set_cookie(response, CUSTOMER_COOKIE, create_customer_token(customer.id, customer.name, customer.email), CUSTOMER_MAX_AGE)
    return {"ok": True}


@router.post("/api/conta/registrar")
def customer_register(request: Request, response: Response, b: dict = Depends(json_body), db: Session = Depends(get_db)):
    ip = rl.client_ip(request)
    _guard(rl.register_by_ip.blocked(db, ip))
    rl.register_by_ip.add(db, ip)  # conta toda tentativa: cadastro em massa é abuso

    name, email = text(b.get("name"), 80), text(b.get("email"), 254).lower()
    password = str(b.get("password") or "")
    if not name or not email or not password:
        raise ApiError(400, "Preencha nome, email e senha.")
    if not _EMAIL_RE.match(email):
        raise ApiError(400, "Email inválido.")
    problem = password_problem(password, email=email, name=name)
    if problem:
        raise ApiError(400, problem)

    cpf = re.sub(r"\D", "", str(b.get("cpf") or ""))
    cep = re.sub(r"\D", "", str(b.get("cep") or ""))
    if not is_valid_cpf(cpf):
        raise ApiError(400, "CPF inválido.")
    if len(cep) < 8:
        raise ApiError(400, "CEP deve ter no mínimo 8 digitos.")
    address, number = text(b.get("address"), 160), text(b.get("number"), 20)
    if not address:
        raise ApiError(400, "Informe o endereço.")
    if not number:
        raise ApiError(400, "Informe o número.")

    if db.scalar(select(Customer.id).where(Customer.email == email)):
        raise ApiError(409, "Já existe uma conta com este email.")

    now = utcnow()
    customer = Customer(
        id=new_id(), name=name, email=email, passwordHash=hash_password(password), cpf=cpf, cep=cep[:8],
        address=address, number=number, complement=text(b.get("complement"), 80) or None,
        neighborhood=text(b.get("neighborhood"), 80) or None, city=text(b.get("city"), 80) or None,
        state=text(b.get("state"), 2).upper() or None, createdAt=now, updatedAt=now,
    )
    db.add(customer)
    db.commit()

    _set_cookie(response, CUSTOMER_COOKIE, create_customer_token(customer.id, customer.name, customer.email), CUSTOMER_MAX_AGE)
    return {"ok": True}


@router.post("/api/conta/logout")
def customer_logout(response: Response):
    response.delete_cookie(CUSTOMER_COOKIE, path="/")
    return {"ok": True}


@router.get("/api/sessao")
def whoami(request: Request):
    """Quem está logado (dono, cliente ou ninguém). Útil para o front e para diagnóstico."""
    owner = decode_token(request.cookies.get(OWNER_COOKIE), "OWNER")
    if owner:
        return {"role": "OWNER", "email": owner["sub"]}
    cust = decode_token(request.cookies.get(CUSTOMER_COOKIE), "CUSTOMER")
    if cust:
        return {"role": "CUSTOMER", "name": cust.get("name", ""), "email": cust.get("email", "")}
    return {"role": None}
