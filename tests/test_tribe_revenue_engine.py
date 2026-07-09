import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import tribe_revenue_engine as tribe


def test_referral_queue_prefers_paid_and_audit_relationships():
    rows = [
        {"event_type": "payment", "email": "founder@acme.com", "url": "https://acme.com"},
        {"event_type": "audit_delivered", "email": "ops@beta.com", "url": "https://beta.com/page"},
        {"event_type": "payment", "email": "stripe@example.com", "url": "https://bad.com"},
    ]

    out = tribe.build_referral_queue(rows)

    assert len(out) == 2
    assert out[0].priority == "p0"
    assert "one other founder" in out[0].body
    assert out[1].domain == "beta.com"


def test_consulting_bridge_for_warm_reply_not_paid_customer():
    replies = [
        {"sender": "buyer@acme.com", "classification": "warm", "preview": "Interested but lower risk first?"},
        {"sender": "paid@acme.com", "classification": "warm"},
        {"sender": "cold@acme.com", "classification": "cold", "preview": "thanks"},
    ]
    customers = [{"event_type": "payment", "email": "paid@acme.com"}]

    out = tribe.build_consulting_queue(replies, customers)

    assert len(out) == 1
    assert out[0].email == "buyer@acme.com"
    assert "3 short advisory passes" in out[0].body
    assert "No retainer" in out[0].body


def test_cart_queue_skips_paid_and_uses_lower_risk_message():
    carts = [
        {"email": "abandoned@acme.com", "url": "https://acme.com/pricing"},
        {"email": "paid@acme.com", "url": "https://acme.com/pricing"},
    ]
    customers = [{"event_type": "payment", "email": "paid@acme.com"}]

    out = tribe.build_cart_queue(carts, customers)

    assert len(out) == 1
    assert out[0].subject == "want the lower-risk path?"
    assert "bridge" in out[0].body


def test_brand_proof_queue_turns_work_into_content():
    rows = [{"event_type": "audit_delivered", "url": "https://acme.com", "email": "founder@acme.com"}]

    out = tribe.build_brand_proof_queue(rows)

    assert len(out) == 1
    assert "Most founders buy more traffic" in out[0]["post_angle"]


def test_cli_writes_all_queues(tmp_path, monkeypatch, capsys):
    base = tmp_path / "nebula"
    ledgers = base / "ledgers"
    gs = base / "growth_system"
    ledgers.mkdir(parents=True)
    gs.mkdir(parents=True)
    customer_ledger = ledgers / "customer-ledger.jsonl"
    replied = base / "replied_emails.jsonl"
    carts = ledgers / "abandoned_carts.jsonl"
    customer_ledger.write_text(json.dumps({"event_type": "payment", "email": "founder@acme.com", "url": "https://acme.com"}) + "\n")
    replied.write_text(json.dumps({"sender": "warm@beta.com", "classification": "warm"}) + "\n")
    carts.write_text(json.dumps({"email": "cart@gamma.com", "url": "https://gamma.com"}) + "\n")

    monkeypatch.setattr(tribe, "BASE", base)
    monkeypatch.setattr(tribe, "LEDGERS", ledgers)
    monkeypatch.setattr(tribe, "GS", gs)
    monkeypatch.setattr(tribe, "CUSTOMER_LEDGER", customer_ledger)
    monkeypatch.setattr(tribe, "REPLIED_EMAILS", replied)
    monkeypatch.setattr(tribe, "ABANDONED_CARTS", carts)
    monkeypatch.setattr(tribe, "REFERRAL_QUEUE", gs / "warm_intro_referral_queue.jsonl")
    monkeypatch.setattr(tribe, "CONSULTING_QUEUE", gs / "flexible_consulting_offer_queue.jsonl")
    monkeypatch.setattr(tribe, "BRAND_PROOF_QUEUE", gs / "brand_proof_queue.jsonl")
    monkeypatch.setattr(tribe, "CART_QUEUE", gs / "abandoned_checkout_recovery_queue.jsonl")
    monkeypatch.setattr(tribe, "CONFIG", gs / "tribe_growth_playbook.json")
    monkeypatch.setattr(sys, "argv", ["tribe_revenue_engine.py"])

    tribe.main()
    summary = json.loads(capsys.readouterr().out)

    assert summary["warm_intro_referrals"] == 1
    assert summary["consulting_bridges"] == 1
    assert summary["cart_recoveries"] == 1
    assert summary["brand_proof_assets"] == 1
    assert (gs / "tribe_growth_playbook.json").exists()
