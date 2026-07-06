"""
lead_store.py — Central lead state machine backed by SQLite.
Replaces 5+ overlapping JSON/JSONL stores with one authoritative DB.

Usage:
    from lead_store import LeadStore
    db = LeadStore()
    db.upsert_lead(email="x@y.com", url="https://...", stage="audit_delivered")
    leads = db.get_leads_by_stage("pitch_sent")
    stats = db.get_stage_counts()

Stages:
    discovered         — Raw lead from signal source
    site_found         — URL extracted from source
    contacted          — Email found, outreach sent
    audit_delivered    — Self-serve audit delivered
    pitch_sent         — $97 implementation pitch sent
    paid               — Customer (payment received)
    bounced            — Email hard-bounced (invalid/mailbox full/permanent)
    dead               — Permanently stalled (max retries)
"""
import json
import sqlite3
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

BASE = Path("/home/mike/nebula")
DB_PATH = BASE / "lead_state.db"


class LeadStore:
    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or DB_PATH
        self._init_schema()

    def _conn(self):
        """Get a connection. WAL mode for concurrent reads from health check."""
        c = sqlite3.connect(str(self.db_path), timeout=10)
        c.row_factory = sqlite3.Row
        c.execute("PRAGMA journal_mode=WAL")
        c.execute("PRAGMA synchronous=NORMAL")
        return c

    def _init_schema(self):
        with self._conn() as c:
            c.executescript("""
                CREATE TABLE IF NOT EXISTS leads (
                    email        TEXT PRIMARY KEY COLLATE NOCASE,
                    url          TEXT NOT NULL DEFAULT '',
                    stage        TEXT NOT NULL DEFAULT 'discovered',
                    source       TEXT NOT NULL DEFAULT '',
                    trigger_context TEXT NOT NULL DEFAULT '',
                    vertical     TEXT NOT NULL DEFAULT '',
                    audit_score  REAL,
                    audit_grade  TEXT,
                    retry_count  INTEGER NOT NULL DEFAULT 0,
                    error_info   TEXT NOT NULL DEFAULT '',

                    -- Stage transition timestamps (ISO 8601)
                    discovered_at     TEXT NOT NULL DEFAULT (datetime('now')),
                    site_found_at     TEXT,
                    contacted_at      TEXT,
                    audit_delivered_at TEXT,
                    pitch_sent_at     TEXT,
                    paid_at           TEXT,
                    bounced_at        TEXT,
                    dead_at           TEXT,

                    -- Bounce tracking
                    bounce_type       TEXT NOT NULL DEFAULT '',
                    bounce_detail     TEXT NOT NULL DEFAULT '',

                    -- Metadata
                    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                    notes      TEXT NOT NULL DEFAULT ''
                );

                CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
                CREATE INDEX IF NOT EXISTS idx_leads_updated ON leads(updated_at);
            """)

            # Migrate existing databases — add columns that may not exist yet
            for col_def in [
                "bounced_at TEXT",
                "bounce_type TEXT NOT NULL DEFAULT ''",
                "bounce_detail TEXT NOT NULL DEFAULT ''",
            ]:
                col_name = col_def.split()[0]
                try:
                    c.execute(f"ALTER TABLE leads ADD COLUMN {col_def}")
                except sqlite3.OperationalError:
                    pass  # Column already exists

            # Create bounce index after migration (column may not have existed before)
            try:
                c.execute("CREATE INDEX IF NOT EXISTS idx_leads_bounced ON leads(bounce_type) WHERE bounce_type != ''")
            except sqlite3.OperationalError:
                pass  # May fail on older SQLite without partial index support

    def _ts(self) -> str:
        return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    def _set_stage_ts(self, stage: str) -> str:
        """Return the column name for a stage's timestamp."""
        return f"{stage}_at"

    def upsert_lead(
        self,
        email: str,
        url: str = "",
        stage: str = "discovered",
        source: str = "",
        trigger_context: str = "",
        vertical: str = "",
        audit_score: Optional[float] = None,
        audit_grade: str = "",
        retry_count: int = 0,
        error_info: str = "",
        notes: str = "",
    ) -> bool:
        """Insert or update a lead. Returns True if new, False if updated."""
        email = email.strip().lower()
        if not email:
            return False

        now = self._ts()
        col_map = {
            "discovered": "discovered_at",
            "site_found": "site_found_at",
            "contacted": "contacted_at",
            "audit_delivered": "audit_delivered_at",
            "pitch_sent": "pitch_sent_at",
            "paid": "paid_at",
            "bounced": "bounced_at",
            "dead": "dead_at",
        }
        stage_col = col_map.get(stage, "")

        with self._conn() as c:
            existing = c.execute(
                "SELECT email, stage FROM leads WHERE email = ?", (email,)
            ).fetchone()

            if existing:
                old_stage = existing["stage"]
                # Only set stage timestamp if advancing (not regressing)
                set_timestamp = ""
                if stage_col and stage != old_stage:
                    set_timestamp = f", {stage_col} = COALESCE({stage_col}, ?)"
                else:
                    set_timestamp = ""

                sql = f"""
                    UPDATE leads SET
                        url = COALESCE(NULLIF(?, ''), url),
                        stage = ?,
                        source = COALESCE(NULLIF(?, ''), source),
                        trigger_context = COALESCE(NULLIF(?, ''), trigger_context),
                        vertical = COALESCE(NULLIF(?, ''), vertical),
                        audit_score = COALESCE(?, audit_score),
                        audit_grade = COALESCE(NULLIF(?, ''), audit_grade),
                        retry_count = ?,
                        error_info = COALESCE(NULLIF(?, ''), error_info),
                        notes = CASE WHEN ? != '' THEN
                            CASE WHEN notes = '' THEN ? ELSE notes || '\n' || ? END
                        ELSE notes END,
                        updated_at = ?
                        {set_timestamp}
                    WHERE email = ?
                """
                params = [
                    url, stage, source, trigger_context, vertical,
                    audit_score, audit_grade, retry_count, error_info,
                    notes, notes, notes, now,
                ]
                if set_timestamp:
                    params.append(now)
                params.append(email)
                c.execute(sql, params)
                return False
            else:
                cols = ["email", "url", "stage", "source", "trigger_context",
                        "vertical", "audit_score", "audit_grade", "retry_count",
                        "error_info", "updated_at", "notes"]
                vals = [email, url, stage, source, trigger_context,
                        vertical, audit_score, audit_grade, retry_count,
                        error_info, now, notes]
                if stage_col:
                    cols.append(stage_col)
                    vals.append(now)
                placeholders = ",".join("?" for _ in cols)
                c.execute(
                    f"INSERT INTO leads ({','.join(cols)}) VALUES ({placeholders})",
                    vals,
                )
                return True

    def get_lead(self, email: str) -> Optional[dict]:
        email = email.strip().lower()
        with self._conn() as c:
            row = c.execute("SELECT * FROM leads WHERE email = ?", (email,)).fetchone()
            return dict(row) if row else None

    def get_leads_by_stage(self, stage: str) -> list[dict]:
        with self._conn() as c:
            rows = c.execute(
                "SELECT * FROM leads WHERE stage = ? ORDER BY updated_at DESC", (stage,)
            ).fetchall()
            return [dict(r) for r in rows]

    def get_stage_counts(self) -> dict:
        with self._conn() as c:
            rows = c.execute(
                "SELECT stage, COUNT(*) as count FROM leads GROUP BY stage"
            ).fetchall()
            return {r["stage"]: r["count"] for r in rows}

    def advance_stage(self, email: str, new_stage: str, **extra) -> bool:
        """Advance a lead to a new stage, setting the corresponding timestamp."""
        lead = self.get_lead(email)
        if not lead:
            return False
        if not new_stage:
            return False
        return self.upsert_lead(email=email, stage=new_stage, **extra)

    def get_stuck_leads(self, max_hours: int = 4) -> list[dict]:
        """Leads in a stage without advancement for >max_hours (non-human stages only)."""
        now = datetime.now(timezone.utc)
        stuck = []
        with self._conn() as c:
            rows = c.execute("SELECT * FROM leads").fetchall()
        for row in rows:
            lead = dict(row)
            stage = lead["stage"]
            if stage in ("paid", "dead", "bounced"):
                continue
            # Figure out which timestamp represents entry into current stage
            ts_col = f"{stage}_at"
            ts_str = lead.get(ts_col) or lead.get("updated_at", "")
            if not ts_str:
                continue
            try:
                t = datetime.fromisoformat(ts_str.rstrip("Z")).replace(tzinfo=timezone.utc)
                hours = (now - t).total_seconds() / 3600
                if hours > max_hours:
                    stuck.append({**lead, "hours_stuck": round(hours, 1)})
            except:
                pass
        return stuck

    def total_leads(self) -> int:
        with self._conn() as c:
            return c.execute("SELECT COUNT(*) FROM leads").fetchone()[0]

    def migrate_from_jsonl(self) -> dict:
        """Migrate existing lead data from JSON/JSONL stores into SQLite.
        Returns counts of migrated records per source."""
        counts = {"audit_leads": 0, "hot_lead": 0, "contacted": 0, "outreach_evidence": 0}

        # 1. audit_leads.jsonl — stage: audit_delivered
        p = BASE / "audit_leads.jsonl"
        if p.exists():
            for line in p.read_text().splitlines():
                if not line.strip():
                    continue
                try:
                    entry = json.loads(line)
                    email = entry.get("email", "").strip().lower()
                    if email:
                        self.upsert_lead(
                            email=email,
                            url=entry.get("url", ""),
                            stage="audit_delivered",
                            audit_score=entry.get("overall"),
                            audit_grade=entry.get("overall_grade"),
                            source=entry.get("source_type") or "",
                            trigger_context=entry.get("trigger_type") or "",
                            vertical=entry.get("vertical") or "",
                        )
                        counts["audit_leads"] += 1
                except:
                    pass

        # 2. HOT_LEAD.json — stage: pitch_sent or audit_delivered
        p = BASE / "HOT_LEAD.json"
        if p.exists():
            try:
                data = json.loads(p.read_text())
                entries = data if isinstance(data, list) else [data]
                for entry in entries:
                    if not isinstance(entry, dict):
                        continue
                    email = entry.get("email", "").strip().lower()
                    if email:
                        stage = entry.get("stage", "audit_delivered")
                        self.upsert_lead(
                            email=email,
                            url=entry.get("url", ""),
                            stage=stage,
                            audit_score=entry.get("audit_score"),
                            audit_grade=entry.get("audit_grade"),
                            notes=f"Migrated from HOT_LEAD: action={entry.get('action')} status={entry.get('status')}",
                        )
                        counts["hot_lead"] += 1
            except:
                pass

        # 3. contacted.json — stage: contacted
        p = BASE / "contacted.json"
        if p.exists():
            try:
                data = json.loads(p.read_text())
                if isinstance(data, dict):
                    for email, info in data.items():
                        self.upsert_lead(
                            email=email,
                            url=info.get("url", ""),
                            stage="contacted",
                            trigger_context=info.get("trigger_context", ""),
                            source="web",
                        )
                        counts["contacted"] += 1
                elif isinstance(data, list):
                    for entry in data:
                        email = entry.get("email", "").strip().lower()
                        if email:
                            self.upsert_lead(
                                email=email,
                                url=entry.get("url", ""),
                                stage="contacted",
                            )
                            counts["contacted"] += 1
            except:
                pass

        # 4. outreach_evidence.jsonl — supplement existing records
        p = BASE / "outreach_evidence.jsonl"
        if p.exists():
            for line in p.read_text().splitlines():
                if not line.strip():
                    continue
                try:
                    entry = json.loads(line)
                    email = entry.get("contact", "").strip().lower()
                    if email and entry.get("status") == "sent":
                        existing = self.get_lead(email)
                        if existing and existing["stage"] == "discovered":
                            self.advance_stage(email, "audit_delivered")
                            counts["outreach_evidence"] += 1
                except:
                    pass

        return counts

    def mark_bounced(self, email: str, bounce_type: str = "hard", bounce_detail: str = "") -> bool:
        """Mark a lead as bounced. bounce_type: 'hard' (permanent) or 'soft' (temporary).
        Hard bounces advance stage to 'bounced'. Soft bounces increment retry_count."""
        email = email.strip().lower()
        lead = self.get_lead(email)
        if not lead:
            return False
        if bounce_type == "soft":
            # Soft bounce — increment retry, don't mark terminal
            return self.upsert_lead(
                email=email,
                retry_count=lead.get("retry_count", 0) + 1,
                error_info=f"soft_bounce: {bounce_detail[:200]}",
                notes=f"Soft bounce at {self._ts()}: {bounce_detail[:200]}",
            )
        # Hard bounce — terminal stage
        return self.upsert_lead(
            email=email,
            stage="bounced",
            error_info=f"hard_bounce: {bounce_detail[:200]}",
            notes=f"Hard bounce at {self._ts()}: {bounce_detail[:200]}",
        )

    def get_bounced_leads(self) -> list[dict]:
        """Return all leads in bounced stage."""
        return self.get_leads_by_stage("bounced")

    def get_bounce_count(self) -> int:
        """Count of leads in bounced stage."""
        with self._conn() as c:
            row = c.execute(
                "SELECT COUNT(*) FROM leads WHERE stage = ?", ("bounced",)
            ).fetchone()
            return row[0] if row else 0

    def is_bounced(self, email: str) -> bool:
        """Check if a specific email has hard-bounced."""
        lead = self.get_lead(email.strip().lower())
        return lead is not None and lead.get("stage") == "bounced"

    def close(self):
        pass  # Connections are context-managed
