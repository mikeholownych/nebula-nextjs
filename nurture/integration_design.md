---
created: 2026-07-17
status: design_spec
depends_on: nurture_engine.py, lead_manager.py, content_taxonomy.json
---

# Nurture Track → Segment Integration Design

## Overview

Integrate problem-specific nurture tracks into existing segment-based cadence engine.

## Current System (`nurture_engine.py`)

- **Segments**: `hot`, `warm`, `cold`, `terminal`
- **Cadence**: segment-based send frequency
  - Hot: 20/cycle, direct pitch
  - Warm: 10/day, case studies + social proof
  - Cold: 10/day, educational
- **Templates**: segment-specific (hot_pitch_1, warm_case_study_1, cold_intro_1)
- **Dedup**: by (email, subject)
- **Rate-limit**: AgentMail 5-min window

## Proposed Extension

Add **problem-aware track selection** on top of segment cadence.

### Track Assignment Logic

```python
def assign_nurture_track(lead_email: str, audit_id: str) -> str:
    """
    1. Fetch audit findings from audit_leads.jsonl
    2. Identify primary problem (highest severity)
    3. Return track_id from content_taxonomy.nurture_tracks
    """
    audit = get_audit_by_id(audit_id)
    if not audit:
        return "default"  # fallback
    
    findings = audit.get("findings", [])
    if not findings:
        return "default"
    
    # Map finding categories to tracks
    track_map = {
        "headline": "headline-clarity",
        "message_match": "message-match",
        "cta": "cta-friction",
        "social_proof": "social-proof"
    }
    
    # Find highest severity finding
    primary = max(findings, key=lambda f: f.get("severity_score", 0))
    category = primary.get("category", "")
    
    return track_map.get(category, "default")
```

### Segment + Track Matrix

**Track determines WHAT, segment determines WHEN and HOW.**

| Track / Segment | Cold (1/wk) | Warm (3/wk) | Hot (immediate) |
|-----------------|-------------|-------------|-----------------|
| headline-clarity | Diagnosis intro | Teardown + worksheet | $97 pitch with headline example |
| message-match | Mismatch symptom | Comparison worksheet | Review invitation |
| cta-friction | Ambiguity symptom | Specificity checklist | Fix Pack pitch with CTA fix |
| social-proof | Credibility gap | Evidence hierarchy | Social proof teardown + pitch |
| default | General audit intro | Case study | Direct pitch |

### Template Structure

```
templates/
├── cold/
│   ├── headline_diagnosis_1.md
│   ├── message_match_intro_1.md
│   ├── cta_ambiguity_1.md
│   ├── proof_gap_intro_1.md
│   └── default_intro_1.md
├── warm/
│   ├── headline_teardown_1.md
│   ├── headline_worksheet_1.md
│   ├── message_comparison_1.md
│   ├── cta_checklist_1.md
│   ├── proof_hierarchy_1.md
│   └── case_study_1.md
├── hot/
│   ├── headline_pitch_1.md
│   ├── message_review_1.md
│   ├── cta_pitch_1.md
│   ├── proof_pitch_1.md
│   └── direct_pitch_1.md
```

### Sequence Timing by Track

Each track has a day-based sequence (from `content_taxonomy.json` → nurture_tracks):

```python
NURTURE_TRACKS = {
    "headline-clarity": [
        {"day": 0, "template": "audit_finding", "segment": "any"},
        {"day": 2, "template": "headline_diagnosis", "segment": "cold"},
        {"day": 5, "template": "headline_rewrite", "segment": "warm"},
        {"day": 9, "template": "headline_teardown", "segment": "warm"},
        {"day": 14, "template": "rescan_invite", "segment": "any"},
        {"day": 18, "template": "review_invite", "segment": "hot"},
    ],
    # ... other tracks
}
```

### Cadence Integration

**Segment controls send frequency, track controls content selection.**

```python
class NurtureEngine:
    def get_next_template(self, lead_email: str) -> Optional[str]:
        """
        1. Get segment
        2. Get track (from audit findings)
        3. Get current track position (day offset)
        4. Select template for day + segment
        """
        segment = self.lead_store.get_segment(lead_email)
        track_id = self.get_track_assignment(lead_email)
        
        track = NURTURE_TRACKS[track_id]
        position = self.get_track_position(lead_email)  # days since first finding
        
        # Find template at current position for segment
        for step in track:
            if step["day"] <= position:
                if step["segment"] == "any" or step["segment"] == segment:
                    return self.render_template(step["template"], lead_email)
        
        return None
```

### Track Position Tracking

New field in nurture log:

```json
{
  "email": "founder@company.com",
  "track_id": "headline-clarity",
  "track_started_at": "2026-07-17T10:00:00Z",
  "track_position_days": 5,
  "last_template": "headline_diagnosis_1",
  "next_eligible": "2026-07-22T10:00:00Z"
}
```

### Hot Lead Override

**Hot segment bypasses track cadence.**

```python
def get_next_template(self, lead_email: str) -> Optional[str]:
    segment = self.lead_store.get_segment(lead_email)
    
    # Hot leads: ignore track timing, pitch immediately
    if segment == "hot":
        track_id = self.get_track_assignment(lead_email)
        if track_id == "headline-clarity":
            return self.render_template("hot/headline_pitch_1.md", lead_email)
        # ... other track-specific hot templates
        return self.render_template("hot/direct_pitch_1.md", lead_email)
    
    # Warm/Cold: respect track timing
    # ... proceed with day-based logic
```

### Compliance

- CAN-SPAM footer: unchanged
- Opt-out check: unchanged (`LeadStore.is_opted_out()`)
- Bounce check: unchanged (`LeadStore.is_bounced()`)
- Track reassignment: if new audit completed, reset track_position_days to 0

### File Changes Required

**1. `lead_manager.py` — Add track column**

```python
# In upsert_lead()
"nurture_track": track_id,  # from audit findings
"track_started_at": timestamp,
"track_position_days": 0,
```

**2. `nurture_engine.py` — Extend get_next_template()**

- Add `get_track_assignment()` method
- Add `get_track_position()` method
- Modify template selection to use track_id + segment

**3. New directory: `templates/` with track-specific subfolders**

**4. `nurture_log.jsonl` — Add track fields**

```json
{"email": "...", "subject": "...", "track_id": "...", "track_position_days": N}
```

### Testing

```python
# test_nurture_track_integration.py

def test_track_assignment_from_audit():
    audit = {"findings": [{"category": "headline", "severity": "high"}]}
    track_id = assign_nurture_track("test@example.com", audit["id"])
    assert track_id == "headline-clarity"

def test_segment_track_matrix():
    lead = {"segment": "warm", "track_id": "headline-clarity", "position": 5}
    template = get_next_template(lead)
    assert "teardown" in template or "worksheet" in template

def test_hot_bypasses_timing():
    lead = {"segment": "hot", "track_id": "headline-clarity", "position": 0}
    template = get_next_template(lead)
    assert "pitch" in template.lower()
```

### Rollback

If track integration causes issues:

1. Set `NURTURE_TRACKS_ENABLED = False`
2. Fall back to segment-only logic (current behavior)
3. Track fields ignored but preserved

### Metrics

Add to nurture report:

- Sends by track_id
- Open rate by track_id
- Reply rate by track_id
- Conversion rate by track_id + segment

This enables: "Which problem track produces the most buyers?"
