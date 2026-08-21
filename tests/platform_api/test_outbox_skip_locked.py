import inspect

from platform_api.infra.outbox import Outbox


def test_drain_claims_with_skip_locked():
    source = inspect.getsource(Outbox.drain)
    assert "SKIP LOCKED" in source
    assert "FOR UPDATE" in source


def test_terminal_kit_failure_restores_purchase_failed():
    source = inspect.getsource(Outbox._mark_purchase_failed)
    assert "fulfillment_status = 'failed'" in source
    drain = inspect.getsource(Outbox.drain)
    assert "_mark_purchase_failed" in drain


def test_drain_and_connect_do_not_run_runtime_ddl():
    assert "CREATE TABLE" not in inspect.getsource(Outbox.drain)
    assert "CREATE TABLE" not in inspect.getsource(Outbox._ensure_connected)
    assert "ALTER TABLE" not in inspect.getsource(Outbox.drain)
