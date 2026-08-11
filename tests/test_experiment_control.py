import json
import sqlite3
from pathlib import Path

from experiment_control import decision_for, report


def test_only_purchase_is_success_signal():
    assert decision_for({"sends": 3, "warm_replies": 2, "purchases": 0}) == "continue"
    assert decision_for({"sends": 10, "warm_replies": 2, "purchases": 0}) == "continue"
    assert decision_for({"sends": 20, "warm_replies": 4, "purchases": 0}) == "NO_PURCHASES"
    assert decision_for({"sends": 4, "warm_replies": 0, "purchases": 1}) == "SALE_SIGNAL"


def make_db(base: Path, rows: list[tuple]):
    db_dir = base / "lead_gen"
    db_dir.mkdir(parents=True)
    db = sqlite3.connect(str(db_dir / "lead_state.db"))
    db.execute("CREATE TABLE sequence_state (email TEXT, hook_variant TEXT, status TEXT, replied_at TEXT)")
    db.executemany("INSERT INTO sequence_state VALUES (?, ?, ?, ?)", rows)
    db.commit()
    db.close()
    (base / "ledgers").mkdir()


def test_report_requires_attributable_ledger_purchase(tmp_path: Path):
    make_db(tmp_path, [("buyer@example.com", "A", "replied", "2026-08-11T00:00:00Z")])
    (tmp_path / "ledgers" / "customer-ledger.jsonl").write_text("")
    result = report(tmp_path)
    row = next(r for r in result["variants"] if r["variant"] == "A")
    assert row["warm_replies"] == 1
    assert row["purchases"] == 0
    assert row["decision"] == "continue"
    assert result["winner"] is None


def test_report_marks_sale_only_when_email_matches_payment_ledger(tmp_path: Path):
    make_db(tmp_path, [("buyer@example.com", "B", "replied", "2026-08-11T00:00:00Z")])
    (tmp_path / "ledgers" / "customer-ledger.jsonl").write_text(
        json.dumps({"email": "buyer@example.com", "event_type": "payment"}) + "\n"
    )
    result = report(tmp_path)
    row = next(r for r in result["variants"] if r["variant"] == "B")
    assert row["purchases"] == 1
    assert row["decision"] == "SALE_SIGNAL"
    assert result["promotion_allowed"] is False
