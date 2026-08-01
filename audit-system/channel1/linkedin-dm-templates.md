# Channel 1 — Copy-Ready Scripts (LinkedIn DM + Email)

**Structure rule (Rananjay framework — implemented in send_outreach.py):**
S1 Trigger → S2 Who → S3 Why them → S4 Ask. Four sentences, one question mark,
and it lives in S4. Fill the [brackets]. No greeting, no "just", no "probably".

**Sequence rule:** Touch 1 → (no reply) Touch 2 at day 3 → (no reply) Touch 3 at
day 10 → stop. Reply to anything = stop the sequence, follow the warm-reply
playbook. Never send more than 3 touches per cycle.

---

## A. Touch 1 — Comment-first DM (within 24h of their comment/post)

Use when they commented on your post, a creator's CRO post, or posted about ads/landing pages.

```
S1: [Name], saw your comment on [creator]'s post about [topic] — [one specific detail from their comment].
S2: I run Nebula — we audit landing pages that burn ad budgets.
S3: Your [page/site] is live with paid traffic pointed at it; the fold gets about 5 seconds to justify the click.
S4: Want a free, no-call audit of that page? You keep the findings either way.
```

**Variant — pre-audited (strongest, use when score ≥8):** run the audit first,
then lead with the measured finding as the artifact:

```
S1: [Name], ran your [domain] through our audit — your highest-impact leak is [finding] ([X]/5 impact).
S2: I run Nebula — we audit landing pages that burn ad budgets.
S3: That single issue is [what it costs them, grounded in their stated ad spend if they shared one].
S4: The full breakdown is 3 more issues like this — want the checklist? Free, no call.
```

## B. Touch 1 — Direct DM (no prior engagement, but must still be trigger-based)

Only for prospects with a visible buying trigger (active spend pain + live page).
If you cannot name the trigger, you have not done the research — do not send.

```
S1: [Name], saw you're running [ads/traffic] to [landing page].
S2: I run Nebula — we audit landing pages that burn ad budgets.
S3: The page's first fold has to do all the heavy lifting before anyone scrolls.
S4: Want a free, no-call audit on that page? Findings as a checklist, no sales call.
```

## C. Touch 2 — Day 3 follow-up (value + curiosity, no new pitch)

```
[Name], sent you the audit offer the other day — most founders find 2+ leaks they didn't
know existed. Happy to run yours and send what it finds. No pitch, just the checklist.
```

## D. Touch 3 — Day 10 final follow-up (soft close + easy out)

```
Last message on this, [Name]. The audit checks headline, CTA, trust, speed, mobile —
75% of pages fail on headline alone. Yours might be fine: [link to audit]. Up to you.
```

Then stop. No reply to all three = the message failed, not the lead. Diagnose
via reply_diagnostics.jsonl and fix the copy before the next batch.

## E. Warm-reply playbook (they said yes / asked a question)

Response SLA: within 60 minutes.

```
Great — what's the URL you want audited? I'll run it now and send the checklist.

(If they ask about price/fixing:)
The $97 Fix Pack is targeted prompts written for the specific leaks your audit finds —
you implement, and a 30-day re-audit is included. Link: https://buy.stripe.com/5kQbJ1eawdj6eql1Jg43S0h
```

Rules: ask for the URL before anything else. No Calendly link. If they want a
call, ask timezone + best time in plain text. Never pitch the Fix Pack before
delivering audit value.

## F. Email variant (automatable — do NOT hand-write)

Use `pipeline/send_outreach.py <email> --dry-run` to preview, then send without
the flag. It already enforces:
- The 4-sentence structure (generated from real audit findings)
- The 8-box pre-send checklist (blocks filler, guess-words, wrong question placement)
- Bounce check + lifecycle gate (commercially_qualified only)

For prospects NOT yet audited, the email is:

```
Subject: Found the conversion issue on [domain]
Ran an audit on [url].
We're Nebula — we audit landing pages that burn ad budgets.
Your highest-impact issue (X/5): [finding]. [issue]
The exact implementation brief — step-by-step fix, verification test, 30-day re-audit — is $97: [stripe link]
Want it?
```

That is exactly what `send_outreach.py` builds. Do not type it by hand.
