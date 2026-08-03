import os
import uuid
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx

from platform_api.services.audit_db import audit_db

logger = logging.getLogger(__name__)

RETRY_DELAYS_MINUTES = [1, 5, 30]
MAX_ATTEMPTS = 3

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS outbox_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel TEXT NOT NULL,
    recipient TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    attempts INT NOT NULL DEFAULT 0,
    next_retry_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON outbox_messages (status, next_retry_at)
    WHERE status = 'pending';
"""


class Outbox:
    async def _ensure_connected(self) -> None:
        await audit_db.connect()

    async def enqueue(
        self,
        channel: str,
        recipient: str,
        payload: dict,
    ) -> str:
        await self._ensure_connected()
        msg_id = str(uuid.uuid4())
        async with audit_db.pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO outbox_messages (id, channel, recipient, payload, status, next_retry_at)
                VALUES ($1, $2, $3, $4, 'pending', now())
                """,
                uuid.UUID(msg_id),
                channel,
                recipient,
                json.dumps(payload),
            )
        return msg_id

    async def drain(self) -> int:
        await self._ensure_connected()
        processed = 0
        now = datetime.now(timezone.utc)

        async with audit_db.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, channel, recipient, payload, attempts
                FROM outbox_messages
                WHERE status = 'pending' AND (next_retry_at IS NULL OR next_retry_at <= $1)
                ORDER BY created_at ASC
                LIMIT 50
                """,
                now,
            )

        for row in rows:
            msg_id = row["id"]
            channel = row["channel"]
            recipient = row["recipient"]
            payload = row["payload"] if isinstance(row["payload"], dict) else json.loads(row["payload"])
            attempts = row["attempts"] + 1

            success = await self._dispatch(channel, recipient, payload)

            async with audit_db.pool.acquire() as conn:
                if success:
                    await conn.execute(
                        "UPDATE outbox_messages SET status = 'sent', attempts = $2 WHERE id = $1",
                        msg_id,
                        attempts,
                    )
                elif attempts >= MAX_ATTEMPTS:
                    await conn.execute(
                        "UPDATE outbox_messages SET status = 'failed', attempts = $2 WHERE id = $1",
                        msg_id,
                        attempts,
                    )
                else:
                    delay_minutes = RETRY_DELAYS_MINUTES[min(attempts - 1, len(RETRY_DELAYS_MINUTES) - 1)]
                    next_retry = now + timedelta(minutes=delay_minutes)
                    await conn.execute(
                        "UPDATE outbox_messages SET attempts = $2, next_retry_at = $3 WHERE id = $1",
                        msg_id,
                        attempts,
                        next_retry,
                    )
            processed += 1

        return processed

    async def _dispatch(self, channel: str, recipient: str, payload: dict) -> bool:
        if channel == "email":
            return await self._send_email(recipient, payload)
        logger.warning(f"Unknown outbox channel: {channel}")
        return False

    async def _send_email(self, recipient: str, payload: dict) -> bool:
        api_key = os.environ.get("SENDGRID_API_KEY")
        if not api_key:
            logger.error("SENDGRID_API_KEY not set")
            return False

        from_email = payload.get("from_email", "audits@nebulacomponents.shop")
        from_name = payload.get("from_name", "Nebula Components")

        body = {
            "personalizations": [{"to": [{"email": recipient}]}],
            "from": {"email": from_email, "name": from_name},
            "subject": payload.get("subject", ""),
            "content": [
                {
                    "type": payload.get("content_type", "text/html"),
                    "value": payload.get("body", ""),
                }
            ],
        }

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    "https://api.sendgrid.com/v3/mail/send",
                    json=body,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                )
            return resp.status_code in (200, 201, 202)
        except httpx.HTTPError as exc:
            logger.error(f"SendGrid request failed: {exc}")
            return False


outbox = Outbox()
