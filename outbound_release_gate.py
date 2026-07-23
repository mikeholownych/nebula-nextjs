"""Central, fail-closed authorization boundary for buyer-facing email delivery."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
import json
import os
from pathlib import Path
import sqlite3
import time
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
        DeliveryPurpose.AUDIT_DELIVERY: ("audit:", "platform-audit:"),
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
        self._init_schema()

    def _connect_state(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.state_db, timeout=10, isolation_level=None)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=FULL")
        return conn

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
                    completed_at REAL
                )
                """
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

    def _reply_reason(self, recipient: str, purpose: DeliveryPurpose) -> str | None:
        if not self.replied_path.exists():
            return "reply_store_unavailable"
        try:
            lines = self.replied_path.read_text(errors="replace").splitlines()
        except OSError:
            return "reply_store_unavailable"
        for line in lines:
            if not line.strip():
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                return "reply_store_invalid"
            email = str(row.get("email") or row.get("from") or row.get("sender") or "").strip().lower()
            if email != recipient:
                continue
            classification = str(row.get("classification") or row.get("status") or "replied").lower()
            if classification in self.STOP_CLASSIFICATIONS:
                if classification in {"unsubscribe", "unsubscribed", "do_not_contact", "stop_reply"}:
                    return "lead_unsubscribed"
                return "lead_complained"
            if purpose is DeliveryPurpose.MARKETING:
                return "lead_replied"
        return None

    def _policy_reason(
        self,
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
        return self._reply_reason(recipient, purpose)

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
            policy_reason = self._policy_reason(recipient, purpose, client_id)
            if policy_reason:
                decision = self._decision(recipient, purpose, client_id, False, policy_reason, conn)
                conn.commit()
                return decision

            existing = conn.execute(
                "SELECT status, reserved_at FROM delivery_reservations WHERE client_id = ?",
                (client_id,),
            ).fetchone()
            reservation_is_live = (
                existing
                and existing["status"] == "reserved"
                and now - float(existing["reserved_at"]) < self.reservation_ttl_seconds
            )
            if existing and (existing["status"] == "sent" or reservation_is_live):
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
                       SET recipient=?, purpose=?, status='reserved', reason='', reserved_at=?, completed_at=NULL
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
            reason = self._policy_reason(row["recipient"], purpose, client_id)
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

    def complete(self, client_id: str, *, sent: bool, reason: str = "") -> None:
        status = "sent" if sent else "failed"
        with self._connect_state() as conn:
            conn.execute(
                """UPDATE delivery_reservations
                   SET status=?, reason=?, completed_at=? WHERE client_id=?""",
                (status, reason[:500], float(self.clock()), client_id),
            )
