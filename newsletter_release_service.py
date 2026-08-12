"""Authoritative newsletter release, eligibility, suppression, and submission boundary.

This module is the only application path allowed to submit newsletter marketing
messages to AgentMail. Content generation is deliberately separate from send
authorization.
"""
from __future__ import annotations

import hashlib
import html as html_lib
import json
import os
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Protocol
from urllib.parse import quote, urlparse

import asyncpg

API_BASE_URL = "https://api.nebulacomponents.shop"
UNSUBSCRIBE_PAGE_URL = "https://nebulacomponents.com/unsubscribe"
NEWSLETTER_FROM = "hello@nebulacomponents.com"
NEWSLETTER_FROM_NAME = "Nebula Components"
NEWSLETTER_REPLY_TO = "hello@nebulacomponents.com"
BUSINESS_ADDRESS = "Nebula Components, 66 Sonneck Square, Scarborough, ON M1E 1A9"
ALLOWED_LINK_HOSTS = {"nebulacomponents.com", "www.nebulacomponents.com", "api.nebulacomponents.shop"}


class ReleaseBlocked(RuntimeError):
    """Raised when a mandatory release control fails."""


@dataclass(frozen=True)
class RecipientState:
    subscriber_id: str
    email: str
    confirmed: bool
    unsubscribed: bool
    hard_bounced: bool
    complained: bool
    admin_suppressed: bool
    eligibility_state: str
    consent_state: str = "unknown"
    consent_source: str | None = None


@dataclass(frozen=True)
class EligibilityDecision:
    eligible: bool
    reason: str
    decision_hash: str


class Store(Protocol):
    def get_release(self, release_id: str) -> dict[str, Any] | None: ...


def canonicalize_message(payload: dict[str, Any]) -> str:
    """Canonicalize material message fields, excluding provider metadata."""
    headers = {str(k).lower(): str(v) for k, v in (payload.get("headers") or {}).items()}
    headers["list-unsubscribe"] = re.sub(r"email=[^>]+", "email={recipient}", headers.get("list-unsubscribe", ""))
    normalized_html = re.sub(r"https://[^\s\"'<>]*unsubscribe[^\s\"'<>]*", "{{UNSUBSCRIBE_URL}}", str(payload.get("html") or ""), flags=re.IGNORECASE)
    normalized_text = re.sub(r"https://[^\s\"'<>]*unsubscribe[^\s\"'<>]*", "{{UNSUBSCRIBE_URL}}", str(payload.get("text") or ""), flags=re.IGNORECASE)
    body = {
        "from": str(payload.get("from") or "").strip().lower(),
        "from_name": str(payload.get("from_name") or "").strip(),
        "reply_to": str(payload.get("reply_to") or "").strip().lower(),
        "subject": str(payload.get("subject") or ""),
        "preheader": str(payload.get("preheader") or ""),
        "html": normalized_html,
        "text": normalized_text,
        "headers": {key: headers[key] for key in sorted(headers)},
    }
    return json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def content_hash(payload: dict[str, Any]) -> str:
    return hashlib.sha256(canonicalize_message(payload).encode("utf-8")).hexdigest()


def recipient_email_hash(email: str) -> str:
    return hashlib.sha256(email.strip().lower().encode()).hexdigest()


def submission_key(release_id: str, subscriber_id: str) -> str:
    return hashlib.sha256(f"{release_id}\0{subscriber_id}".encode()).hexdigest()


def unsubscribe_url(email: str) -> str:
    return f"{UNSUBSCRIBE_PAGE_URL}?email={quote(email.strip().lower(), safe='')}"


def one_click_url(email: str) -> str:
    return f"{API_BASE_URL}/api/newsletter/unsubscribe-one-click?email={quote(email.strip().lower(), safe='')}"


def build_provider_payload(release: dict[str, Any], email: str) -> dict[str, Any]:
    encoded_recipient = quote(email.strip().lower(), safe="")
    rendered_html = str(release["approved_html"]).replace("{{RECIPIENT_EMAIL}}", email).replace("%7B%7BRECIPIENT_EMAIL%7D%7D", encoded_recipient).replace("{{UNSUBSCRIBE_URL}}", html_lib.escape(unsubscribe_url(email), quote=True))
    rendered_text = str(release["approved_text"]).replace("{{RECIPIENT_EMAIL}}", email).replace("%7B%7BRECIPIENT_EMAIL%7D%7D", encoded_recipient).replace("{{UNSUBSCRIBE_URL}}", unsubscribe_url(email))
    return {
        "from": release["from_address"],
        "from_name": release.get("from_name") or NEWSLETTER_FROM_NAME,
        "reply_to": release.get("reply_to") or NEWSLETTER_REPLY_TO,
        "subject": release["subject"],
        "preheader": release.get("preheader") or "",
        "html": rendered_html,
        "text": rendered_text,
        "headers": {"List-Unsubscribe": f"<{one_click_url(email)}>", "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"},
    }


def validate_links(payload: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    urls = re.findall(r"https?://[^\s'\"<>]+", f"{payload.get('html', '')}\n{payload.get('text', '')}")
    if not urls:
        errors.append("no HTTPS links")
    for raw in urls:
        url = raw.rstrip(".,);]")
        parsed = urlparse(url)
        if parsed.scheme != "https":
            errors.append(f"non-https URL: {url}")
        if parsed.hostname not in ALLOWED_LINK_HOSTS:
            errors.append(f"unexpected URL host: {parsed.hostname}")
        if any(token in url.lower() for token in ("localhost", "127.0.0.1", "staging", "{{", "}}")):
            errors.append(f"placeholder or non-production URL: {url}")
    if "unsubscribe" not in str(payload.get("html", "")).lower() or "unsubscribe" not in str(payload.get("text", "")).lower():
        errors.append("visible unsubscribe missing")
    if not payload.get("text"):
        errors.append("plaintext alternative missing")
    return sorted(set(errors))


def evaluate_recipient(state: RecipientState) -> EligibilityDecision:
    checks = [(state.confirmed, "confirmed_required"), (not state.unsubscribed, "unsubscribed"), (not state.hard_bounced, "hard_bounced"), (not state.complained, "complained"), (not state.admin_suppressed, "admin_suppressed"), (state.eligibility_state == "ELIGIBLE", "eligibility_state_unknown"), (state.consent_state == "VERIFIED", "consent_state_unknown")]
    for passed, reason in checks:
        if not passed:
            material = {"subscriber_id": state.subscriber_id, "email_hash": recipient_email_hash(state.email), "eligible": False, "reason": reason}
            return EligibilityDecision(False, reason, hashlib.sha256(json.dumps(material, sort_keys=True).encode()).hexdigest())
    material = {"subscriber_id": state.subscriber_id, "email_hash": recipient_email_hash(state.email), "eligible": True, "reason": "eligible"}
    return EligibilityDecision(True, "eligible", hashlib.sha256(json.dumps(material, sort_keys=True).encode()).hexdigest())


def assert_release_sendable(release: dict[str, Any] | None, submitted_payload: dict[str, Any]) -> None:
    if not release:
        raise ReleaseBlocked("release_artifact_missing")
    if release.get("status") != "APPROVED":
        raise ReleaseBlocked("release_artifact_not_approved")
    if not release.get("approved_content_hash"):
        raise ReleaseBlocked("approved_content_hash_missing")
    if content_hash(submitted_payload) != release["approved_content_hash"]:
        raise ReleaseBlocked("content_hash_mismatch")
    link_errors = validate_links(submitted_payload)
    if link_errors:
        raise ReleaseBlocked("link_validation_failed:" + ";".join(link_errors))


def create_release_payload(*, issue_id: str, campaign_id: str, subject: str, preheader: str, approved_html: str, approved_text: str, template_version: str, source_revision: str, build_revision: str, release_metadata: dict[str, Any] | None = None) -> dict[str, Any]:
    payload = {"from": NEWSLETTER_FROM, "from_name": NEWSLETTER_FROM_NAME, "reply_to": NEWSLETTER_REPLY_TO, "subject": subject, "preheader": preheader, "html": approved_html, "text": approved_text, "headers": {"List-Unsubscribe": "<https://api.nebulacomponents.shop/api/newsletter/unsubscribe-one-click?email={recipient}>", "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"}}
    return {"issue_id": issue_id, "campaign_id": campaign_id, "status": "APPROVED", "source_type": "newsletter_generation", "subject": subject, "preheader": preheader, "from_name": NEWSLETTER_FROM_NAME, "from_address": NEWSLETTER_FROM, "reply_to": NEWSLETTER_REPLY_TO, "approved_html": approved_html, "approved_text": approved_text, "approved_content_hash": content_hash(payload), "template_version": template_version, "source_revision": source_revision, "build_revision": build_revision, "approved_by": "automated_content_gate", "release_metadata": release_metadata or {}}


async def create_release(conn: Any, release: dict[str, Any]) -> dict[str, Any]:
    """Persist an approved immutable release artifact exactly once."""
    row = await conn.fetchrow("""
        INSERT INTO newsletter_release
          (issue_id,campaign_id,status,source_type,subject,preheader,from_name,
           from_address,reply_to,approved_html,approved_text,approved_content_hash,
           template_version,source_revision,build_revision,approved_at,approved_by,
           release_metadata)
        VALUES ($1,$2,'APPROVED',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,now(),$15,$16)
        ON CONFLICT (campaign_id) DO NOTHING
        RETURNING *
    """, release["issue_id"], release["campaign_id"], release["source_type"],
        release["subject"], release["preheader"], release["from_name"],
        release["from_address"], release["reply_to"], release["approved_html"],
        release["approved_text"], release["approved_content_hash"],
        release["template_version"], release["source_revision"], release["build_revision"],
        release.get("approved_by") or "automated_content_gate",
        json.dumps(release.get("release_metadata") or {}),
    )
    if row:
        return dict(row)
    existing = await conn.fetchrow("SELECT * FROM newsletter_release WHERE campaign_id=$1", release["campaign_id"])
    if not existing:
        raise ReleaseBlocked("release_artifact_unavailable")
    if existing["approved_content_hash"] != release["approved_content_hash"]:
        raise ReleaseBlocked("campaign_release_hash_conflict")
    return dict(existing)

async def send_release(release: dict[str, Any], *, dry_run: bool = False, db_url: str | None = None) -> dict[str, Any]:
    """Execute one release, re-reading each subscriber immediately before send."""
    if dry_run:
        return {"status": "dry_run", "release_id": str(release.get("release_id") or ""), "sent": 0, "blocked": 0}
    pool = await asyncpg.create_pool(db_url or os.getenv("AUDIT_DATABASE_URL", "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433"), min_size=1, max_size=3)
    sent = blocked = 0
    try:
        async with pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM newsletter_release WHERE release_id=$1 FOR UPDATE", release["release_id"])
            if not row or row["status"] != "APPROVED":
                raise ReleaseBlocked("release_artifact_not_approved")
            await conn.execute("UPDATE newsletter_release SET status='SENDING', actual_send_started_at=now() WHERE release_id=$1", release["release_id"])
        from agentmail_client import AgentMailClient
        client = AgentMailClient(inbox=NEWSLETTER_FROM)
        async with pool.acquire() as conn:
            subscribers = await conn.fetch("SELECT * FROM newsletter_subscribers ORDER BY subscribed_at, id")
        for subscriber in subscribers:
            async with pool.acquire() as conn:
                current = await conn.fetchrow("SELECT * FROM newsletter_subscribers WHERE id=$1 FOR UPDATE", subscriber["id"])
                if not current:
                    raise ReleaseBlocked("eligibility_store_unavailable")
                state = RecipientState(str(current["id"]), current["email"], bool(current["is_confirmed"]), current["unsubscribed_at"] is not None, current["hard_bounced_at"] is not None, current["complained_at"] is not None, current["admin_suppressed_at"] is not None, "ELIGIBLE" if current["is_confirmed"] and current["consent_state"] == "VERIFIED" else "UNKNOWN", current["consent_state"], current["consent_source"])
                decision = evaluate_recipient(state)
                decision_row = await conn.fetchrow("""INSERT INTO newsletter_recipient_decision (release_id,subscriber_id,email_hash,confirmation_state,consent_state,consent_source,unsubscribed_state,hard_bounce_state,complaint_state,admin_suppressed_state,suppression_reason,eligible,decision_reason,decision_hash) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT (release_id,subscriber_id) DO UPDATE SET evaluated_at=now() RETURNING decision_id""", release["release_id"], current["id"], recipient_email_hash(current["email"]), "CONFIRMED" if current["is_confirmed"] else "UNCONFIRMED", current["consent_state"], current["consent_source"], current["unsubscribed_at"] is not None, current["hard_bounced_at"] is not None, current["complained_at"] is not None, current["admin_suppressed_at"] is not None, current["suppression_reason"], decision.eligible, decision.reason, decision.decision_hash)
                if not decision.eligible:
                    blocked += 1
                    continue
                payload = build_provider_payload(dict(release), current["email"])
                assert_release_sendable(dict(release), payload)
                key = submission_key(str(release["release_id"]), str(current["id"]))
                prior = await conn.fetchrow("SELECT provider_message_id,provider_acceptance_state FROM newsletter_submission WHERE idempotency_key=$1", key)
                if prior and prior["provider_acceptance_state"] == "ACCEPTED":
                    blocked += 1
                    continue
                await conn.execute("INSERT INTO newsletter_submission (release_id,decision_id,subscriber_id,idempotency_key,provider,submitted_content_hash) VALUES ($1,$2,$3,$4,'agentmail',$5) ON CONFLICT (idempotency_key) DO NOTHING", release["release_id"], decision_row["decision_id"], current["id"], key, content_hash(payload))
            result = await __import__("asyncio").to_thread(client.send_newsletter, [current["email"]], release["subject"], text=payload["text"], html=payload["html"], client_id=f"campaign:{key}", labels=["newsletter", release["campaign_id"]], headers=payload["headers"])
            async with pool.acquire() as conn:
                message_id = result.get("message_id") or result.get("id") if isinstance(result, dict) else None
                if result.get("_error") if isinstance(result, dict) else True:
                    await conn.execute("UPDATE newsletter_submission SET provider_acceptance_state='FAILED',last_error=$2,retry_count=retry_count+1 WHERE idempotency_key=$1", key, str(result.get("_error") or result.get("_reason") or "provider_unconfirmed"))
                    blocked += 1
                else:
                    await conn.execute("UPDATE newsletter_submission SET provider_message_id=$2,submitted_at=now(),provider_acceptance_state='ACCEPTED' WHERE idempotency_key=$1", key, message_id)
                    sent += 1
        async with pool.acquire() as conn:
            await conn.execute("UPDATE newsletter_release SET status=$2,actual_send_completed_at=now() WHERE release_id=$1", release["release_id"], "SENT" if blocked == 0 else "PARTIAL")
        return {"status": "sent" if blocked == 0 else "partial", "sent": sent, "blocked": blocked}
    except Exception:
        async with pool.acquire() as conn:
            await conn.execute("UPDATE newsletter_release SET status='FAILED',actual_send_completed_at=now() WHERE release_id=$1 AND status='SENDING'", release["release_id"])
        raise
    finally:
        await pool.close()
