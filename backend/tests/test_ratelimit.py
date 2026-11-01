import time

from app.ratelimit import SlidingWindow


def test_blocks_after_limit_and_reports_retry_after():
    w = SlidingWindow(limit=3, window_seconds=60)
    for _ in range(3):
        assert w.blocked("k") == 0
        w.add("k")
    wait = w.blocked("k")
    assert 1 <= wait <= 61


def test_keys_are_independent_and_clear_works():
    w = SlidingWindow(limit=1, window_seconds=60)
    w.add("a")
    assert w.blocked("a") > 0
    assert w.blocked("b") == 0
    w.clear("a")
    assert w.blocked("a") == 0


def test_window_expires():
    w = SlidingWindow(limit=1, window_seconds=1)
    w.add("k")
    assert w.blocked("k") > 0
    time.sleep(1.2)
    assert w.blocked("k") == 0
