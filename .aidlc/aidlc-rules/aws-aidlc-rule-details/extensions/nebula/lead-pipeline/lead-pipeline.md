# MANDATORY: Lead Pipeline Rules

## Lead State Machine Schema
```sql
CREATE TABLE leads (
    email TEXT PRIMARY KEY COLLATE NOCASE,
    url TEXT NOT NULL DEFAULT '',
    stage TEXT NOT NULL DEFAULT 'discovered',
    source TEXT NOT NULL DEFAULT '',
    trigger_context TEXT NOT NULL DEFAULT '',
    audit_score REAL,
    audit_grade TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    error_info TEXT NOT NULL DEFAULT '',
    discovered_at TEXT NOT NULL DEFAULT (datetime('now')),
    site_found_at TEXT,
    contacted_at TEXT,
    audit_delivered_at TEXT,
    pitch_sent_at TEXT,
    paid_at TEXT,
    dead_at TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    notes TEXT NOT NULL DEFAULT ''
);
```

## Duplicate Prevention (P0)
- Set `lead.Status` in-memory BEFORE `UpdateLeadStatus()` write
- Persist full `Lead` struct (Sequence, SequenceStep, SentAt) on every state change
- Send loop: skip any email where `email.Status == "sent" || !email.SentAt.IsZero()`
- Regression test: `TestProductionCycleDoesNotDuplicateStepAfterRestart`

## Bounce Classification
| SMTP Code | Classification | Action |
|-----------|---------------|--------|
| 403 | Suppressed (AgentMail block) | Immediate dead, no retry |
| 535 | Auth failure | Check credential, log incident |
| 550 | Mailbox not found | Bounce mark, no retry |
| 552 | Mailbox full | Retry up to 3 times |
| 553 | Mailbox name invalid | Immediate bounce mark |
| 5xx other | Transient | Retry up to 3 times |

## Dead Letter Queue Schema
```jsonl
{"timestamp":"...","site":"...","email":"...","reason":"...","retry_count":3,"source":"ramp_pipeline_fill"}
```

## Lock File Pattern
```bash
LOCK=/path/to/.pipeline.lock
exec 9>"$LOCK"
if ! flock -n 9; then exit 1; fi
trap 'rm -f "$LOCK"' EXIT
```
