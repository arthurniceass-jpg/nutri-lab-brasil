"""Sessões (JWT), senhas e validações de segurança.

Os tokens têm o MESMO formato dos que o Next.js (biblioteca `jose`) emite e verifica
(HS256, claim `role`, `sub`...). Por isso um login feito no Python vale no middleware do
Next.js e vice-versa, e a migração pode ser feita rota a rota, sem derrubar ninguém.
"""
from __future__ import annotations

import hmac
import re
import secrets
import time
from typing import Any

import bcrypt
import jwt

from .config import get_settings

OWNER_COOKIE = "nl_session"
CUSTOMER_COOKIE = "nl_customer"
OWNER_MAX_AGE = 60 * 60 * 8  # 8 horas
CUSTOMER_MAX_AGE = 60 * 60 * 24 * 30  # 30 dias
ALG = "HS256"
BCRYPT_ROUNDS = 12  # hashes bcrypt continuam legíveis pelo bcryptjs do Next.js

# Hash fixo usado quando o usuário não existe: o tempo de resposta fica igual ao de
# "senha errada", e quem ataca não descobre quais e-mails têm conta (timing attack).
_DUMMY_HASH = bcrypt.hashpw(b"dummy-password-for-timing", bcrypt.gensalt(BCRYPT_ROUNDS))


def _secret() -> str:
    value = get_settings().auth_secret
    if len(value) < 32:
        raise RuntimeError("AUTH_SECRET não configurado ou curto demais (mínimo 32 caracteres).")
    return value


# ---------- JWT ----------
def create_owner_token(email: str) -> str:
    now = int(time.time())
    return jwt.encode(
        {"role": "OWNER", "sub": email, "iat": now, "exp": now + OWNER_MAX_AGE},
        _secret(),
        algorithm=ALG,
    )


def create_customer_token(customer_id: str, name: str, email: str) -> str:
    now = int(time.time())
    return jwt.encode(
        {"role": "CUSTOMER", "name": name, "email": email, "sub": customer_id,
         "iat": now, "exp": now + CUSTOMER_MAX_AGE},
        _secret(),
        algorithm=ALG,
    )


def decode_token(token: str | None, role: str) -> dict[str, Any] | None:
    """Valida assinatura, expiração e papel. Só aceita HS256 (nunca 'none')."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, _secret(), algorithms=[ALG], options={"require": ["exp", "sub"]})
    except jwt.PyJWTError:
        return None
    return payload if payload.get("role") == role else None


# ---------- senhas ----------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(BCRYPT_ROUNDS)).decode()


def verify_password(password: str, hashed: str | None) -> bool:
    """Compara em tempo constante. Com `hashed=None` ainda gasta o mesmo tempo."""
    target = hashed.encode() if hashed else _DUMMY_HASH
    try:
        ok = bcrypt.checkpw(password.encode()[:72], target)
    except ValueError:  # hash malformado
        bcrypt.checkpw(password.encode()[:72], _DUMMY_HASH)
        return False
    return ok and hashed is not None


def constant_time_equal(a: str, b: str) -> bool:
    return hmac.compare_digest(a.encode(), b.encode())


def verify_owner(email: str, password: str) -> bool:
    """Confere e-mail + senha do dono. Sempre faz o trabalho completo (sem atalho por e-mail errado)."""
    s = get_settings()
    email_ok = bool(s.owner_email) and constant_time_equal(email.strip().lower(), s.owner_email.strip().lower())
    if s.owner_password_hash:
        pass_ok = verify_password(password, s.owner_password_hash)
    elif s.owner_password:
        pass_ok = constant_time_equal(password, s.owner_password)
    else:
        verify_password(password, None)
        pass_ok = False
    return email_ok and pass_ok


# ---------- política de senha ----------
_COMMON = {
    "12345678", "123456789", "1234567890", "password", "senha123", "senha1234", "qwerty123",
    "nutrilab123", "nutrilab", "nutrilab1", "admin123", "admin1234", "11111111", "abc12345",
    "iloveyou", "mudar123", "brasil123", "corinthians", "flamengo1",
}


def password_problem(password: str, email: str = "", name: str = "") -> str | None:
    """Devolve a mensagem do problema (em português) ou None se a senha é aceitável."""
    if len(password) < 8:
        return "A senha deve ter ao menos 8 caracteres."
    if len(password.encode()) > 72:  # limite do bcrypt: evita truncar em silêncio
        return "A senha pode ter no máximo 72 caracteres."
    low = password.lower()
    if low in _COMMON or len(set(low)) <= 2:
        return "Essa senha é muito comum. Escolha outra."
    if email and low == email.split("@")[0].lower():
        return "A senha não pode ser igual ao seu e-mail."
    if name and len(name) >= 4 and low == name.strip().lower():
        return "A senha não pode ser igual ao seu nome."
    if not (re.search(r"[A-Za-z]", password) and re.search(r"\d", password)):
        return "Use letras e números na senha."
    return None


# ---------- identificadores ----------
def new_id() -> str:
    """Id no estilo cuid ('c' + 24 hex): o Prisma gera ids no cliente, então o Python precisa gerar os dele."""
    return "c" + secrets.token_hex(12)


_CPF_RE = re.compile(r"\D")


def is_valid_cpf(value: str) -> bool:
    d = _CPF_RE.sub("", value or "")
    if len(d) != 11 or d == d[0] * 11:
        return False
    for n in (9, 10):
        total = sum(int(d[i]) * (n + 1 - i) for i in range(n))
        check = (total * 10 % 11) % 10
        if check != int(d[n]):
            return False
    return True
