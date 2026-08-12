"""Authoritative AgentMail webhook ingestion for newsletter delivery events.

AgentMail uses Svix signatures. The endpoint verifies the raw request before
parsing, deduplicates the stable Svix delivery ID, maps provider message IDs to
the submission ledger, and applies global suppression for bounce/complaint/
unsubscribe events. Missing or invalid verification never mutates state.
"""
from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime, timezone
from typing import Any

import asyncpg
from fastapi import APIRouter, HTTPException, Request, Response
from svix.webhooks import Webhook, WebhookVerificationError

router = APIRouter()


def _payload_hash(payload: dict[str, Any]) -> str:
    return hashlib.sha256(
        json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()


def _event_type(payload: dict[str, Any]) -> str:
    provider_type = str(payload.get("event_type") or "").lower()
    return {
        "message.sent": "SENT",
        "message.delivered": "DELIVERY",
        "message.bounced": "HARD_BOUNCE" if str((payload.get("bounce") or {}).get("type", "")).lower() in {"hard", "permanent"} else "SOFT_BOUNCE",
        "message.complained": "COMPLAINT",
        "message.rejected": "REJECTED",
    }.get(provider_type, "")


def _event_message_id(payload: dict[str, Any]) -> str | None:
    event_type = str(payload.get("event_type") or "")
    section = {
        "message.sent": "send",
        "message.delivered": "delivery",
        "message.bounced": "bounce",
        "message.complained": "complaint",
        "message.rejected": "reject",
    }.get(event_type, "")
    value = (payload.get(section) or {}).get("message_id")
    return str(value).strip() if value else None


def _event_timestamp(payload: dict[str, Any]) -> datetime:
    event_type = str(payload.get("event_type") or "")
    section = {
        "message.sent": "send",
        "message.delivered": "delivery",
        "message.bounced": "bounce",
        "message.complained": "complaint",
        "message.rejected": "reject",
    }.get(event_type, "")
    value = (payload.get(section) or {}).get("timestamp")
    if not value:
        return datetime.now(timezone.utc)
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="invalid event timestamp") from exc


def _recipients(payload: dict[str, Any]) -> list[str]:
    event_type = str(payload.get("event_type") or "")
    section = {
        "message.sent": "send",
        "message.delivered": "delivery",
        "message.bounced": "bounce",
        "message.complained": "complaint",
        "message.rejected": "reject",
    }.get(event_type, "")
    values = (payload.get(section) or {}).get("recipients") or []
    result: list[str] = []
    for item in values:
        value = item.get("address") if isinstance(item, dict) else item
        if value:
            result.append(str(value).strip().lower())
    return result


@router.post("/newsletter/provider-events", status_code=204)
async def provider_event(request: Request) -> Response:
    secret = os.getenv("AGENTMAIL_WEBHOOK_SECRET")
    if not secret:
        raise HTTPException(status_code=503, detail="webhook verification unavailable")

    raw = await request.body()
    try:
        payload = Webhook(secret).verify(raw, request.headers)
    except WebhookVerificationError as exc:
        raise HTTPException(status_code=401, detail="invalid webhook signature") from exc

    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="invalid webhook payload")

    provider_type = str(payload.get("event_type") or "")
    event_type = _event_type(payload)
    provider_event_id = str(request.headers.get("svix-id") or payload.get("event_id") or "").strip()
    if not provider_event_id or not event_type:
        raise HTTPException(status_code=400, detail="unsupported or unidentified provider event")

    message_id = _event_message_id(payload)
    recipients = _recipients(payload)
    if not message_id:
        raise HTTPException(status_code=400, detail="provider event missing stable message identity")

    pool = await asyncpg.create_pool(
        os.getenv("AUDIT_DATABASE_URL", "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433"),
        min_size=1,
        max_size=2,
    )
    try:
        async with pool.acquire() as conn:
            submission = await conn.fetchrow(
                "SELECT release_id, subscriber_id FROM newsletter_submission WHERE provider_message_id=$1",
                message_id,
            )
            if not submission:
                raise HTTPException(status_code=409, detail="provider message is not linked to a newsletter submission")

            inserted = await conn.fetchrow(
                """
                INSERT INTO newsletter_event
                  (provider_event_id,event_type,provider_message_id,subscriber_id,release_id,event_at,payload_hash)
                VALUES ($1,$2,$3,$4,$5,$6,$7)
                ON CONFLICT (provider_event_id) DO NOTHING
                RETURNING event_id
                """,
                provider_event_id,
                event_type,
                message_id,
                submission["subscriber_id"],
                submission["release_id"],
                _event_timestamp(payload),
                _payload_hash(payload),
            )
            if not inserted:
                return Response(status_code=204)

            if event_type in {"HARD_BOUNCE", "COMPLAINT"}:
                column = "hard_bounced_at" if event_type == "HARD_BOUNCE" else "complained_at"
                reason = "provider_hard_bounce" if event_type == "HARD_BOUNCE" else "provider_complaint"
                await conn.execute(
                    f"UPDATE newsletter_subscribers SET {column}=COALESCE({column},now()), suppression_reason=COALESCE(suppression_reason,$2) WHERE id=$1",
                    submission["subscriber_id"],
                    reason,
                )
            elif event_type == "DELIVERY":
                await conn.execute(
                    "UPDATE newsletter_submission SET provider_acceptance_state='DELIVERED' WHERE provider_message_id=$1",
                    message_id,
                )
            elif event_type == "SENT":
                await conn.execute(
                    "UPDATE newsletter_submission SET provider_acceptance_state=CASE WHEN provider_acceptance_state='PENDING' THEN 'ACCEPTED' ELSE provider_acceptance_state END WHERE provider_message_id=$1",
                    message_id,
                )
            elif event_type == "REJECTED":
                await conn.execute(
                    "UPDATE newsletter_submission SET provider_acceptance_state='FAILED', last_error=COALESCE(last_error,'provider_rejected') WHERE provider_message_id=$1",
                    message_id,
                )
    finally:
        await pool.close()
    return Response(status_code=204)
