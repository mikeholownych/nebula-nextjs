"""Central, fail-closed authorization boundary for buyer-facing email delivery."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
import fcntl
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import time
from contextlib import contextmanager
from typing import Callable


BASE = Path("/home/mike/nebula")
DEFAULT_INTERNAL_RECIPIENTS = frozenset({"mike.holownych@aisyndicate.io"})


class DeliveryPurpose(str, Enum):
    """Closed set of outbound delivery scopes."""

    MARKETING = "marketing"
    AUDIT_DELIVERY = "audit_delivery"
    CONVERSATION_REPLY = "conversation_reply"
    INTERNAL = "internal"


@dataclass(frozen=True)
class GateDecision:
    allowed: bool
    reason: str
    client_id: str


class OutboundReleaseGate:
    """Reserve one idempotent, suppression-cleared mailbox send slot."""

    TERMINAL_STAGES = frozenset({"bounced", "dead", "max_retries_exceeded"})
    STOP_CLASSIFICATIONS = frozenset(
        {
            "unsubscribe",
            "unsubscribed",
            "complaint",
            "complained",
            "spam",
            "blocked",
            "do_not_contact",
            "stop_reply",
        }
    )
    CLIENT_ID_PREFIXES = {
        DeliveryPurpose.MARKETING: (
            "auto:",
            "campaign:",
            "nurture:",
            "retainer:",
            "roundup:",
            "wave4:",
            "sre:",
        ),
        DeliveryPurpose.AUDIT_DELIVERY: ("audit:", "platform-audit:", "fix-pack:"),
        DeliveryPurpose.CONVERSATION_REPLY: ("reply:", "conversation:"),
        DeliveryPurpose.INTERNAL: ("internal:", "upwork-digest:"),
    }

    def __init__(
        self,
        state_db: Path | str = BASE / "outbound_delivery.db",
        lead_db: Path | str = BASE / "lead_state.db",
        replied_path: Path | str = BASE / "replied_emails.jsonl",
        disable_marker: Path | str = BASE / "OUTREACH_DISABLED",
        min_interval_seconds: int = 300,
        reservation_ttl_seconds: int = 900,
        clock: Callable[[], float] = time.time,
    ) -> None:
        self.state_db = Path(state_db)
        self.lead_db = Path(lead_db)
        self.replied_path = Path(replied_path)
        self.disable_marker = Path(disable_marker)
        self.min_interval_seconds = min_interval_seconds
        self.reservation_ttl_seconds = reservation_ttl_seconds
        self.clock = clock
        configured = {
            value.strip().lower()
            for value in os.environ.get("NEBULA_INTERNAL_RECIPIENTS", "").split(",")
            if value.strip()
        }
        self.internal_recipients = DEFAULT_INTERNAL_RECIPIENTS | frozenset(configured)
        self.state_db.parent.mkdir(parents=True, exist_ok=True)
        self.cutover_lock_path = self.state_db.with_name(f"{self.state_db.name}.cutover.lock")
        with self._cutover_lock():
            self._init_schema()

    @contextmanager
    def _cutover_lock(self):
        """Serialize schema migration and reply writes across processes."""
        with self.cutover_lock_path.open("a+") as lock_file:
            fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX)
            try:
                yield
            finally:
                fcntl.flock(lock_file.fileno(), fcntl.LOCK_UN)

    def _connect_state(self) -> sqlite3.Connection:
        last_error: sqlite3.OperationalError | None = None
        for attempt in range(8):
            conn = sqlite3.connect(self.state_db, timeout=10, isolation_level=None)
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA busy_timeout=10000")
            try:
                conn.execute("PRAGMA journal_mode=WAL")
                conn.execute("PRAGMA synchronous=FULL")
                return conn
            except sqlite3.OperationalError as exc:
                conn.close()
                if "locked" not in str(exc).lower() and "busy" not in str(exc).lower():
                    raise
                last_error = exc
                time.sleep(min(0.025 * (2 ** attempt), 0.5))
        assert last_error is not None
        raise last_error

    def _init_schema(self) -> None:
        with self._connect_state() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS delivery_reservations (
                    client_id TEXT PRIMARY KEY,
                    recipient TEXT NOT NULL,
                    purpose TEXT NOT NULL,
                    status TEXT NOT NULL,
                    reason TEXT NOT NULL DEFAULT '',
                    reserved_at REAL NOT NULL,
                    completed_at REAL,
                    provider_message_id TEXT NOT NULL DEFAULT ''
                )
                """
            )
            reservation_columns = {
                str(row[1]) for row in conn.execute("PRAGMA table_info(delivery_reservations)")
            }
            if "provider_message_id" not in reservation_columns:
                conn.execute(
                    "ALTER TABLE delivery_reservations "
                    "ADD COLUMN provider_message_id TEXT NOT NULL DEFAULT ''"
                )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_delivery_reserved_at ON delivery_reservations(reserved_at)"
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS delivery_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    client_id TEXT NOT NULL,
                    recipient TEXT NOT NULL,
                    purpose TEXT NOT NULL,
                    allowed INTEGER NOT NULL,
                    reason TEXT NOT NULL,
                    occurred_at REAL NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS processed_replies (
                    thread_id TEXT PRIMARY KEY,
                    email TEXT NOT NULL,
                    classification TEXT NOT NULL,
                    detected_at TEXT NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS reply_threads (
                    thread_id TEXT PRIMARY KEY,
                    email TEXT NOT NULL COLLATE NOCASE,
                    classification TEXT NOT NULL,
                    detected_at TEXT NOT NULL,
                    message_excerpt TEXT NOT NULL DEFAULT '',
                    action_status TEXT NOT NULL DEFAULT 'pending',
                    action_claimed_at REAL,
                    action_attempts INTEGER NOT NULL DEFAULT 0,
                    action_error TEXT NOT NULL DEFAULT ''
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS reply_suppressions (
                    email TEXT PRIMARY KEY COLLATE NOCASE,
                    classification TEXT NOT NULL,
                    detected_at TEXT NOT NULL,
                    source_thread_id TEXT NOT NULL
                )
                """
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_reply_suppressions_email ON reply_suppressions(email)"
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_reply_actions_status ON reply_threads(action_status, action_claimed_at)"
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS gate_state (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                )
                """
            )
        self._migrate_reply_ledger_v2()

    @classmethod
    def _suppression_strength(cls, classification: str) -> int:
        normalized = classification.strip().lower()
        if normalized in {"unsubscribe", "unsubscribed", "do_not_contact", "stop_reply"}:
            return 3
        if normalized in {"complaint", "complained", "spam", "blocked"}:
            return 2
        return 1

    def _upsert_suppression(
        self,
        conn: sqlite3.Connection,
        *,
        email: str,
        classification: str,
        detected_at: str,
        thread_id: str,
    ) -> None:
        existing = conn.execute(
            "SELECT classification FROM reply_suppressions WHERE email = ? COLLATE NOCASE",
            (email,),
        ).fetchone()
        if existing and self._suppression_strength(existing["classification"]) >= self._suppression_strength(classification):
            return
        conn.execute(
            """
            INSERT INTO reply_suppressions(email, classification, detected_at, source_thread_id)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(email) DO UPDATE SET
                classification=excluded.classification,
                detected_at=excluded.detected_at,
                source_thread_id=excluded.source_thread_id
            """,
            (email, classification, detected_at, thread_id),
        )

    def _migrate_reply_ledger_v2(self) -> None:
        """Atomically migrate a frozen legacy snapshot into the separated v2 schema."""
        with self._connect_state() as conn:
            if conn.execute(
                "SELECT 1 FROM gate_state WHERE key = 'reply_ledger_migration_v2'"
            ).fetchone():
                return

            conn.execute("BEGIN IMMEDIATE")
            source_bytes: bytes | None = None
            source_kind = "legacy_jsonl"
            records: list[tuple[str, str, str, str]] = []
            try:
                if self.replied_path.exists():
                    source_bytes = self.replied_path.read_bytes()
                    seen: dict[str, tuple[str, str, str]] = {}
                    for row_number, raw in enumerate(source_bytes.decode("utf-8").splitlines(), 1):
                        if not raw.strip():
                            continue
                        item = json.loads(raw)
                        email = str(
                            item.get("email") or item.get("from") or item.get("sender") or ""
                        ).strip().lower()
                        classification = str(
                            item.get("classification") or item.get("status") or "unknown"
                        ).strip().lower()
                        thread_id = str(item.get("thread_id") or "").strip()
                        detected_at = str(
                            item.get("detected_at")
                            or item.get("timestamp")
                            or item.get("processed_at")
                            or ""
                        ).strip()
                        if not email or not thread_id or not detected_at:
                            raise ValueError(f"invalid legacy reply row {row_number}")
                        value = (email, classification, detected_at)
                        if thread_id in seen and seen[thread_id] != value:
                            raise ValueError(f"conflicting legacy thread row {row_number}")
                        if thread_id not in seen:
                            seen[thread_id] = value
                            records.append((thread_id, email, classification, detected_at))
                else:
                    source_kind = "v1_sqlite"
                    rows = conn.execute(
                        "SELECT thread_id, email, classification, detected_at FROM processed_replies"
                    ).fetchall()
                    if not rows:
                        conn.rollback()
                        return
                    records = [
                        (
                            str(row["thread_id"]),
                            str(row["email"]).strip().lower(),
                            str(row["classification"]).strip().lower(),
                            str(row["detected_at"]),
                        )
                        for row in rows
                    ]

                for thread_id, email, classification, detected_at in records:
                    existing = conn.execute(
                        "SELECT email, classification, detected_at FROM reply_threads WHERE thread_id = ?",
                        (thread_id,),
                    ).fetchone()
                    if existing and (
                        str(existing["email"]).lower(),
                        str(existing["classification"]).lower(),
                        str(existing["detected_at"]),
                    ) != (email, classification, detected_at):
                        raise ValueError("conflicting existing reply thread")
                    conn.execute(
                        """
                        INSERT OR IGNORE INTO reply_threads
                            (thread_id, email, classification, detected_at, action_status)
                        VALUES (?, ?, ?, ?, 'completed')
                        """,
                        (thread_id, email, classification, detected_at),
                    )
                    self._upsert_suppression(
                        conn,
                        email=email,
                        classification=classification,
                        detected_at=detected_at,
                        thread_id=thread_id,
                    )
                    conn.execute(
                        """INSERT OR IGNORE INTO processed_replies
                           (thread_id, email, classification, detected_at) VALUES (?, ?, ?, ?)""",
                        (thread_id, email, classification, detected_at),
                    )

                if source_bytes is not None and self.replied_path.read_bytes() != source_bytes:
                    raise ValueError("legacy reply source changed during migration")
                manifest = {
                    "version": 2,
                    "source": source_kind,
                    "sha256": hashlib.sha256(source_bytes or b"").hexdigest(),
                    "rows": len(records),
                    "recipients": len({record[1] for record in records}),
                    "threads": len({record[0] for record in records}),
                }
                conn.execute(
                    "INSERT INTO gate_state(key, value) VALUES('reply_ledger_migration_v2', ?)",
                    (json.dumps(manifest, sort_keys=True),),
                )
                conn.execute("DELETE FROM gate_state WHERE key = 'reply_ledger_corrupt'")
                conn.commit()
            except (OSError, UnicodeError, ValueError, TypeError, json.JSONDecodeError, sqlite3.Error):
                conn.rollback()
                conn.execute(
                    "INSERT OR REPLACE INTO gate_state(key, value) VALUES('reply_ledger_corrupt', '1')"
                )

    def _lead_state(self, recipient: str) -> tuple[bool, str | None]:
        if not self.lead_db.exists():
            return False, "lead_store_unavailable"
        try:
            with sqlite3.connect(self.lead_db) as conn:
                conn.row_factory = sqlite3.Row
                row = conn.execute(
                    "SELECT stage, bounce_type FROM leads WHERE email = ? COLLATE NOCASE",
                    (recipient,),
                ).fetchone()
        except (sqlite3.Error, OSError):
            return False, "lead_store_unavailable"
        if not row:
            return False, None
        stage = (row["stage"] or "").lower()
        if stage == "bounced" or (row["bounce_type"] or ""):
            return True, "lead_bounced"
        if stage in self.TERMINAL_STAGES:
            return True, f"lead_{stage}"
        if stage == "paid":
            return True, "lead_paid"
        if stage == "replied":
            return True, "lead_replied"
        return True, None

    def _reply_reason(
        self,
        conn: sqlite3.Connection,
        recipient: str,
        purpose: DeliveryPurpose,
    ) -> str | None:
        if conn.execute(
            "SELECT 1 FROM gate_state WHERE key = 'reply_ledger_corrupt'"
        ).fetchone():
            return "reply_store_invalid"
        if not conn.execute(
            "SELECT 1 FROM gate_state WHERE key = 'reply_ledger_migration_v2'"
        ).fetchone():
            return "reply_store_unavailable"
        row = conn.execute(
            "SELECT classification FROM reply_suppressions WHERE email = ? COLLATE NOCASE",
            (recipient,),
        ).fetchone()
        if not row:
            return None
        classification = str(row["classification"] or "replied").lower()
        if classification in self.STOP_CLASSIFICATIONS:
            if classification in {"unsubscribe", "unsubscribed", "do_not_contact", "stop_reply"}:
                return "lead_unsubscribed"
            return "lead_complained"
        if purpose is DeliveryPurpose.MARKETING:
            return "lead_replied"
        return None

    def record_reply(
        self,
        *,
        email: str,
        classification: str,
        thread_id: str,
        detected_at: str | None = None,
        message_excerpt: str = "",
    ) -> bool:
        """Persist suppression and claimable action state; return True only for a new thread."""
        email = email.strip().lower()
        classification = classification.strip().lower() or "unknown"
        thread_id = thread_id.strip()
        detected_at = detected_at or datetime.now(timezone.utc).isoformat()
        if not email or not thread_id:
            raise ValueError("email and thread_id are required")
        with self._cutover_lock():
            with self._connect_state() as conn:
                conn.execute("BEGIN IMMEDIATE")
                existing = conn.execute(
                    "SELECT email, classification FROM reply_threads WHERE thread_id = ?",
                    (thread_id,),
                ).fetchone()
                if existing:
                    if (
                        str(existing["email"]).lower() != email
                        or str(existing["classification"]).lower() != classification
                    ):
                        conn.rollback()
                        raise ValueError("thread_id already belongs to a different reply fact")
                    conn.commit()
                    return False
                conn.execute(
                    """
                    INSERT INTO reply_threads
                        (thread_id, email, classification, detected_at, message_excerpt, action_status)
                    VALUES (?, ?, ?, ?, ?, 'pending')
                    """,
                    (thread_id, email, classification, detected_at, message_excerpt[:500]),
                )
                self._upsert_suppression(
                    conn,
                    email=email,
                    classification=classification,
                    detected_at=detected_at,
                    thread_id=thread_id,
                )
                conn.execute(
                    """INSERT OR IGNORE INTO processed_replies
                       (thread_id, email, classification, detected_at) VALUES (?, ?, ?, ?)""",
                    (thread_id, email, classification, detected_at),
                )
                conn.commit()
                return True

    def actionable_reply_thread_ids(self, stale_after_seconds: int = 900) -> list[str]:
        cutoff = float(self.clock()) - stale_after_seconds
        with self._connect_state() as conn:
            rows = conn.execute(
                """
                SELECT thread_id FROM reply_threads
                WHERE action_status IN ('pending', 'failed')
                   OR (action_status = 'processing' AND COALESCE(action_claimed_at, 0) <= ?)
                ORDER BY detected_at, thread_id
                """,
                (cutoff,),
            ).fetchall()
        return [str(row["thread_id"]) for row in rows]

    def claim_reply_action(
        self, thread_id: str, stale_after_seconds: int = 900
    ) -> dict[str, str] | None:
        """Lease one pending/failed/stale reply action to exactly one worker."""
        now = float(self.clock())
        cutoff = now - stale_after_seconds
        with self._connect_state() as conn:
            conn.execute("BEGIN IMMEDIATE")
            row = conn.execute(
                """
                SELECT thread_id, email, classification, detected_at, message_excerpt
                FROM reply_threads
                WHERE thread_id = ?
                  AND (action_status IN ('pending', 'failed')
                       OR (action_status = 'processing' AND COALESCE(action_claimed_at, 0) <= ?))
                """,
                (thread_id, cutoff),
            ).fetchone()
            if not row:
                conn.commit()
                return None
            conn.execute(
                """
                UPDATE reply_threads
                SET action_status='processing', action_claimed_at=?,
                    action_attempts=action_attempts+1, action_error=''
                WHERE thread_id=?
                """,
                (now, thread_id),
            )
            conn.commit()
            return {key: str(row[key]) for key in row.keys()}

    def complete_reply_action(self, thread_id: str, *, success: bool, error: str = "") -> None:
        with self._connect_state() as conn:
            conn.execute("BEGIN IMMEDIATE")
            conn.execute(
                """
                UPDATE reply_threads
                SET action_status=?, action_claimed_at=NULL, action_error=?
                WHERE thread_id=? AND action_status='processing'
                """,
                ("completed" if success else "failed", error[:200], thread_id),
            )
            conn.commit()

    def processed_thread_ids(self) -> set[str]:
        with self._connect_state() as conn:
            return {
                str(row["thread_id"])
                for row in conn.execute("SELECT thread_id FROM reply_threads").fetchall()
            }

    def reply_records(self) -> list[dict[str, str]]:
        """Return canonical reply facts for metrics and non-delivery queue builders."""
        with self._connect_state() as conn:
            rows = conn.execute(
                """SELECT email, classification, thread_id, detected_at
                   FROM reply_threads ORDER BY detected_at, thread_id"""
            ).fetchall()
        return [
            {
                "email": str(row["email"]),
                "sender": str(row["email"]),
                "classification": str(row["classification"]),
                "thread_id": str(row["thread_id"]),
                "detected_at": str(row["detected_at"]),
            }
            for row in rows
        ]

    def replied_emails(self) -> set[str]:
        return {row["email"].lower() for row in self.reply_records()}

    def _policy_reason(
        self,
        conn: sqlite3.Connection,
        recipient: str,
        purpose: DeliveryPurpose,
        client_id: str,
    ) -> str | None:
        if self.disable_marker.exists():
            return "outreach_disabled"
        if not client_id.startswith(self.CLIENT_ID_PREFIXES[purpose]):
            return "invalid_client_id_scope"
        if purpose is DeliveryPurpose.INTERNAL:
            return None if recipient in self.internal_recipients else "internal_recipient_not_allowed"

        found, reason = self._lead_state(recipient)
        if not found:
            return reason or "unknown_lead"
        if reason:
            if reason in {"lead_paid", "lead_replied"} and purpose in {
                DeliveryPurpose.AUDIT_DELIVERY,
                DeliveryPurpose.CONVERSATION_REPLY,
            }:
                pass
            else:
                return reason
        return self._reply_reason(conn, recipient, purpose)

    def _decision(
        self,
        recipient: str,
        purpose: DeliveryPurpose | str,
        client_id: str,
        allowed: bool,
        reason: str,
        conn: sqlite3.Connection | None = None,
    ) -> GateDecision:
        purpose_value = purpose.value if isinstance(purpose, DeliveryPurpose) else str(purpose)
        values = (client_id, recipient, purpose_value, int(allowed), reason, float(self.clock()))
        sql = """INSERT INTO delivery_events
                 (client_id, recipient, purpose, allowed, reason, occurred_at)
                 VALUES (?, ?, ?, ?, ?, ?)"""
        if conn is not None:
            conn.execute(sql, values)
        else:
            with self._connect_state() as event_conn:
                event_conn.execute(sql, values)
        return GateDecision(allowed, reason, client_id)

    def reserve(
        self,
        recipient: str,
        client_id: str,
        *,
        purpose: DeliveryPurpose,
    ) -> GateDecision:
        recipient = recipient.strip().lower()
        client_id = client_id.strip()
        if not recipient or not client_id or not isinstance(purpose, DeliveryPurpose):
            return self._decision(recipient, purpose, client_id, False, "invalid_request")

        now = float(self.clock())
        with self._connect_state() as conn:
            conn.execute("BEGIN IMMEDIATE")
            policy_reason = self._policy_reason(conn, recipient, purpose, client_id)
            if policy_reason:
                decision = self._decision(recipient, purpose, client_id, False, policy_reason, conn)
                conn.commit()
                return decision

            existing = conn.execute(
                "SELECT status, reserved_at, provider_message_id "
                "FROM delivery_reservations WHERE client_id = ?",
                (client_id,),
            ).fetchone()
            reservation_is_live = (
                existing
                and existing["status"] == "reserved"
                and now - float(existing["reserved_at"]) < self.reservation_ttl_seconds
            )
            if existing and existing["status"] == "sent":
                reason = (
                    "already_sent"
                    if str(existing["provider_message_id"] or "").strip()
                    else "duplicate_client_id"
                )
                decision = self._decision(
                    recipient, purpose, client_id, False, reason, conn
                )
                conn.commit()
                return decision
            if reservation_is_live:
                decision = self._decision(
                    recipient, purpose, client_id, False, "duplicate_client_id", conn
                )
                conn.commit()
                return decision

            last = conn.execute(
                "SELECT MAX(reserved_at) AS last_at FROM delivery_reservations"
            ).fetchone()["last_at"]
            if last is not None and now - float(last) < self.min_interval_seconds:
                decision = self._decision(
                    recipient, purpose, client_id, False, "mailbox_cooldown", conn
                )
                conn.commit()
                return decision

            if existing:
                conn.execute(
                    """UPDATE delivery_reservations
                       SET recipient=?, purpose=?, status='reserved', reason='', reserved_at=?,
                           completed_at=NULL, provider_message_id=''
                       WHERE client_id=?""",
                    (recipient, purpose.value, now, client_id),
                )
            else:
                conn.execute(
                    """INSERT INTO delivery_reservations
                       (client_id, recipient, purpose, status, reserved_at)
                       VALUES (?, ?, ?, 'reserved', ?)""",
                    (client_id, recipient, purpose.value, now),
                )
            decision = self._decision(recipient, purpose, client_id, True, "reserved", conn)
            conn.commit()
            return decision

    def validate(self, client_id: str) -> GateDecision:
        """Recheck policy immediately before provider I/O and revoke stale permission."""
        with self._connect_state() as conn:
            conn.execute("BEGIN IMMEDIATE")
            row = conn.execute(
                "SELECT recipient, purpose, status FROM delivery_reservations WHERE client_id = ?",
                (client_id,),
            ).fetchone()
            if not row or row["status"] != "reserved":
                decision = self._decision(
                    "", DeliveryPurpose.MARKETING, client_id, False, "reservation_not_live", conn
                )
                conn.commit()
                return decision
            purpose = DeliveryPurpose(row["purpose"])
            reason = self._policy_reason(conn, row["recipient"], purpose, client_id)
            if reason:
                conn.execute(
                    """UPDATE delivery_reservations
                       SET status='blocked', reason=?, completed_at=? WHERE client_id=?""",
                    (reason, float(self.clock()), client_id),
                )
                decision = self._decision(row["recipient"], purpose, client_id, False, reason, conn)
                conn.commit()
                return decision
            conn.commit()
            return GateDecision(True, "validated", client_id)

    def sent_receipt(self, client_id: str) -> str | None:
        """Return a durable provider receipt only for a confirmed completed send."""
        with self._connect_state() as conn:
            row = conn.execute(
                "SELECT status, provider_message_id FROM delivery_reservations "
                "WHERE client_id = ?",
                (client_id,),
            ).fetchone()
        if not row or row["status"] != "sent":
            return None
        receipt = str(row["provider_message_id"] or "").strip()
        return receipt or None

    def complete(
        self,
        client_id: str,
        *,
        sent: bool,
        reason: str = "",
        provider_message_id: str = "",
    ) -> None:
        provider_message_id = str(provider_message_id or "").strip()
        if sent and not provider_message_id:
            sent = False
            reason = "provider_unconfirmed"
        status = "sent" if sent else "failed"
        with self._connect_state() as conn:
            conn.execute(
                """UPDATE delivery_reservations
                   SET status=?, reason=?, completed_at=?, provider_message_id=?
                   WHERE client_id=?""",
                (
                    status,
                    reason[:500],
                    float(self.clock()),
                    provider_message_id if sent else "",
                    client_id,
                ),
            )
