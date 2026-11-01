from sqlalchemy import select

from app import ratelimit
from app.models import Customer
from app.security import OWNER_COOKIE, CUSTOMER_COOKIE

OWNER = {"email": "dono@nutrilab.test", "password": "Dono!Segura2026"}
CADASTRO = {
    "name": "Ana Souza", "email": "ana@exemplo.com", "password": "Treino!Forte42", "cpf": "529.982.247-25",
    "cep": "50000-000", "address": "Rua das Flores", "number": "10", "city": "Recife", "state": "pe",
}


# ---------- dono ----------
def test_owner_login_sets_secure_cookie(client):
    r = client.post("/api/auth", json=OWNER)
    assert r.status_code == 200 and r.json() == {"ok": True}
    cookie = r.headers["set-cookie"].lower()
    assert OWNER_COOKIE in cookie and "httponly" in cookie and "samesite=lax" in cookie
    assert client.get("/api/sessao").json()["role"] == "OWNER"


def test_owner_wrong_password_is_generic_401(client):
    r = client.post("/api/auth", json={**OWNER, "password": "errada"})
    assert r.status_code == 401 and r.json() == {"error": "Credenciais invalidas."}
    assert OWNER_COOKIE not in r.headers.get("set-cookie", "")


def test_owner_bruteforce_is_blocked_with_retry_after(client):
    for _ in range(5):
        assert client.post("/api/auth", json={**OWNER, "password": "chute"}).status_code == 401
    r = client.post("/api/auth", json={**OWNER, "password": "chute"})
    assert r.status_code == 429 and int(r.headers["retry-after"]) > 0
    # bloqueado também com a senha CERTA: força bruta não pode "acertar de sorte" durante o bloqueio
    assert client.post("/api/auth", json=OWNER).status_code == 429


def test_owner_success_resets_failure_counter(client):
    for _ in range(4):
        client.post("/api/auth", json={**OWNER, "password": "chute"})
    assert client.post("/api/auth", json=OWNER).status_code == 200
    for _ in range(4):  # contador zerou: mais 4 falhas ainda não bloqueiam
        assert client.post("/api/auth", json={**OWNER, "password": "chute"}).status_code == 401


def test_owner_missing_fields_and_garbage_body(client):
    assert client.post("/api/auth", json={"email": "x"}).status_code == 400
    assert client.post("/api/auth", content=b"nao-e-json", headers={"content-type": "application/json"}).status_code == 400
    assert client.post("/api/auth", json=["lista"]).status_code == 400


def test_owner_logout_clears_cookie(client):
    client.post("/api/auth", json=OWNER)
    r = client.delete("/api/auth")
    assert r.status_code == 200
    assert client.get("/api/sessao").json()["role"] is None


# ---------- clientes ----------
def test_register_then_login_flow(client, db_session):
    r = client.post("/api/conta/registrar", json=CADASTRO)
    assert r.status_code == 200 and CUSTOMER_COOKIE in r.headers["set-cookie"]
    row = db_session.scalar(select(Customer).where(Customer.email == "ana@exemplo.com"))
    assert row and row.passwordHash.startswith("$2") and "Treino" not in row.passwordHash
    assert row.cpf == "52998224725" and row.state == "PE" and row.updatedAt is not None

    client.post("/api/conta/logout")
    ok = client.post("/api/conta/login", json={"email": "ANA@exemplo.com ", "password": "Treino!Forte42"})
    assert ok.status_code == 200
    assert client.get("/api/sessao").json() == {"role": "CUSTOMER", "name": "Ana Souza", "email": "ana@exemplo.com"}


def test_register_rejects_bad_input(client):
    cases = [
        ({**CADASTRO, "password": "123456"}, "8 caracteres"),
        ({**CADASTRO, "password": "senha123"}, "comum"),
        ({**CADASTRO, "cpf": "111.111.111-11"}, "CPF"),
        ({**CADASTRO, "email": "sem-arroba"}, "Email"),
        ({**CADASTRO, "cep": "123"}, "CEP"),
        ({**CADASTRO, "address": ""}, "endereço"),
        ({"name": "", "email": "", "password": ""}, "Preencha"),
    ]
    for payload, expected in cases:
        ratelimit.reset_all_limiters()  # cada caso é independente do limite de cadastros por hora
        r = client.post("/api/conta/registrar", json=payload)
        assert r.status_code == 400 and expected in r.json()["error"], (payload, r.json())


def test_duplicate_email_is_409(client):
    assert client.post("/api/conta/registrar", json=CADASTRO).status_code == 200
    assert client.post("/api/conta/registrar", json=CADASTRO).status_code == 409


def test_register_is_rate_limited(client):
    codes = [client.post("/api/conta/registrar", json={**CADASTRO, "cpf": "000"}).status_code for _ in range(8)]
    assert codes[:6] == [400] * 6 and codes[6:] == [429, 429]


def test_customer_login_does_not_reveal_whether_email_exists(client):
    client.post("/api/conta/registrar", json=CADASTRO)
    client.post("/api/conta/logout")
    wrong_pw = client.post("/api/conta/login", json={"email": "ana@exemplo.com", "password": "errada123"})
    no_user = client.post("/api/conta/login", json={"email": "ninguem@exemplo.com", "password": "errada123"})
    assert wrong_pw.status_code == no_user.status_code == 401
    assert wrong_pw.json() == no_user.json() == {"error": "Email ou senha incorretos."}


def test_customer_login_bruteforce_blocked(client):
    client.post("/api/conta/registrar", json=CADASTRO)
    client.post("/api/conta/logout")
    for _ in range(8):
        assert client.post("/api/conta/login", json={"email": "ana@exemplo.com", "password": "chute1234"}).status_code == 401
    r = client.post("/api/conta/login", json={"email": "ana@exemplo.com", "password": "Treino!Forte42"})
    assert r.status_code == 429


def test_oversized_body_is_rejected(client):
    r = client.post("/api/auth", content=b"x" * (70 * 1024), headers={"content-type": "application/json"})
    assert r.status_code == 413


def test_api_security_headers_present(client):
    r = client.get("/health")
    assert r.headers["x-content-type-options"] == "nosniff"
    assert r.headers["x-frame-options"] == "DENY"
    assert r.headers["cache-control"] == "no-store"
