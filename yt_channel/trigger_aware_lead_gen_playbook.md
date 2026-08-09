# Trigger-Aware Lead Gen Pipeline
## Five Stages: Discovery → Intent Scoring → Outbound → Reply Handling

**Shipping with**: Sep 2 launch, Nebula Components  
**Goal**: Convert free audit funnel → $97 fix pack → $29+ subscription  
**ICP Filter**: Founders actively bleeding money on ads with zero conversions

---

## The Problem

Current funnel:
1. YouTube audit video → free audit link (nebulacomponents.com/audit)
2. User enters email → instant audit report
3. **STUCK**: Free audit generated, but no conversion to $97 fix pack

Why stuck?
- No follow-up (set it and forget it)
- No re-engagement after first audit
- No way to detect "who's serious vs. tire-kicker"
- No proof that visitor is even a founder

Solution: **Trigger-aware outbound** — use intent signals (visitor behavior) to identify serious prospects, then send personalized cold email.

---

## Five Stages (Architecture)

### Stage 1: Prospect Discovery (Hunter.io)
**Input**: Seed domain list (e.g., Stripe, GitLab, Figma — competitors' customers)  
**Output**: Founder + decision-maker emails  
**Storage**: `lead_state.db` (prospects + contacts tables)  
**Rate Limit**: 300 requests/day (fail-closed: skip if limited)

```python
from lead_gen import discover

result = discover.discover_from_domains(
    ['stripe.com', 'github.com', 'figma.com'],
    limit=3  # top 3 contacts per domain
)
# Returns:
# {
#   "discovered": [
#     {"prospect_id": "stripe_founder1", "email": "patrick@stripe.com", ...},
#     ...
#   ],
#   "rate_limited": False,
#   "requests_remaining": 245
# }
```

**Fail-closed gate**: If rate-limited, skip discovery; don't burn credits.

---

### Stage 2: Visitor Identification (RB2B)
**Input**: Tracking pixel deployed on site  
**Output**: Visitor profile (company name → reverse DNS, pages visited, dwell time)  
**Integration**: Webhook at `/webhook/rb2b-event`

When a prospect discovered in Stage 1 visits our site:
```python
RB2B webhook posts:
{
    "company": "Stripe",
    "visitor_ip": "203.0.113.42",
    "pages_visited": ["audit", "fix-pack", "pricing"],
    "total_dwell_s": 245,
    "last_visit": "2026-08-09T14:30:00Z"
}
```

We match the company name to our prospects database → creates visitor_profile.

---

### Stage 3: Intent Scoring (Claude LLM)
**Input**: Visitor profile (company, pages, dwell time, repeat visits)  
**Output**: Intent score 0–100 + reasoning  
**Storage**: Update `prospects.intent_score` in DB

The buying trigger: **"actively bleeding money on ads with zero conversions"**

Signals Claude looks for:
- **Pain validation** (visited audit page — acknowledging the problem)
- **Solution exploration** (visited fix-pack or pricing)
- **High engagement** (dwell > 2m, repeat visits, CTA clicks)
- **Recent activity** (last_visit < 7 days)

```python
from lead_gen import score_intent

profile = {
    "prospect_id": "stripe_founder1",
    "company_name": "Stripe",
    "pages_visited": ["audit", "fix-pack", "pricing"],
    "total_dwell_s": 245,
    "repeat_visits": 3,
    "cta_clicks": 2,
    "last_visit": "2026-08-09T14:30:00Z"
}

result = score_intent.score_intent(profile)
# Returns:
# {
#   "intent_score": 82,
#   "reasoning": "Visited audit 3x, spent 4m total, clicked CTA twice. High intent.",
#   "buying_trigger_signals": ["pain validation", "solution exploration", "high engagement"]
# }
```

**Rubric**:
- 0–20: No intent (single visit, bounced)
- 21–50: Low intent (audit only, no follow-up)
- 51–75: Medium intent (audit + fix-pack, no CTA click)
- 76–90: High intent (visited 2+ times, clicked CTA)
- 91–100: Very high intent (multiple visits, CTA + pricing, < 7d old)

Threshold for outbound: **≥75**

---

### Stage 4: Outbound Delivery (AgentMail)
**Input**: High-intent prospect (score ≥75)  
**Output**: Personalized cold email sent via AgentMail  
**Storage**: `contacts.last_email_sent` + `prospects.status` updated

Fail-closed gates:
1. **Verification**: Prospect must exist in DB (registered in Stage 1)
2. **Cooldown**: 300s between sends to same prospect (no spam)
3. **Idempotent state**: If crash mid-send, recovery is safe (no duplicates)

```python
from lead_gen import outbound

result = outbound.send_cold_email(
    prospect_id="stripe_founder1",
    email="patrick@stripe.com",
    subject="Patrick, Stripe is leaving money on the table",
    body="""
    Hi Patrick,
    
    I noticed Stripe's landing page isn't optimized for conversions. You're likely
    spending money on ads but not capturing leads effectively.
    
    I put together a free audit that shows exactly where the money leaks:
    [link to nebulacomponents.com/audit]
    
    No call, no credit card. Just the truth.
    
    —
    Nebula Components
    """
)
# Returns:
# {
#   "success": True,
#   "message_id": "msg_xyz123",
#   "status": "sent",
#   "email": "patrick@stripe.com"
# }
```

**Email structure**:
- Subject: "{Name}, {Company} is leaving money on the table"
- Body: Acknowledge the pain → mention our solution → CTA (link to audit)
- Tone: Direct, empathetic (Brenda Turner fifth-wall principle)

---

### Stage 5: Reply Handling (n8n Webhook + Manual Review)
**Input**: Prospect replies to email  
**Webhook**: `/webhook/outbound-reply` (no uuid in path)

n8n workflow:
1. Email reply received → forward to webhook
2. Classify: interested / not interested / spam
3. Update `lead_state.db` status
4. Notify SDR (Sedrick Murphy) for manual follow-up

Example webhook payload:
```json
{
    "prospect_id": "stripe_founder1",
    "email": "patrick@stripe.com",
    "reply_text": "Yeah, we've been thinking about this. Can you send more details?",
    "reply_timestamp": "2026-08-10T09:15:00Z"
}
```

Classification rules:
- "can you send" / "more details" / "interested" → **interested**
- "not relevant" / "unsubscribe" / "stop" → **not interested**
- Gibberish / non-English → **spam**

---

## Phased Rollout (Sep 2 — Sep 30)

### Week 1 (Sep 2–9): Discovery + Intent Scoring (No Sends)
- Deploy discovery.py (query Hunter for 50–100 seed prospects)
- Deploy RB2B pixel on site (start tracking visitors)
- Intent scoring live (background job, no sends yet)
- Goal: Build prospect database + intent baseline

**Manual work**: None (full automation)  
**Decision point**: Review top 10 high-intent prospects manually

### Week 2 (Sep 9–16): Manual Sends + Reply Classification
- Pick top 5 high-intent prospects (score ≥85)
- **Manually** send personalized emails (so we can QA)
- Reply handler live (classify replies, update DB)
- Goal: Validate email messaging before scaling

**Manual work**: Write + send 5 emails, QA replies  
**Decision point**: Did any replies come back? How many said "interested"?

### Week 3–4 (Sep 16–30): Automated Sends + Monitoring
- Unlock automated outbound (≥75 intent, enforce 300s cooldown)
- Monitor: bounce rate, open rate, reply rate, conversion rate
- Iterate email copy based on reply feedback
- Goal: Scale outbound, prove intent → conversion relationship

**Manual work**: Respond to incoming leads, iterate copy  
**Decision point**: What's our reply rate? Can we improve subject line?

### Week 5+ (Oct 1+): Scale + Optimization
- Expand seed domain list (partner database, industry verticals)
- A/B test email subject lines (track open rate delta)
- Implement lookalike scoring (if profile X → high intent, find similar X)
- Multi-touch sequences (if no reply after 5 days, send follow-up #2)

---

## Database Schema (lead_state.db)

### Prospects Table
```sql
CREATE TABLE prospects (
    prospect_id TEXT PRIMARY KEY,
    domain TEXT,                    -- stripe.com
    company_name TEXT,              -- Stripe Inc.
    company_size TEXT,              -- 500+
    intent_score INTEGER,           -- 0-100, set by Claude
    status TEXT,                    -- 'discovered' | 'outbound_sent' | 'interested' | 'closed'
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Contacts Table
```sql
CREATE TABLE contacts (
    contact_id TEXT PRIMARY KEY,
    prospect_id TEXT FK,
    email TEXT UNIQUE,              -- patrick@stripe.com
    first_name TEXT,                -- Patrick
    last_name TEXT,                 -- Collison
    job_title TEXT,                 -- Co-Founder & CEO
    confidence REAL,                -- 0.0-1.0 (Hunter.io confidence)
    last_email_sent TIMESTAMP,      -- 2026-08-10 14:30:00
    reply_status TEXT,              -- 'awaiting_reply' | 'interested' | 'not_interested'
    created_at TIMESTAMP
);
```

### Visitor Events Table
```sql
CREATE TABLE visitor_events (
    event_id INTEGER PRIMARY KEY,
    prospect_id TEXT FK,
    company_name TEXT,              -- Stripe Inc. (from RB2B reverse DNS)
    page_visited TEXT,              -- 'audit' | 'fix-pack' | 'pricing'
    dwell_s INTEGER,                -- seconds on page
    visited_at TIMESTAMP,
    ip_address TEXT
);
```

---

## Fail-Closed Guarantees

### Rate Limiting
- Hunter.io: 300 req/day enforced locally (in-memory bucket)
- If rate-limited, discovery is skipped (don't burn credits)
- State persisted to JSON backup (survives crashes)

### Cooldown Enforcement
- 300s between sends to same prospect
- Checked before every send (`check_cooldown()`)
- Prevents accidental spam

### Idempotent State
- DB updates only on successful send (no partial state)
- If crash mid-send, next run skips (already in DB)
- No duplicate emails

### Verification Gates
- Prospect must be in DB before send (no "orphan" emails)
- Contact must be registered (no invalid email addresses)
- Fail-closed: if verification fails, send is skipped

---

## Metrics & Monitoring

### Track (daily dashboard)
- **Sends**: Total emails sent (should ramp up Sep 2 → Sep 30)
- **Bounces**: % of sends that failed delivery (target: < 5%)
- **Opens**: % of delivered emails that were opened (target: > 20%)
- **Clicks**: % of opens that clicked the CTA link (target: > 10% of opens)
- **Replies**: % of sends that got a reply (target: > 2%)
- **Intent → Conversion**: % of interested replies that became $97 customers (target: > 10%)

### Alert triggers
- Bounce rate > 10%: pause sends, review prospect discovery
- Reply rate < 1%: iterate email copy (subject? body? timing?)
- No conversions by Sep 30: reassess ICP or offer positioning

---

## Brenda Turner Principle Alignment

Brenda Turner's Pillar 4: **"Let go of outcome attachment"**

Our emails don't pitch; they help:
- "I noticed Stripe's landing page isn't optimized"
- Subject isn't "BUY NOW" — it's "you're leaving money on the table"
- CTA is "get a free audit" not "pay $97"

Prospect feels: genuine care, not desperation.  
Result: Higher open rate, higher reply rate, higher conversion.

---

## Implementation Files

- `lead_gen/discover.py` — Hunter.io integration
- `lead_gen/score_intent.py` — Claude intent scoring
- `lead_gen/outbound.py` — AgentMail integration
- `lead_gen/__init__.py` — Module entry point
- `lead_gen/lead_state.db` — SQLite prospect database (auto-created)

---

**Next**: Deploy Week 1 (Sep 2) with discovery + intent scoring live. Manual sends Week 2, automated Week 3.
