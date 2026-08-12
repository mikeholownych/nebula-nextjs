import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from newsletter_release_service import (
    RecipientState,
    ReleaseBlocked,
    assert_release_sendable,
    build_provider_payload,
    content_hash,
    create_release_payload,
    evaluate_recipient,
    submission_key,
    validate_links,
)


def release(**overrides):
    data = create_release_payload(
        issue_id="issue-1",
        campaign_id="campaign-1",
        subject="A useful finding",
        preheader="A practical repair",
        approved_html='<p>Read the <a href="https://nebulacomponents.com/audit">audit</a>.</p><p><a href="{{UNSUBSCRIBE_URL}}">Unsubscribe</a></p>',
        approved_text="Read the audit: https://nebulacomponents.com/audit\nUnsubscribe: {{UNSUBSCRIBE_URL}}",
        template_version="v1",
        source_revision="source",
        build_revision="build",
    )
    data.update(overrides)
    return data


def state(**overrides):
    data = dict(
        subscriber_id="sub-1", email="reader@example.com", confirmed=True,
        unsubscribed=False, hard_bounced=False, complained=False,
        admin_suppressed=False, eligibility_state="ELIGIBLE",
        consent_state="VERIFIED", consent_source="website_double_opt_in",
    )
    data.update(overrides)
    return RecipientState(**data)


def test_approved_content_hash_matches_exact_provider_payload():
    r = release()
    payload = build_provider_payload(r, "reader@example.com")
    assert content_hash(payload) == r["approved_content_hash"]
    assert_release_sendable(r, payload)


def test_content_hash_mismatch_blocks():
    r = release()
    payload = build_provider_payload(r, "reader@example.com")
    payload["subject"] = "Changed after approval"
    with pytest.raises(ReleaseBlocked, match="content_hash_mismatch"):
        assert_release_sendable(r, payload)


def test_unapproved_and_missing_release_block():
    payload = build_provider_payload(release(), "reader@example.com")
    with pytest.raises(ReleaseBlocked, match="release_artifact_missing"):
        assert_release_sendable(None, payload)
    with pytest.raises(ReleaseBlocked, match="release_artifact_not_approved"):
        assert_release_sendable(release(status="DRAFT"), payload)


@pytest.mark.parametrize("changes,reason", [
    ({"confirmed": False}, "confirmed_required"),
    ({"unsubscribed": True}, "unsubscribed"),
    ({"hard_bounced": True}, "hard_bounced"),
    ({"complained": True}, "complained"),
    ({"admin_suppressed": True}, "admin_suppressed"),
    ({"eligibility_state": "UNKNOWN"}, "eligibility_state_unknown"),
    ({"consent_state": "UNKNOWN"}, "consent_state_unknown"),
])
def test_unknown_or_suppressed_recipient_is_not_eligible(changes, reason):
    decision = evaluate_recipient(state(**changes))
    assert decision.eligible is False
    assert decision.reason == reason
    assert len(decision.decision_hash) == 64


def test_valid_recipient_is_eligible():
    decision = evaluate_recipient(state())
    assert decision == evaluate_recipient(state())
    assert decision.eligible is True
    assert decision.reason == "eligible"


def test_submission_key_is_deterministic():
    assert submission_key("release", "subscriber") == submission_key("release", "subscriber")
    assert submission_key("release", "subscriber") != submission_key("release", "other")


def test_release_links_block_non_production_and_missing_unsubscribe():
    r = release()
    payload = build_provider_payload(r, "reader@example.com")
    payload["html"] = '<a href="http://localhost:3000">bad</a><p>Unsubscribe</p>'
    payload["text"] = "Unsubscribe"
    payload["headers"] = r["release_metadata"].get("headers", payload["headers"])
    with pytest.raises(ReleaseBlocked, match="content_hash_mismatch"):
        assert_release_sendable(r, payload)


def test_visible_unsubscribe_and_rfc_headers_are_generated():
    payload = build_provider_payload(release(), "reader@example.com")
    assert "Unsubscribe" in payload["html"]
    assert "List-Unsubscribe" in payload["headers"]
    assert payload["headers"]["List-Unsubscribe-Post"] == "List-Unsubscribe=One-Click"
