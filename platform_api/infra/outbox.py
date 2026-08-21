import os
import uuid
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx

from platform_api.services.audit_db import audit_db

logger = logging.getLogger(__name__)

# RES-2: historical sent messages only suppress re-enqueue for this window.
SENT_DEDUP_WINDOW_DAYS = 7

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

    async def find_open(self, channel: str, recipient: str) -> Optional[str]:
        """Dedup key = (channel, recipient).

        RES-2 semantics: an OPEN message (pending/sending) always suppresses a
        duplicate enqueue. A historical `sent` message suppresses re-sends only
        within SENT_DEDUP_WINDOW_DAYS so legitimate later deliveries (e.g. a
        new recovery sequence next month) are not permanently blocked, while
        crash-window duplicates inside the window stay suppressed.
        """
        await self._ensure_connected()
        async with audit_db.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT id FROM outbox_messages
                WHERE channel = $1 AND recipient = $2
                  AND (
                        status IN ('pending', 'sending')
                     OR (status = 'sent' AND created_at > NOW() - ($3 || ' days')::interval)
                  )
                ORDER BY created_at ASC
                LIMIT 1
                """,
                channel,
                recipient,
                str(SENT_DEDUP_WINDOW_DAYS),
            )
        return str(row["id"]) if row else None

    async def drain(self) -> int:
        await self._ensure_connected()
        processed = 0
        now = datetime.now(timezone.utc)
        async with audit_db.pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE outbox_messages SET status = 'pending'
                WHERE status = 'sending' AND next_retry_at IS NOT NULL AND next_retry_at <= $1
                """,
                now,
            )

        while processed < 50:
            async with audit_db.pool.acquire() as conn:
                async with conn.transaction():
                    row = await conn.fetchrow(
                        """
                        SELECT id, channel, recipient, payload, attempts
                        FROM outbox_messages
                        WHERE status = 'pending' AND (next_retry_at IS NULL OR next_retry_at <= $1)
                        ORDER BY created_at ASC
                        FOR UPDATE SKIP LOCKED
                        LIMIT 1
                        """,
                        now,
                    )
                    if not row:
                        break
                    msg_id = row["id"]
                    attempts = row["attempts"] + 1
                    await conn.execute(
                        """
                        UPDATE outbox_messages
                        SET status = 'sending', attempts = $2, next_retry_at = $3
                        WHERE id = $1
                        """,
                        msg_id,
                        attempts,
                        now + timedelta(minutes=15),
                    )

            channel = row["channel"]
            recipient = row["recipient"]
            payload = row["payload"] if isinstance(row["payload"], dict) else json.loads(row["payload"])
            success = await self._dispatch(channel, recipient, payload)

            async with audit_db.pool.acquire() as conn:
                if success:
                    await conn.execute(
                        "UPDATE outbox_messages SET status = 'sent', attempts = $2 WHERE id = $1",
                        msg_id,
                        attempts,
                    )
                    if channel == "kit_send":
                        await self._mark_purchase_delivered(payload)
                elif attempts >= MAX_ATTEMPTS:
                    await conn.execute(
                        "UPDATE outbox_messages SET status = 'failed', attempts = $2 WHERE id = $1",
                        msg_id,
                        attempts,
                    )
                    if channel == "kit_send":
                        await self._mark_purchase_failed(payload)
                else:
                    delay_minutes = RETRY_DELAYS_MINUTES[min(attempts - 1, len(RETRY_DELAYS_MINUTES) - 1)]
                    next_retry = now + timedelta(minutes=delay_minutes)
                    await conn.execute(
                        """
                        UPDATE outbox_messages
                        SET status = 'pending', attempts = $2, next_retry_at = $3
                        WHERE id = $1
                        """,
                        msg_id,
                        attempts,
                        next_retry,
                    )
            processed += 1

        return processed

    async def _dispatch(self, channel: str, recipient: str, payload: dict) -> bool:
        if channel == "email":
            return await self._send_email(recipient, payload)
        if channel == "kit_send":
            return await self._send_kit(payload)
        logger.warning(f"Unknown outbox channel: {channel}")
        return False

    async def _send_kit(self, payload: dict) -> bool:
        import asyncio
        import subprocess
        from pathlib import Path

        repo = Path(__file__).resolve().parents[2]
        script = repo / "scripts" / "deliver_prompt_pack.py"
        python = os.environ.get("AUDIT_PYTHON") or str(repo / "venv" / "bin" / "python3")
        if not Path(python).exists():
            python = "/home/mike/nebula/venv/bin/python3"
        cmd = [
            python,
            str(script),
            "--email",
            str(payload.get("email") or ""),
            "--stripe-session-id",
            str(payload.get("stripe_session_id") or ""),
            "--audit-id",
            str(payload.get("audit_id") or ""),
        ]

        def _run():
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=120,
                cwd=str(repo),
                shell=False,
            )
            return result.returncode == 0

        try:
            return await asyncio.to_thread(_run)
        except Exception as exc:
            logger.error("kit send failed: %s", exc)
            return False

    async def _mark_purchase_delivered(self, payload: dict) -> None:
        await self._update_purchase_fulfillment(
            payload,
            """
            UPDATE purchases
            SET fulfillment_status = 'delivered',
                audit_url = COALESCE($2, audit_url),
                reaudit_due_at = now() + INTERVAL '30 days'
            WHERE stripe_session_id = $1
              AND fulfillment_status = 'processing'
            """,
            extra=(payload.get("audit_url"),),
        )

    async def _mark_purchase_failed(self, payload: dict) -> None:
        await self._update_purchase_fulfillment(
            payload,
            """
            UPDATE purchases
            SET fulfillment_status = 'failed'
            WHERE stripe_session_id = $1
              AND fulfillment_status = 'processing'
            """,
        )

    async def _update_purchase_fulfillment(
        self,
        payload: dict,
        sql: str,
        extra: tuple = (),
    ) -> None:
        import asyncpg

        db_url = os.environ.get("DATABASE_URL")
        session_id = payload.get("stripe_session_id")
        if not db_url or not session_id:
            return
        conn = await asyncpg.connect(db_url)
        try:
            await conn.execute(sql, session_id, *extra)
        except Exception as exc:
            logger.error("purchase fulfillment update failed: %s", exc)
        finally:
            await conn.close()


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
