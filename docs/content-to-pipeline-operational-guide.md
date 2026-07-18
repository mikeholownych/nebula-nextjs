# Content-to-Pipeline System — Operational Guide

**Generated:** 2026-07-17  
**Status:** Production Ready (Week 1-3 complete)

---

## System Overview

The Content-to-Pipeline system closes the loop from audit → nurture → pipeline through problem-specific nurture tracks.

### Key Components

| Component | File | Purpose |
|-----------|------|---------|
| Content Taxonomy | `content_taxonomy.json` | Problems → tracks mapping, templates, scoring |
| Track Assignment | `track_assignment.py` | Assigns track from audit findings |
| Template Renderer | `template_renderer.py` | Loads + renders markdown templates |
| Lead Manager | `lead_manager.py` | Extended with nurture_track fields |
| Nurture Engine | `nurture_engine.py` | Track-aware email trickle |
| Audit API | `platform_api/routes/audit_api.py` | Triggers track assignment on audit completion |

---

## Operational Workflows

### 1. Audit Completion → Track Assignment

**Flow:**
```
User submits audit → deliver_audit.py → findings extracted
→ audit_db.update_audit() → trigger_track_assignment()
→ lead_manager.upsert_lead(nurture_track=track_id)
```

**Trigger:** `POST /audit/run` endpoint

**Data stored:**
- `nurture_track`: Track ID (e.g., "headline-clarity")
- `track_audit_id`: Audit ID that triggered assignment
- `track_started_at`: ISO timestamp
- `track_position_days`: 0 (increments on each send)

**Verification:**
```bash
# Check lead has track assigned
cat ledgers/leads.jsonl | grep "example.com" | jq '.nurture_track'
# Should show: "headline-clarity", "cta-friction", etc.
```

---

### 2. Nurture Trickle Execution

**Cron:** Every 5 minutes

**Command:**
```bash
python3 /home/mike/nebula/nurture_engine.py --trickle
```

**Flow:**
```
pick_leads_for_nurture() → filter by segment + timing
→ check lead.nurture_track
→ build template_id: {segment}_{track_topic}_{variant}
→ render_template(template_id, lead, audit)
→ send_email() → log_sent(track_id, track_position_days)
```

**Rate limit:** Max 2 sends per 5-minute window (AgentMail)

**Fallback:** If no track assigned, uses legacy templates

**Verification:**
```bash
# Check nurture log for track fields
tail -5 ledgers/nurture_log.jsonl | jq '{
  email, 
  track_id, 
  track_position_days,
  timestamp
}'
```

---

### 3. Track Progression

**Cold Segment:**
- Day 0-7: Template variant 1 (diagnosis)
- Day 8-14: Template variant 2 (intro)
- Day 15+: Template variant 3 (advanced)

**Warm Segment:**
- Day 0-7: Template variant 1 (teardown)
- Day 8-14: Template variant 2 (checklist)
- Day 15+: Template variant 3 (case study)

**Hot Segment:**
- Immediate pitch (bypasses timing)
- Template: `hot_{track_topic}_pitch_1`

**Position calculation:**
```python
position_variant = min(track_position_days // 7 + 1, 3)
```

---

## 4 Problem-Specific Tracks

### Track 1: Headline Clarity

**Trigger:** High-severity headline finding

**Templates:**
- Cold: `cold_headline_diagnosis_1.md`, `cold_headline_intro_1.md`
- Warm: `warm_headline_teardown_1.md`, `warm_headline_checklist_1.md`
- Hot: `hot_headline_pitch_1.md`

**Key insight:** "Your headline describes what it is. They want to know what it does for them."

---

### Track 2: Message Match

**Trigger:** High-severity message-match finding

**Templates:**
- Cold: `cold_message_match_intro_1.md`
- Warm: `warm_message_comparison_1.md`
- Hot: `hot_message_review_1.md`

**Key insight:** "Your ad promised X. Your headline is about Y. The disconnect kills conversions."

---

### Track 3: CTA Friction

**Trigger:** High-severity CTA finding

**Templates:**
- Cold: `cold_cta_ambiguity_1.md`
- Warm: `warm_cta_checklist_1.md`
- Hot: `hot_cta_pitch_1.md`

**Key insight:** "Your CTA is visible. They just don't know what it costs to click."

---

### Track 4: Social Proof

**Trigger:** High-severity social-proof finding

**Templates:**
- Cold: `cold_proof_gap_intro_1.md`
- Warm: `warm_proof_hierarchy_1.md`
- Hot: `hot_proof_pitch_1.md`

**Key insight:** "Testimonials are decoration. Evidence requires hierarchy."

---

## Monitoring & Alerts

### Health Check

**Test audit → track assignment:**
```bash
# Submit test audit
curl -X POST http://localhost:3000/api/audit/run \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "email": "test@example.com"}'

# Check track assigned
sleep 10
cat ledgers/leads.jsonl | grep "test@example.com" | tail -1 | jq '.nurture_track'
```

### Daily Metrics

**Run:**
```bash
python3 -c "
import json
from pathlib import Path

leads_file = Path('/home/mike/nebula/ledgers/leads.jsonl')
leads = [json.loads(line) for line in leads_file.read_text().strip().split('\n')]

# Count by track
from collections import Counter
tracks = Counter(l.get('nurture_track', 'unassigned') for l in leads)
print('Tracks assigned:')
for track, count in sorted(tracks.items()):
    print(f'  {track}: {count}')
"
```

### Nurture Log Analysis

**Check track-specific sends:**
```bash
cat ledgers/nurture_log.jsonl | jq -r 'select(.track_id) | "\(.email) \(.track_id) \(.track_position_days)"' | head -20
```

---

## Troubleshooting

### Issue: Track not assigned after audit

**Check:**
```bash
# 1. Audit completed?
grep "completed" ledgers/audits.jsonl | tail -5

# 2. Findings extracted?
cat ledgers/audits.jsonl | jq '.findings' | tail -1

# 3. Import working?
python3 -c "from audit_track_trigger import trigger_track_assignment; print('✅ Import OK')"
```

**Fix:** Restart platform API if import fails

---

### Issue: Nurture sends using wrong template

**Check:**
```bash
# Lead has track?
cat ledgers/leads.jsonl | grep "example.com" | jq '.nurture_track'

# Template exists?
ls -la templates/cold/*headline*
```

**Fix:** Fall back to legacy templates if template missing

---

### Issue: Track position not advancing

**Check:**
```bash
# Nurture log has track_position_days?
tail -5 ledgers/nurture_log.jsonl | jq '.track_position_days'

# Lead position updated?
cat ledgers/leads.jsonl | grep "example.com" | jq '.track_position_days'
```

**Fix:** Manually increment position if needed

---

## LinkedIn Compliance

**See:** `/home/mike/nebula/compliance/linkedin_boundary.md`

**Key rules:**
- ✅ Automated: Observe, classify, draft, queue
- ⚠️ Human-approved: Reply send, DM send
- ❌ Never: Browser automation, auto-DM

**Consent flow:**
```
Comment → owned site → email capture → lead record → nurture
```

---

## Testing

### Run all tests:
```bash
cd /home/mike/nebula
python3 -m pytest tests/test_nurture_track_integration.py \
                     tests/test_nurture_engine_track_aware.py \
                     tests/test_audit_api_track_integration.py -v
# Expected: 19 passed
```

### Test individual components:
```bash
# Template renderer
python3 template_renderer.py

# Track assignment
python3 track_assignment.py

# Audit trigger
python3 audit_track_trigger.py
```

---

## Deployment Checklist

### Pre-deployment:
- [ ] All 19 tests passing
- [ ] Templates directory populated (13 files)
- [ ] Content taxonomy valid JSON
- [ ] Lead manager schema supports nurture_track
- [ ] Platform API imports trigger_track_assignment

### Post-deployment:
- [ ] Test audit submission
- [ ] Verify track assigned in leads.jsonl
- [ ] Check nurture log for track_id fields
- [ ] Monitor first trickle execution
- [ ] Confirm email rendered with correct template

---

## Rollback

**If track system fails:**

1. **Disable track assignment:**
```python
# In audit_api.py, comment out:
# trigger_track_assignment(...)

# Audits will complete without track assignment
# Nurture engine will use legacy templates
```

2. **Revert lead_manager.py:**
```bash
git checkout HEAD~1 -- lead_manager.py
```

3. **Fallback logic:**
- Nurture engine checks `if track_id and track_id != ""`
- Empty track_id → falls back to legacy templates
- System remains operational

---

## Next Steps

### Week 4: Monitoring
- Add track-specific metrics to daily briefing
- Monitor template open rates by track
- A/B test track templates

### Future Enhancements
- Extend AuditResponse model to include `nurture_track`
- Add track-specific landing pages (`/checklist/{track}`)
- Integrate with Twenty CRM when ready
- Add multi-track leads (secondary tracks)

---

## File Locations

```
/home/mike/nebula/
├── content_taxonomy.json          # Schema
├── track_assignment.py            # Logic
├── template_renderer.py           # Rendering
├── audit_track_trigger.py         # Audit integration
├── lead_manager.py                # Extended
├── nurture_engine.py              # Extended
├── templates/
│   ├── cold/                      # 4 templates
│   ├── warm/                      # 4 templates
│   └── hot/                       # 5 templates
├── nurture/
│   └── integration_design.md      # Design doc
├── compliance/
│   └── linkedin_boundary.md       # Compliance doc
├── platform_api/routes/
│   └── audit_api.py               # Extended
├── tests/
│   ├── test_nurture_track_integration.py
│   ├── test_nurture_engine_track_aware.py
│   └── test_audit_api_track_integration.py
└── IMPLEMENTATION_STATUS.md       # This status doc
```

---

**End of operational guide.**
