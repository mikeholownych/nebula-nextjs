"""Regression tests for durable subscription welcome retries."""

from scripts import subscription_welcome_email_retry as retry


class FakeCursor:
    def __init__(self, existing=None):
        self.existing = existing
        self.executed = []

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def execute(self, sql, params=None):
        self.executed.append((sql, params))

    def fetchone(self):
        return self.existing


class FakeConnection:
    def __init__(self, cursor):
        self._cursor = cursor

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def cursor(self):
        return self._cursor


def _row():
    return {
        "id": "00000000-0000-0000-0000-000000000001",
        "stripe_subscription_id": "sub_test_123",
        "plan": "pro",
        "email": "owner@example.com",
    }


def test_candidate_query_resolves_email_through_org_membership():
    assert "JOIN memberships" in retry.CANDIDATES_SQL
    assert "JOIN users" in retry.CANDIDATES_SQL
    assert "u.email" in retry.CANDIDATES_SQL
    assert "s.email" not in retry.CANDIDATES_SQL
    assert "welcome_email_enqueued_at" in retry.CANDIDATES_SQL


def test_enqueue_inserts_bounded_idempotent_outbox_message(monkeypatch):
    cursor = FakeCursor(existing=None)
    monkeypatch.setattr(
        retry.psycopg2,
        "connect",
        lambda *_args, **_kwargs: FakeConnection(cursor),
    )

    ok, detail = retry.enqueue(_row())

    assert ok is True
    assert detail == "enqueued"
    sql = "\n".join(statement for statement, _ in cursor.executed)
    assert "pg_advisory_xact_lock" in sql
    assert "subscription_welcome" in sql
    assert "INSERT INTO outbox_messages" in sql


def test_enqueue_dedupes_existing_open_or_sent_message(monkeypatch):
    cursor = FakeCursor(existing=("existing-id",))
    monkeypatch.setattr(
        retry.psycopg2,
        "connect",
        lambda *_args, **_kwargs: FakeConnection(cursor),
    )

    ok, detail = retry.enqueue(_row())

    assert ok is True
    assert detail == "already_enqueued"
    assert not any("INSERT INTO outbox_messages" in sql for sql, _ in cursor.executed)
