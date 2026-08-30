import os
import uuid
import json
import logging
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Optional

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
        if channel == "audit_result":
            return await self._send_audit_result(recipient, payload)
        logger.warning(f"Unknown outbox channel: {channel}")
        return False

    async def _send_audit_result(self, recipient: str, payload: dict) -> bool:
        """RES-5: durable audit result delivery (replaces fire-and-forget task)."""
        try:
            from platform_api.routes.audit_api import AuditEmailData
            from platform_api.services.email_service import EmailService
            from platform_api.services.audit_db import audit_db as _adb

            result = await EmailService().send_audit_results(
                AuditEmailData(
                    url=payload.get("url", ""),
                    email=recipient,
                    name=payload.get("name"),
                    score=payload.get("score", 0),
                    grade=payload.get("grade", "N/A"),
                    findings=payload.get("findings") or [],
                    guided_implementation=payload.get("guided_implementation"),
                )
            )
            sent = result.get("status") == "sent"
            if sent and payload.get("audit_id"):
                try:
                    await _adb.mark_email_sent(payload["audit_id"])
                except Exception as exc:
                    logger.warning("mark_email_sent failed for %s: %s",
                                   payload.get("audit_id"), exc)
            else:
                logger.warning("audit_result send failed for %s: %s",
                               recipient, result.get("error"))
            return bool(sent)
        except Exception as exc:
            logger.error("audit_result dispatch error for %s: %s", recipient, exc)
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
        def _send() -> dict:
            from agentmail_client import AgentMailClient

            try:
                return AgentMailClient().send_transactional(
                    [recipient],
                    payload.get("subject", ""),
                    text=payload.get("body", ""),
                    html=(
                        payload.get("body")
                        if str(payload.get("content_type", "")).startswith("text/html")
                        else None
                    ),
                    client_id=f"txn:outbox:{payload.get('subject', 'msg')[:40]}:{recipient}",
                ) or {}
            except Exception as exc:  # noqa: BLE001
                logger.error(f"AgentMail send failed: {exc}")
                return {"_error": str(exc)}

        result = await asyncio.to_thread(_send)
        ok = not result.get("_error")
        if not ok:
            logger.error(f"outbox email dispatch failed: {result.get('_error')}")
        return ok


outbox = Outbox()
