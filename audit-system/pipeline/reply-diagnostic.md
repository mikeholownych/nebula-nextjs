# Reply Diagnostic — 48-Hour Rule

Source: Rananjay Raj cold-DM carousel (implemented 2026-07-31).  
**No reply is data. It usually points at one sentence.**

When a message fails, don't just relabel the lead. Diagnose which sentence
failed, fix the copy, then re-test. This is the feedback loop that turns
outreach from a volume game into a calibration game.

---

## The 4-Sentence Structure

Every outreach message follows this shape, in this order, no fifth sentence:

| Sentence | Job | Failure mode |
|----------|-----|--------------|
| **S1 Trigger** | Open on the specific thing that changed. Name it, don't narrate noticing it. | Signal is stale or generic |
| **S2 Who** | One honest line about what you do, in plain words a stranger can parse. | "Who is this?" |
| **S3 Why them** | The reason that could only be sent to them. This is the whole message. | Opened, no reply |
| **S4 The ask** | One low-friction invitation, small enough to accept from a phone. | "Not right now" |

**Hard rule: one question mark, and it lives in sentence 4.**

---

## The Diagnostic Table

| What happened | Which sentence failed | What to change |
|---------------|----------------------|----------------|
| Opened, no reply | S3 — the reason was not theirs | Rebuild the "why them" line from real evidence in their domain/site |
| Never opened | S1, or the timing — the signal was stale | Find a fresher trigger (30-day window) or fix the subject line |
| "Not right now" | S4 — the ask was too big | Shrink the ask: offer the audit link instead of the $97 pitch |
| "Who is this?" | S2 — you never said plainly what you do | Rewrite the who-line in plain words, no jargon |
| A defensive reply | You diagnosed — assumption in S3 | Cut the assumption. State only what you observed (the audit finding) |
| "What audit?" | S1 — they don't recognize the context | Anchor the trigger explicitly: "You submitted {url} on {date}" |

---

## Wiring (implemented 2026-07-31)

1. **Pre-send gate:** `pipeline/send_outreach.py` runs an 8-box checklist before
   every send (trigger named, work named, who-line plain, why-them specific,
   exactly one question mark in the ask, no filler, no guess words, reads under
   15s). A failed checklist blocks the send (`exit 2`) unless `--skip-checklist`
   is passed for an emergency manual send.

2. **Reply diagnosis:** `webhook_server.py` → `diagnose_reply()` classifies each
   inbound reply into `s1_trigger_stale` / `s2_who_unclear` /
   `s3_reason_not_theirs` / `s4_ask_too_big` / `s3_diagnosed` and appends to
   `/home/mike/nebula/reply_diagnostics.jsonl`.

3. **Review cadence:** When `reply_diagnostics.jsonl` shows the same diagnosis
   three times in a row, fix that sentence across the templates — don't send
   more volume through a broken message.

---

## The Follow-Up Rule

**Two follow-ups maximum. Day 3, day 10. Then stop.**

- Day 3: assume they're busy, not disinterested. One short value-add (the
  audit link, a relevant finding).
- Day 10: one final note. Give them an easy out ("if this isn't relevant, just
  say so and I'll stop") and actually stop.
- No reply to all three = the message failed, not the lead. Diagnose and fix
  the copy before the next batch.

---

## Checklist (Before You Hit Send)

1. I can name what changed in the last 30 days.
2. I can name the work that change created.
3. Sentence 2 says what we do in plain words.
4. Sentence 3 could not be sent to any other company.
5. Exactly one question mark, and it is in sentence 4.
6. No greeting, no "hope this finds you", no "just".
7. No claim about what is broken inside their company — only what the audit measured.
8. It reads cleanly aloud in under fifteen seconds.

---

*Implement in `send_outreach.py` (gate) and `webhook_server.py` (diagnosis).
Reference: Rananjay Raj carousel — "The writing was never the problem."*
