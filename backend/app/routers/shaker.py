"""Stacks do Shaker Lab salvos no servidor, com link curto (/shaker?c=CODIGO).

Hoje o site compartilha o stack só pela URL (?stack=slug1,slug2). Aqui o stack fica salvo:
o link fica curto, não dá para forjar um stack com produtos que não existem, e a loja passa a
saber quais combinações os clientes montam (base para recomendações e relatório do dono).
"""
from __future__ import annotations

import re
import secrets

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from .. import ratelimit as rl
from ..config import get_settings
from ..db import get_db
from ..http import ApiError, json_body, text
from ..models import Product, ShakerStack, utcnow
from ..security import CUSTOMER_COOKIE, decode_token

router = APIRouter()

GOALS = {"massa", "definicao", "energia"}
SLOT_BY_CATEGORY = {"PROTEINAS": "whey", "CREATINA": "cre", "PRE_TREINO": "pre"}
_ALPHABET = "23456789abcdefghijkmnopqrstuvwxyz"  # sem 0/o/1/l: fácil de ler e digitar
_CODE_RE = re.compile(r"^[2-9a-km-z]{6,12}$")


def _slot(p: Product) -> str | None:
    if p.name.lower().startswith("combo"):
        return None
    return SLOT_BY_CATEGORY.get(p.category)


def _public(p: Product) -> dict:
    return {
        "slug": p.slug, "name": p.name, "category": p.category, "weight": p.weight, "flavor": p.flavor,
        "priceCents": p.priceCents, "image": p.image, "inStock": p.stock > 0,
    }


@router.post("/api/shaker/stacks")
def create_stack(request: Request, body: dict = Depends(json_body), db: Session = Depends(get_db)):
    ip = rl.client_ip(request)
    wait = rl.shaker_create_by_ip.blocked(db, ip)
    if wait:
        raise rl.too_many(wait)
    rl.shaker_create_by_ip.add(db, ip)

    raw = body.get("items")
    if not isinstance(raw, list) or not 1 <= len(raw) <= 3:
        raise ApiError(400, "Escolha de 1 a 3 produtos para o stack.")
    goal = text(body.get("goal"), 20)
    if goal not in GOALS:
        raise ApiError(400, "Objetivo inválido.")

    wanted: list[tuple[str, str]] = []
    for it in raw:
        if not isinstance(it, dict):
            raise ApiError(400, "Item inválido.")
        slug = text(it.get("slug"), 120)
        if not slug:
            raise ApiError(400, "Item sem produto.")
        wanted.append((slug, text(it.get("flavor"), 40)))

    products = {p.slug: p for p in db.scalars(select(Product).where(Product.slug.in_([s for s, _ in wanted]), Product.active.is_(True)))}
    items, used = [], set()
    for slug, flavor in wanted:
        p = products.get(slug)
        slot = _slot(p) if p else None
        if not p or not slot:
            raise ApiError(400, "Há um produto que não pode entrar no stack.")
        if slot in used:
            raise ApiError(400, "Escolha no máximo um produto de cada tipo.")
        used.add(slot)
        allowed = {f.strip() for f in re.split(r",| e ", (p.flavor or "").split(":")[-1]) if f.strip()}
        items.append({"slug": slug, "flavor": flavor if flavor in allowed else ""})

    session = decode_token(request.cookies.get(CUSTOMER_COOKIE), "CUSTOMER")
    for _ in range(6):  # colisão de código é raríssima; tenta de novo
        code = "".join(secrets.choice(_ALPHABET) for _ in range(8))
        if not db.get(ShakerStack, code):
            break
    else:
        raise ApiError(500, "Não foi possível gerar o link. Tente de novo.")

    db.add(ShakerStack(code=code, items=items, goal=goal, name=text(body.get("name"), 18) or None,
                       customer_id=session["sub"] if session else None, created_at=utcnow()))
    db.commit()
    base = get_settings().public_base_url.rstrip("/")
    return {"code": code, "url": f"{base}/shaker?c={code}"}


@router.get("/api/shaker/stacks/{code}")
def read_stack(code: str, request: Request, db: Session = Depends(get_db)):
    ip = rl.client_ip(request)
    wait = rl.shaker_read_by_ip.blocked(db, ip)
    if wait:
        raise rl.too_many(wait)
    rl.shaker_read_by_ip.add(db, ip)

    if not _CODE_RE.match(code):
        raise ApiError(404, "Stack não encontrado.")
    stack = db.get(ShakerStack, code)
    if not stack:
        raise ApiError(404, "Stack não encontrado.")

    slugs = [i["slug"] for i in stack.items]
    products = {p.slug: p for p in db.scalars(select(Product).where(Product.slug.in_(slugs), Product.active.is_(True)))}
    db.execute(update(ShakerStack).where(ShakerStack.code == code).values(views=ShakerStack.views + 1))
    db.commit()
    return {
        "code": stack.code, "goal": stack.goal, "name": stack.name,
        "items": [{**_public(products[i["slug"]]), "chosenFlavor": i.get("flavor", "")} for i in stack.items if i["slug"] in products],
    }
