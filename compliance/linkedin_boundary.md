---
created: 2026-07-17
status: operational_boundary
applies_to: linkedin-post-monitor, dm_queue, engager_crawler
---

# LinkedIn Compliance Boundary for Nebula Pipeline

## Legal Framework

**LinkedIn User Agreement §8.2** prohibits:
- Scraping or copying content without permission
- Automated tools that access LinkedIn without explicit authorization
- Creating inauthentic engagement

**LinkedIn Marketing API Terms** require:
- Explicit permission for each use case
- Limited storage and reuse of member data
- Purpose-specific data handling

**GDPR/CCPA** require:
- Consent before storing personal data
- Right to deletion
- Purpose limitation

---

## Nebula Compliance Posture

### ✅ Allowed (Automated)

| Action | Method | Storage | Consent Basis |
|--------|--------|---------|---------------|
| Log public post engagement | Manual observation, approved API | Interest event (no PII beyond public name) | Public observable action |
| Record comment text | Manual or Community Management API | `interest_event` JSON | Public content |
| Classify comment intent | LLM classification | Classification label | Internal processing |
| Draft reply suggestions | Template generation | Draft only, not sent | Not PII operation |
| Generate DM template | Template creation | Stored in queue for review | Not an outreach operation |
| Track post-level metrics | Public metrics API | Aggregated counts | Public statistics |

### ⚠️ Human-Approval Required

| Action | Method | Storage | Why Restricted |
|--------|--------|---------|----------------|
| Post comment reply | Manual approval → Manual send or approved API send | Reply text + timestamp | Public representation of Nebula |
| Send connection request | Manual from personal profile | Connection state | LinkedIn prohibits automation |
| Send personal DM | Manual from personal profile | DM text + timestamp | LinkedIn prohibits automation without explicit API permission |
| Enrich profile with email | Requires outbound consent step | Email only after opt-in | PII collection requires consent |

### ❌ Never Allowed

| Action | Why Prohibited |
|--------|----------------|
| Browser automation (Selenium, Puppeteer) | Violates User Agreement §8.2 |
| Session cookie reuse | Impersonates logged-in user |
| Automatic connection requests | Prohibited activity per §8.2 |
| Bulk DM campaigns from personal profile | Requires explicit API permission |
| Email discovery from scraped profiles | PII without consent |
| Storage of member data beyond event record | Violates purpose limitation |
| Selling or sharing scraped data | Commercial use without consent |

---

## Integration Flow (Compliant)

```text
┌─────────────────────────────────────────────────────────────┐
│  1. OBSERVE (Automated)                                     │
│  • Public post URL detected                                 │
│  • Manual observation or approved Apify actor (no-cookie)   │
│  • Record: {post_id, commenter_name, commenter_url, text}   │
└─────────────────────┬───────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  2. CLASSIFY (Automated)                                    │
│  • LLM classifies: resource_request, problem_disclosure,    │
│    general_comment, vendor_pitch, spam                      │
│  • No PII stored; only classification                       │
└─────────────────────┬───────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  3. DRAFT (Automated)                                       │
│  • Template selection based on classification               │
│  • Draft stored in `draft_replies.jsonl`                    │
│  • NOT sent automatically                                   │
└─────────────────────┬───────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  4. HUMAN REVIEW (Manual Gate)                              │
│  • Operator reviews draft in dashboard                      │
│  • Operator edits/approves                                  │
│  • Operator manually sends from personal profile            │
│     OR                                                      │
│     Operator approves via official LinkedIn Page API        │
└─────────────────────┬───────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  5. RECORD (Automated)                                      │
│  • Record reply_sent event                                  │
│  • Method: approved_api or manual_send                      │
│  • Timestamp + attribution                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## DM Queue Protocol

**DM queue (`growth_system/dm_queue.jsonl`) is a REVIEW QUEUE, not an outbound channel.**

### DM Queue Entry Schema

```json
{
  "queue_id": "DM-20260717-001",
  "person": {
    "name": "Jane Founder",
    "profile_url": "https://linkedin.com/in/janefounder"
  },
  "trigger_context": {
    "classification": "problem_disclosure",
    "comment_snippet": "Our ads are getting clicks but zero conversions..."
  },
  "dm_template": "Hi Jane, saw your comment about zero conversions. I've been auditing landing pages that bleed ad spend — the pattern is usually X. If helpful: [free audit link].",
  "created_at": "2026-07-17T14:00:00Z",
  "status": "pending_review",
  "approved_by": null,
  "sent_at": null,
  "send_method": null
}
```

### DM Send Process

1. **Manual review required.** Operator reads entire queue entry.
2. **Operator edits DM** if needed (personalization, tone check).
3. **Operator sends manually** from Mike's personal LinkedIn.
4. **Operator marks sent:**
   ```json
   {
     "status": "sent",
     "approved_by": "mike",
     "sent_at": "2026-07-17T15:30:00Z",
     "send_method": "manual_personal_profile"
   }
   ```
5. **If operator rejects:**
   ```json
   {
     "status": "rejected",
     "rejected_reason": "vendor_camouflage_detected",
     "approved_by": "mike"
   }
   ```

### Never Auto-Send DM

Even if approved API exists, DM from personal profile **always** requires manual send. Only automated DM possible via official LinkedIn Messaging API with explicit permission — not currently implemented.

---

## Apify Actor Compliance Posture

| Actor | Use Case | Compliance | Notes |
|-------|----------|------------|-------|
| `scraping_solutions/linkedin-posts-engagers-likers-and-commenters-no-cookies` | Get engagers from public post | ✅ Allowed | No cookies, public data |
| `harvestapi/linkedin-profile-scraper` | Enrich known profile URL | ⚠️ Human review | Use only after interest captured |
| `harvestapi/linkedin-profile-search` | Search by keywords | ⚠️ Human review | Post-classification enrichment |
| `apimaestro/linkedin-posts-search-scraper-no-cookies` | Search posts by keyword | ❌ BROKEN | Returns trending feed, not search results |
| Any `*-dm-sender` actor | Auto-send DMs | ❌ Never use | Prohibited automation |

**Rule:** Only use `no-cookies` actors. Never use session-based or DM-sending actors.

---

## Consent Flow

### Comment → Lead Conversion (Correct Path)

```text
Comment observed
    │
    ▼
Classify: resource_request
    │
    ▼
Reply with value-first CTA:
  "I've put the checklist here: [audit link]. Opens without email."
    │
    ▼
User clicks → Submits email on owned site
    │
    ▼
NOW lead record created with:
  - Email
  - Source: linkedin_comment → audit_conversion
  - Consent: transactional_email = allowed
  - Provenance: original comment URL
```

### Wrong Path (Prohibited)

```text
Comment observed
    │
    ▼
Scrape profile for email
    │
    ▼
Add to CRM without consent  ← ❌ VIOLATION
    │
    ▼
Send outbound email         ← ❌ VIOLATION
```

---

## Data Minimization

**Store only:**
- Public profile URL
- Display name (as shown publicly)
- Comment text (public)
- Classification label
- Interest event metadata

**Do NOT store unless explicitly provided:**
- Email
- Phone number
- Private message content
- Connection degree
- Non-public profile sections

---

## Enforcement Checkpoints

### Before storing any LinkedIn-derived data:

```python
def validate_linkedin_event(event: dict) -> tuple[bool, str]:
    """Check compliance before persisting event."""
    
    # 1. No automated DM queue sending
    if event.get("type") == "dm_queued":
        if event.get("auto_send", False):
            return False, "DM auto-send prohibited"
    
    # 2. No email enrichment without consent
    if event.get("type") == "lead_created":
        if event.get("email") and not event.get("consent_source"):
            return False, "Email requires consent_source"
    
    # 3. No browser automation traces
    if event.get("acquisition_method") == "browser_automation":
        return False, "Browser automation violates User Agreement"
    
    # 4. DM queue requires review status
    if event.get("type") == "dm_queued":
        if event.get("status") not in ["pending_review", "approved", "rejected", "sent"]:
            return False, "Invalid DM status"
    
    return True, "passed"
```

---

## Operator Responsibilities

**Mike (or designated operator) must:**

1. Review all DM queue entries before sending
2. Send DMs manually from personal profile
3. Log send method (`manual_personal_profile`) after each
4. Reject vendor pitches, spam, or off-target comments
5. Delete PII if subject requests removal

**System (Nebula) may:**

1. Observe public engagements
2. Classify intent
3. Draft replies and DMs
4. Queue drafts for review
5. Record send events after manual approval

---

## Audit Trail

Every LinkedIn interaction must have:

```json
{
  "event_id": "EVT-...",
  "platform": "linkedin",
  "object_type": "comment",
  "object_url": "https://...",
  "acquisition_method": "manual_observation" | "approved_api_no_cookies",
  "permitted_use": "engagement_follow_up",
  "consent_basis": "public_observable_action",
  "crm_eligible": false,
  "created_at": "ISO-8601",
  "expires_at": "12 months from creation"
}
```

---

## Periodic Compliance Review

**Weekly check:**

1. Inspect `dm_queue.jsonl` for any `auto_send: true` entries
2. Verify no `browser_automation` acquisition methods
3. Confirm all lead records with email have `consent_source`
4. Check for any mass DM sends (should be 0)
5. Review rejection reasons for patterns

**Monthly check:**

1. Data retention: purge events older than 12 months
2. Consent audit: verify all stored emails have consent_source
3. Actor usage: confirm only `no-cookies` actors used
4. Export log: no data sold or shared outside pipeline

---

## Penalty Awareness

LinkedIn may:
- Limit account reach for automated behavior
- Suspend accounts for User Agreement violations
- Ban IP addresses for scraping

GDPR may:
- Fine up to €20M or 4% of global revenue for consent violations
- Require immediate deletion of non-compliant data

**Zero tolerance for:**
- Browser automation targeting LinkedIn
- Bulk DM from personal profile
- Email enrichment without consent
- Selling LinkedIn data

---

## Summary

**Automated:** Observe, classify, draft, queue  
**Manual gate:** Reply send, DM send, email collection  
**Never:** Browser automation, auto-DM, enrichment without consent

**Golden rule:** LinkedIn is an interest detection surface, not a lead database. Move interested people to owned properties before collecting PII.
