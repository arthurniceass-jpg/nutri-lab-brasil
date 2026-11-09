import time

from starlette.requests import Request

from app import ratelimit
from app.config import get_settings
from app.models import RateHit
from app.ratelimit import SlidingWindow


def test_blocks_after_limit_and_reports_retry_after(db_session):
    w = SlidingWindow("t", limit=3, window_seconds=60)
    for _ in range(3):
        assert w.blocked(db_session, "k") == 0
        w.add(db_session, "k")
    assert 1 <= w.blocked(db_session, "k") <= 61


def test_keys_and_windows_are_independent_and_clear_works(db_session):
    a, b = SlidingWindow("a", 1, 60), SlidingWindow("b", 1, 60)
    a.add(db_session, "x")
    assert a.blocked(db_session, "x") > 0
    assert a.blocked(db_session, "y") == 0  # outra chave
    assert b.blocked(db_session, "x") == 0  # outro limitador
    a.clear(db_session, "x")
    assert a.blocked(db_session, "x") == 0


def test_window_expires(db_session):
    w = SlidingWindow("t", limit=1, window_seconds=1)
    w.add(db_session, "k")
    assert w.blocked(db_session, "k") > 0
    time.sleep(1.2)
    assert w.blocked(db_session, "k") == 0


def test_stores_only_a_hash_never_the_raw_ip_or_email(db_session):
    w = SlidingWindow("login", 5, 60)
    w.add(db_session, "203.0.113.9|ana@exemplo.com")
    row = db_session.query(RateHit).one()
    assert "ana" not in row.bucket and "203.0.113" not in row.bucket and len(row.bucket) <= 80


def _request(headers: dict, client=("10.0.0.1", 1234)) -> Request:
    return Request({"type": "http", "headers": [(k.encode(), v.encode()) for k, v in headers.items()], "client": client})


def test_client_ip_ignores_spoofable_headers_unless_proxy_is_trusted(monkeypatch):
    spoof = {"x-forwarded-for": "6.6.6.6", "x-real-ip": "7.7.7.7"}
    assert ratelimit.client_ip(_request(spoof)) == "10.0.0.1"  # sem confiar no proxy: usa o IP da conexão
    monkeypatch.setenv("TRUST_PROXY", "true")
    get_settings.cache_clear()
    try:
        assert ratelimit.client_ip(_request({**spoof, "x-vercel-forwarded-for": "1.2.3.4"})) == "1.2.3.4"
        assert ratelimit.client_ip(_request(spoof)) == "7.7.7.7"
        assert ratelimit.client_ip(_request({"x-forwarded-for": "8.8.8.8, 9.9.9.9"})) == "8.8.8.8"
        assert ratelimit.client_ip(_request({})) == "10.0.0.1"
    finally:
        monkeypatch.setenv("TRUST_PROXY", "false")
        get_settings.cache_clear()
