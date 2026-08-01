# Angle Extraction Protocol

One audit produces structured findings. Each finding contains:
- A specific broken thing (measured)
- Why it matters (impact)
- What to do about it (fix)

That's 3–5 angles per finding × 4 platforms = 20–40 pieces of content per audit, automatically.

---

## The Extraction Prompt

Use this prompt (or the automated n8n workflow) to extract angles from any completed audit:

```
You are a content strategist for Nebula Components.
ICP: Founders burning $1k–$5k/mo on paid ads with <1% conversion.
Voice: Diagnostic, direct, physician tone. Numbers over adjectives.
Banned: leverage, unlock, synergy, delve, seamlessly, transformative.

FINDINGS:
[Paste findings from findings.json]

For each finding, extract educational content angles.
Output format (one per line):
ANGLE_01|finding_key|Platform|Hook line

Rules:
- Each angle self-contained — no Nebula knowledge required
- LinkedIn: 150-200 word post expandable from hook
- TikTok: visual, demonstrable on screen recording
- X: under 240 chars, no hashtags, no question ending
- Reddit: organic advice, never mention brand or selling
- Minimum 20 angles, maximum 40
```

---

## Quality Filter

Before a script enters the publish queue, it should pass all three:

| Check | Pass | Fail |
|-------|------|------|
| **Specificity** | Contains a number, metric, or named thing | Vague ("your landing page might have issues") |
| **Self-contained** | Makes sense with zero context | Requires knowing what Nebula is |
| **Voice** | Physician tone, short sentences | Adjective-heavy, passive, or inspirational |

---

## The n8n Workflow

Webhook: `POST /webhook/content-extract`

Payload:
```json
{
  "audit_id": "uuid",
  "url": "https://example.com",
  "findings": [ ...findings array from findings.json... ]
}
```

Output: Writes to `content_ops.content_queue` table.
Review: `SELECT id, platform, LEFT(angle_title, 60), status FROM content_queue ORDER BY id DESC;`
Approve: `UPDATE content_queue SET status = 'approved' WHERE id = N;`

---

## Manual Angle Mining (no automation needed)

For each finding in your audit, answer these 4 questions:

1. **What would a founder think is the cause, that isn't?** → Contrarian angle
2. **What's the fastest way to check if they have this problem?** → How-to angle
3. **What's the most expensive version of this problem?** → Results story angle
4. **What do most people do instead that makes it worse?** → Mistake/Lesson angle

Four angles per finding × 5 findings = 20 posts. One audit = 3 weeks of content.
