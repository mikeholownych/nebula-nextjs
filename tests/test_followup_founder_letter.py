from platform_api.services.followup_emails import FollowUpSequence


def test_24h_followup_is_a_founder_letter_not_a_vendor_pitch():
    body = FollowUpSequence()._build_followup_body(
        {
            "id": "audit-1",
            "name": "Sam",
            "url": "https://example.com",
            "score": 42,
            "grade": "D",
        },
        None,
        "audit_followup_24h",
    )

    assert "I built" in body
    assert "My own landing page" in body
    assert "reply yes" in body.lower()
    assert "Mike" in body
    assert "we handle" not in body.lower()
    assert "Best," not in body
    assert "—" not in body
    assert "impressions" not in body.lower()
