from lead_store import LeadStore


def test_paid_lead_cannot_be_regressed_by_audit_registration(tmp_path):
    store = LeadStore(tmp_path / "leads.db")
    store.upsert_lead(email="buyer@example.com", stage="paid", source="payment")

    store.upsert_lead(
        email="buyer@example.com",
        stage="discovered",
        source="audit_request",
        trigger_context="requested_platform_audit",
    )

    lead = store.get_lead("buyer@example.com")
    assert lead is not None
    assert lead["stage"] == "paid"
    assert lead["source"] == "audit_request"


def test_replied_lead_cannot_be_regressed_by_audit_delivery(tmp_path):
    store = LeadStore(tmp_path / "leads.db")
    store.upsert_lead(email="reply@example.com", stage="replied", source="inbound")

    store.upsert_lead(
        email="reply@example.com",
        stage="audit_delivered",
        source="audit_request",
        audit_score=8.2,
        audit_grade="B",
    )

    lead = store.get_lead("reply@example.com")
    assert lead is not None
    assert lead["stage"] == "replied"
    assert lead["audit_score"] == 8.2
    assert lead["audit_grade"] == "B"
