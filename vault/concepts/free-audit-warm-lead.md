# Free Audit → Warm Lead → Delivery SLA

## Core Principle
When the inbox monitor flags a warm lead, the audit MUST be delivered within 60 minutes. Leaving warm leads in a pending state for 8+ hours kills the conversion — the founder has moved on.

## Automated Delivery Pipeline (Priority 3 Fix)
The `hot_lead_watcher.py` script (run every 5 min via cron) handles this:
1. Checks `HOT_LEAD.json` for `status = "warm"` or `status = "pending_audit"`
2. Extracts `thread_id`, `url`, `sender` from the file
3. Calls `deliver_audit.py {url} {email} --thread-id {thread_id}`
4. Updates `HOT_LEAD.json` → `status: delivered` on success

## Critical Implementation
The inbox monitor must WRITE `HOT_LEAD.json` with the warm lead's URL and thread ID immediately on detection — not just log it. The watcher reads from this file. If the inbox monitor doesn't write the file with a URL, the watcher cannot auto-deliver.

```python
# inbox_monitor.py: write HOT_LEAD.json on warm signal
hot = {
    "status": "warm",  # ← watcher triggers on this
    "sender": msg["from"],
    "thread_id": msg["thread_id"],
    "url": inferred_url,  # must be set for watcher to function
}
Path("/home/mike/nebula/HOT_LEAD.json").write_text(json.dumps(hot, indent=2))
```

## MAILER-DAEMON Filter
`check_inbox.py` must explicitly filter them or they generate false-positive "sale detected" alerts.

```python
SKIP_SENDERS = [
    'nebulashop@agentmail.to',   # our own sent emails
    'MAILER-DAEMON',              # bounce notifications
    'mailer-daemon',
    'postmaster',
    'Delivery Status',            # NDN subject line match
]

def is_human_reply(msg):
    frm = msg.get('From', '')
    subj = msg.get('Subject', '')
    return not any(s.lower() in frm.lower() or s.lower() in subj.lower()
                   for s in SKIP_SENDERS)
```