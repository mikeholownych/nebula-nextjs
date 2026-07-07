# Nebula Lead Pipeline Extension

## MANDATORY: Lead Pipeline Rules

### Lead State Machine
- All lead state stored in `lead_store.py` SQLite
- Stages: `discovered → site_found → contacted → audit_delivered → pitch_sent → paid`
- Terminal states: `paid`, `dead`, `bounced`, `max_retries_exceeded`

### Before Any Operation
1. Check `LeadStore.is_bounced(email)` — bounced leads NEVER receive any email
2. Check `LeadStore.get_lead(email).stage` — do not re-send to same stage
3. Check `dead_letter_queue.jsonl` — do not retry dead letters automatically

### Duplicate Send Prevention
- Set `lead.Status` in-memory struct BEFORE calling `UpdateLeadStatus()`
- Persist full lead state (Sequence, SequenceStep, SentAt) on every state change
- Skip any email where `email.Status == "sent" || !email.SentAt.IsZero()`

### Bounce Handling
- SMTP 535/550/552/553 → immediate bounce mark
- AgentMail 403 → suppressed (do NOT retry — AgentMail blocks permanently)
- Track in `LeadStore.mark_bounced(email, type, detail)`
- Write to `dead_letter_queue.jsonl` after MAX_RETRIES (3)

### File Locking
- All cron pipeline scripts use `flock` with `trap 'rm -f "$LOCK"' EXIT`
- Stale lock >30 min = crash recovery
