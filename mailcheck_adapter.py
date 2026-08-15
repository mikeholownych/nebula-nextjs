"""Fail-closed MailCheck beta adapter for Nebula outbound decisions.

MailCheck supplies observations and classifications. Nebula owns the send decision.
The adapter never treats ``contact_admissible`` as authorization.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import time
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from gateway_fingerprint import enrich_gateway_evidence

BASE = Path("/home/mike/nebula")
DEFAULT_BASE_URL = "https://mailcheck.mikeholownych.com"
DEFAULT_KEY_FILE = "/etc/nebula-mailcheck.key"
DEFAULT_DB = BASE / "mailcheck_beta.db"

BLOCKED_CLASSIFICATIONS = frozenset({"CONFIRMED_INVALID"})
APPROVED_CLASSIFICATIONS = frozenset({"HIGH_CONFIDENCE_VALID", "VALID"})
REVIEW_CLASSIFICATIONS = frozenset({"ACCEPT_ALL", "CATCH_ALL", "RISKY", "UNKNOWN", "PENDING"})


class MailCheckError(RuntimeError):
    """Safe adapter error that never includes a credential or response body."""


@dataclass(frozen=True)
class ReleaseDecision:
    allowed: bool
    decision: str
    reason: str
    verification_id: str
    classification: str
    send_gate_id: str = ""


class MailCheckAdapter:
    def __init__(
        self,
        *,
        base_url: str | None = None,
        key_file: str | Path | None = None,
        db_path: str | Path = DEFAULT_DB,
        monthly_quota: int | None = None,
        timeout_seconds: float = 20.0,
    ) -> None:
        self.base_url = (base_url or os.environ.get("MAILCHECK_API_BASE_URL", DEFAULT_BASE_URL)).rstrip("/")
        self.key_file = Path(key_file or os.environ.get("MAILCHECK_API_KEY_FILE", DEFAULT_KEY_FILE))
        quota = monthly_quota if monthly_quota is not None else int(os.environ.get("MAILCHECK_MONTHLY_QUOTA", "500"))
        if quota < 100 or quota > 500:
            raise ValueError("MAILCHECK_MONTHLY_QUOTA must be between 100 and 500")
        self.monthly_quota = quota
        self.timeout_seconds = timeout_seconds
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _init_db(self) -> None:
        with sqlite3.connect(self.db_path) as db:
            db.execute("PRAGMA journal_mode=WAL")
            db.execute("""
                CREATE TABLE IF NOT EXISTS verifications (
                    verification_id TEXT PRIMARY KEY,
                    email_hash TEXT NOT NULL,
                    lead_id TEXT NOT NULL DEFAULT '',
                    source TEXT NOT NULL DEFAULT '',
                    idempotency_key TEXT NOT NULL UNIQUE,
                    request_id TEXT NOT NULL DEFAULT '',
                    status TEXT NOT NULL,
                    classification TEXT NOT NULL DEFAULT '',
                    reason_codes_json TEXT NOT NULL DEFAULT '[]',
                    limitations_json TEXT NOT NULL DEFAULT '[]',
                    freshness TEXT NOT NULL DEFAULT '',
                    evidence_digest TEXT NOT NULL DEFAULT '',
                    contact_admissible INTEGER,
                    release_decision TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)
            columns = {row[1] for row in db.execute("PRAGMA table_info(verifications)")}
            if "send_gate_id" not in columns:
                db.execute("ALTER TABLE verifications ADD COLUMN send_gate_id TEXT NOT NULL DEFAULT ''")
            db.execute("CREATE INDEX IF NOT EXISTS idx_mc_verifications_created ON verifications(created_at)")
            db.execute("""
                CREATE TABLE IF NOT EXISTS evidence (
                    verification_id TEXT PRIMARY KEY,
                    evidence_json TEXT NOT NULL,
                    fetched_at TEXT NOT NULL
                )
            """)
            db.execute("""
                CREATE TABLE IF NOT EXISTS outcomes (
                    idempotency_key TEXT PRIMARY KEY,
                    verification_id TEXT NOT NULL,
                    payload_json TEXT NOT NULL,
                    provider_request_id TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL
                )
            """)

    def _key(self) -> str:
        try:
            value = self.key_file.read_text().strip()
        except OSError as exc:
            raise MailCheckError("MAILCHECK_KEY_UNAVAILABLE") from None
        if len(value) < 40:
            raise MailCheckError("MAILCHECK_KEY_INVALID")
        return value

    @staticmethod
    def _now() -> str:
        return datetime.now(timezone.utc).isoformat()

    @staticmethod
    def _email_hash(email: str) -> str:
        return hashlib.sha256(email.strip().lower().encode()).hexdigest()

    @staticmethod
    def _idempotency(prefix: str, value: str) -> str:
        digest = hashlib.sha256(value.strip().lower().encode()).hexdigest()
        return f"nebula-beta:{prefix}:{digest}"

    def _request(self, method: str, path: str, *, body: dict[str, Any] | None = None, idempotency_key: str | None = None) -> tuple[dict[str, Any], str]:
        headers = {
            "Authorization": f"Bearer {self._key()}",
            "Accept": "application/json",
            "User-Agent": "Nebula-MailCheck-Adapter/1.0",
        }
        if body is not None:
            headers["Content-Type"] = "application/json"
        if idempotency_key:
            headers["Idempotency-Key"] = idempotency_key
        request = Request(
            f"{self.base_url}{path}",
            data=json.dumps(body).encode() if body is not None else None,
            headers=headers,
            method=method,
        )
        try:
            with urlopen(request, timeout=self.timeout_seconds) as response:
                raw = response.read()
                request_id = response.headers.get("x-request-id", "")
        except HTTPError as exc:
            # Do not retain the provider body or URL with an Authorization header.
            raise MailCheckError(f"MAILCHECK_HTTP_{exc.code}") from None
        except (URLError, TimeoutError):
            raise MailCheckError("MAILCHECK_NETWORK_ERROR") from None
        try:
            payload = json.loads(raw.decode())
        except (UnicodeDecodeError, json.JSONDecodeError):
            raise MailCheckError("MAILCHECK_INVALID_JSON") from None
        if not isinstance(payload, dict):
            raise MailCheckError("MAILCHECK_INVALID_RESPONSE")
        return payload, request_id

    def _quota_check(self) -> None:
        month = datetime.now(timezone.utc).strftime("%Y-%m")
        with sqlite3.connect(self.db_path) as db:
            row = db.execute(
                "SELECT COUNT(*) FROM verifications WHERE created_at LIKE ?",
                (f"{month}%",),
            ).fetchone()
        if int(row[0]) >= self.monthly_quota:
            raise MailCheckError("MAILCHECK_MONTHLY_QUOTA_EXCEEDED")

    def submit(self, email: str, *, lead_id: str = "", source: str = "") -> dict[str, Any]:
        email = email.strip().lower()
        if "@" not in email or len(email) > 320:
            raise ValueError("invalid email")
        key = self._idempotency("verify", email)
        with sqlite3.connect(self.db_path) as db:
            existing = db.execute("SELECT verification_id FROM verifications WHERE idempotency_key = ?", (key,)).fetchone()
        if existing:
            return self.get(existing[0])
        self._quota_check()
        payload, request_id = self._request("POST", "/api/v1/verify", body={"email": email}, idempotency_key=key)
        verification_id = str(payload.get("id") or payload.get("verification_id") or "")
        if not verification_id:
            raise MailCheckError("MAILCHECK_MISSING_VERIFICATION_ID")
        now = self._now()
        self._store_verification(verification_id, email, lead_id, source, key, request_id, payload, now)
        return self.get(verification_id)

    def get(self, verification_id: str) -> dict[str, Any]:
        payload, _ = self._request("GET", f"/api/v1/verifications/{verification_id}")
        self._update_verification(verification_id, payload)
        return payload

    def wait_for_completion(self, verification_id: str, *, timeout_seconds: float = 90.0, poll_seconds: float = 3.0) -> dict[str, Any]:
        deadline = time.monotonic() + timeout_seconds
        latest: dict[str, Any] = {"id": verification_id, "status": "PENDING"}
        while time.monotonic() < deadline:
            latest = self.get(verification_id)
            if str(latest.get("status", "")).upper() in {"COMPLETED", "COMPLETE", "SUCCEEDED", "READY"}:
                return latest
            time.sleep(poll_seconds)
        raise MailCheckError("MAILCHECK_VERIFICATION_TIMEOUT")

    def verify_for_outreach(self, email: str, *, lead_id: str, source: str, timeout_seconds: float = 90.0) -> ReleaseDecision:
        submitted = self.submit(email, lead_id=lead_id, source=source)
        verification_id = str(submitted.get("id") or submitted.get("verification_id") or "")
        result = self.wait_for_completion(verification_id, timeout_seconds=timeout_seconds)
        self.evidence(verification_id)
        decision = self.release_decision(result)
        self._set_decision(verification_id, decision.decision)
        return decision

    def evidence(self, verification_id: str) -> dict[str, Any]:
        payload, _ = self._request("GET", f"/api/v1/verifications/{verification_id}/evidence")
        if not isinstance(payload, dict):
            raise MailCheckError("MAILCHECK_INVALID_EVIDENCE")
        payload = enrich_gateway_evidence(payload)
        with sqlite3.connect(self.db_path) as db:
            db.execute(
                "INSERT INTO evidence(verification_id, evidence_json, fetched_at) VALUES (?, ?, ?) "
                "ON CONFLICT(verification_id) DO UPDATE SET evidence_json=excluded.evidence_json, fetched_at=excluded.fetched_at",
                (verification_id, json.dumps(payload, sort_keys=True), self._now()),
            )
        return payload

    def release_decision(self, verification: dict[str, Any]) -> ReleaseDecision:
        verification_id = str(verification.get("id") or verification.get("verification_id") or "")
        classification = str(verification.get("classification") or "").upper()
        status = str(verification.get("status") or "").upper()
        if not verification_id:
            return ReleaseDecision(False, "BLOCK", "missing_verification_id", "", classification)
        if status not in {"COMPLETED", "COMPLETE", "SUCCEEDED", "READY"}:
            return ReleaseDecision(False, "PENDING_REVIEW", "verification_not_complete", verification_id, classification)
        if classification in BLOCKED_CLASSIFICATIONS:
            return ReleaseDecision(False, "BLOCK", "confirmed_invalid", verification_id, classification)
        if classification in APPROVED_CLASSIFICATIONS:
            return ReleaseDecision(True, "ALLOW_TECHNICAL_REVIEW", "classification_approved_pending_nebula_gate", verification_id, classification)
        if classification in REVIEW_CLASSIFICATIONS or not classification:
            return ReleaseDecision(False, "PENDING_REVIEW", "classification_requires_review", verification_id, classification)
        return ReleaseDecision(False, "PENDING_REVIEW", "unknown_classification", verification_id, classification)

    def record_outcome(
        self,
        verification_id: str,
        *,
        email: str,
        outcome: str,
        smtp_code: int = 0,
        enhanced_status: str = "",
        occurred_at: str | None = None,
        source_system: str = "nebula-outreach",
        provider: str = "agentmail",
    ) -> dict[str, Any]:
        key = self._idempotency("outcome", f"{verification_id}:{email}:{outcome}:{occurred_at or ''}")
        payload = {
            "verification_id": verification_id,
            "email": email.strip().lower(),
            "outcome": outcome,
            "smtp_code": smtp_code,
            "enhanced_status": enhanced_status,
            "occurred_at": occurred_at or self._now(),
            "source_system": source_system,
            "provider": provider,
        }
        with sqlite3.connect(self.db_path) as db:
            row = db.execute("SELECT payload_json FROM outcomes WHERE idempotency_key = ?", (key,)).fetchone()
            if row:
                return json.loads(row[0])
        response, request_id = self._request("POST", "/api/v1/outcomes", body=payload, idempotency_key=key)
        with sqlite3.connect(self.db_path) as db:
            db.execute("INSERT OR IGNORE INTO outcomes VALUES (?, ?, ?, ?, ?)", (key, verification_id, json.dumps(payload, sort_keys=True), request_id, self._now()))
        return response

    def _store_verification(self, verification_id: str, email: str, lead_id: str, source: str, key: str, request_id: str, payload: dict[str, Any], now: str) -> None:
        with sqlite3.connect(self.db_path) as db:
            db.execute("""INSERT INTO verifications(verification_id,email_hash,lead_id,source,idempotency_key,request_id,status,created_at,updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""", (verification_id, self._email_hash(email), lead_id, source, key, request_id, str(payload.get("status") or "PENDING"), now, now))

    def _update_verification(self, verification_id: str, payload: dict[str, Any]) -> None:
        with sqlite3.connect(self.db_path) as db:
            db.execute("""UPDATE verifications SET status=?, classification=?, reason_codes_json=?, limitations_json=?, freshness=?, evidence_digest=?, contact_admissible=?, updated_at=? WHERE verification_id=?""",
                (str(payload.get("status") or ""), str(payload.get("classification") or ""), json.dumps(payload.get("reason_codes") or []), json.dumps(payload.get("limitations") or []), str(payload.get("freshness") or ""), str(payload.get("evidence_digest") or ""), None if payload.get("contact_admissible") is None else int(bool(payload.get("contact_admissible"))), self._now(), verification_id))

    def _set_decision(self, verification_id: str, decision: str) -> None:
        with sqlite3.connect(self.db_path) as db:
            db.execute("UPDATE verifications SET release_decision=?, updated_at=? WHERE verification_id=?", (decision, self._now(), verification_id))


__all__ = ["MailCheckAdapter", "MailCheckError", "ReleaseDecision"]
