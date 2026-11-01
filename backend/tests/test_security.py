import time

import jwt
import pytest

from app import security as sec


def test_owner_token_roundtrip_and_role_isolation():
    token = sec.create_owner_token("dono@nutrilab.test")
    assert sec.decode_token(token, "OWNER")["sub"] == "dono@nutrilab.test"
    # um token de dono NÃO vale como cliente (e vice-versa)
    assert sec.decode_token(token, "CUSTOMER") is None
    cust = sec.create_customer_token("c123", "Ana", "ana@x.com")
    assert sec.decode_token(cust, "OWNER") is None
    assert sec.decode_token(cust, "CUSTOMER")["name"] == "Ana"


def test_rejects_tampered_expired_and_alg_none():
    token = sec.create_owner_token("dono@nutrilab.test")
    assert sec.decode_token(token[:-3] + "AAA", "OWNER") is None  # assinatura adulterada
    assert sec.decode_token(None, "OWNER") is None
    assert sec.decode_token("lixo", "OWNER") is None
    forged = jwt.encode({"role": "OWNER", "sub": "x", "exp": int(time.time()) + 600}, key="", algorithm="none")
    assert sec.decode_token(forged, "OWNER") is None  # alg=none nunca é aceito
    wrong_key = jwt.encode({"role": "OWNER", "sub": "x", "exp": int(time.time()) + 600}, "outra-chave" * 6, algorithm="HS256")
    assert sec.decode_token(wrong_key, "OWNER") is None
    expired = jwt.encode({"role": "OWNER", "sub": "x", "exp": int(time.time()) - 5}, "s" * 48, algorithm="HS256")
    assert sec.decode_token(expired, "OWNER") is None
    no_exp = jwt.encode({"role": "OWNER", "sub": "x"}, "s" * 48, algorithm="HS256")
    assert sec.decode_token(no_exp, "OWNER") is None  # token sem validade é recusado


def test_password_hash_and_dummy_timing_path():
    h = sec.hash_password("Senha!Forte9")
    assert sec.verify_password("Senha!Forte9", h)
    assert not sec.verify_password("errada123", h)
    assert not sec.verify_password("qualquer", None)  # usuário inexistente: falso, sem exceção
    assert not sec.verify_password("qualquer", "isso-nao-e-um-hash")


def test_owner_verification():
    assert sec.verify_owner("dono@nutrilab.test", "Dono!Segura2026")
    assert sec.verify_owner("  DONO@nutrilab.test ", "Dono!Segura2026")
    assert not sec.verify_owner("dono@nutrilab.test", "errada")
    assert not sec.verify_owner("outro@x.com", "Dono!Segura2026")


@pytest.mark.parametrize("pw,expected", [
    ("abc123", "ao menos 8"),
    ("senha123", "muito comum"),
    ("nutrilab123", "muito comum"),
    ("aaaaaaaa1", "muito comum"),
    ("somenteletras", "letras e números"),
    ("123456789012", "letras e números"),
    ("x" * 80 + "1", "no máximo 72"),
])
def test_weak_passwords_are_rejected(pw, expected):
    assert expected in (sec.password_problem(pw) or "")


def test_good_password_and_identity_rules():
    assert sec.password_problem("Treino!Forte42") is None
    assert "e-mail" in (sec.password_problem("arthur2026", email="arthur2026@x.com") or "")


def test_cpf_validation():
    assert sec.is_valid_cpf("529.982.247-25")
    assert sec.is_valid_cpf("52998224725")
    assert not sec.is_valid_cpf("111.111.111-11")
    assert not sec.is_valid_cpf("529.982.247-24")
    assert not sec.is_valid_cpf("123")
    assert not sec.is_valid_cpf("")


def test_ids_look_like_cuid_and_are_unique():
    ids = {sec.new_id() for _ in range(500)}
    assert len(ids) == 500 and all(i.startswith("c") and len(i) == 25 for i in ids)
