import inspect

from platform_api.services.audit_db import AuditDB


def test_connect_does_not_alter_table():
    source = inspect.getsource(AuditDB.connect)
    assert "ALTER TABLE" not in source
    assert "ALTER TABLE" not in source.upper().replace("ALTER TABLE", "ALTER TABLE")


def test_connect_sets_statement_timeout_on_interactive_pool():
    source = inspect.getsource(AuditDB.connect)
    assert "statement_timeout" in source
    assert "15s" in source or "15000" in source
