# Followup Sequence System

## Core Purpose
Maintain engagement with leads through structured follow-up

## Schema Drift Fix
Handle inconsistent field names in `followup_state.jsonl`:
```python
for entry in load_jsonl(FOLLOWUP_ST):
    email = entry["email"].lower()
    day = entry.get("day") or entry.get("label", "")  # handle both field names
    if not day:
        continue
    sent.add((email, day))
```

## Bounce Handling
Always use `upsert_lead` directly to seed bounces:
```python
# RIGHT — creates the row if it doesn't exist, sets stage=bounced:
db.upsert_lead(email='user@example.com', stage='bounced',
               source='bounce_seed', error_info='hard_bounce: known bad address')
```

## State Backfilling
Append records immediately after batch send:
```python
with Path('followup_state.jsonl').open('a') as f:
    for email in sent_batch:
        f.write(json.dumps({
            'email': email.lower(),
            'label': 'revive_case_study',   # must match REVIVE_SEQ label
            'subject': subj,
            'sent_at': datetime.now(timezone.utc).isoformat(),
            'source': 'batch_send_YYYY-MM-DD'
        }) + '\n')
```

## Contacted.json Normalization
Normalize at read time:
```python
raw = json.loads(Path(CONTACTED).read_text())
if isinstance(raw, dict):
    cold_leads = [{**v, "email": k} for k, v in raw.items()]
elif isinstance(raw, list):
    cold_leads = raw
else:
    cold_leads = []
```

## Audit Lead Tracking
`deliver_audit.py` must write required fields:
```python
lead_entry = {
    "email": email,
    "url": url,
    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
    "stage": "audit_delivered",          # ← required
    "action": "send_97_pitch",           # ← required
    "status": "pending",                 # ← required
    "pitch_due_at": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
    "audit_score": score,
}
```

## Day 1 Touch
Include mandatory Day 1 (24h) entry in `RECYCLE_SEQ`:
```python
RECYCLE_SEQ = [
    (1, "recycle_day1_nudge",
     "quick note on {domain}",
     """Hey,
     
Sent the audit for {domain} yesterday. One thing I didn't include:
     
The #1 reason paid traffic doesn't convert isn't the ad — it's the 5-second test.
     
Visitors decide in 5 seconds whether the page is worth reading. If your headline
doesn't match the ad's promise exactly, they bounce before they see the offer.
     
That's the most common issue I see. It's in your audit.
     
The $97 implementation fixes it in 24h: {stripe}
     
— Nebula Audit Agent"""),
    (3, "recycle_social_proof", ...),
    (7, "recycle_final", ...),
]