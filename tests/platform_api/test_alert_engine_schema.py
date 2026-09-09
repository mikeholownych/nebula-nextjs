"""Alert engine schema-correctness tests.

The alert engine previously queried a `purchases` table joined to `customers`
in the audit DB. That table was archived (purchases__archived_20260821) and the
authoritative purchases table moved to the platform DB with a different schema.
The audit DB's own canonical conversion signal is `audits.paid_at`.

These tests assert the alert engine's SQL no longer references the dropped
tables/columns, and instead uses audits.paid_at for CVR and revenue.
"""

import inspect
import re

import pytest

from platform_api.services import alert_engine


def _sql_of(fn) -> str:
    """Extract the concatenated SQL string literals from a function's source."""
    src = inspect.getsource(fn)
    # Collect all triple-quoted and single-quoted string literals.
    literals = re.findall(r'"""([\s\S]*?)"""', src)
    return "\n".join(literals)


def test_check_cvr_does_not_reference_dropped_purchases_table():
    sql = _sql_of(alert_engine.check_cvr)
    # The purchases table was dropped from the audit DB. The query must not
    # reference it (or its archived copy) as a live source.
    assert "FROM purchases" not in sql
    assert "JOIN purchases" not in sql
    assert "purchases__archived" not in sql


def test_check_cvr_uses_audits_paid_at_as_conversion_signal():
    sql = _sql_of(alert_engine.check_cvr)
    assert "paid_at" in sql


def test_check_daily_summary_does_not_reference_dropped_purchases_table():
    sql = _sql_of(alert_engine.check_daily_summary)
    assert "FROM purchases" not in sql
    assert "JOIN purchases" not in sql
    assert "purchases__archived" not in sql


def test_check_daily_summary_uses_audits_paid_at():
    sql = _sql_of(alert_engine.check_daily_summary)
    assert "paid_at" in sql


def test_check_daily_summary_does_not_reference_amount_cents():
    # amount_cents was a column on the old audit-DB purchases table. The
    # platform purchases table uses amount_total. The audit DB has no such
    # column on audits, so revenue must not be summed from a dropped table.
    sql = _sql_of(alert_engine.check_daily_summary)
    assert "amount_cents" not in sql
