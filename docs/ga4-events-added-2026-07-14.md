# GA4 Events Added — Nebula Landing Page Sections

**Date:** 2026-07-14  
**Purpose:** Track engagement with competitive positioning sections

---

## Events Added

### 1. `founder_proof_view`
- **Trigger:** User scrolls to founder proof section (50% visible)
- **Section:** "BUILT BY · Someone who burned money on 4 failed experiments"
- **HTML:** `<section data-section="founder-proof">`
- **Category:** `section_view`
- **Label:** `founder-proof`

### 2. `comparison_table_view`
- **Trigger:** User scrolls to feature comparison table (50% visible)
- **Section:** "HOW WE COMPARE · What existing tools are missing"
- **HTML:** `<section data-section="feature-comparison">`
- **Category:** `section_view`
- **Label:** `feature-comparison`

### 3. `hero_impact_view`
- **Trigger:** User scrolls to quantified impact box (50% visible)
- **Section:** "We audited 200+ landing pages · Avg. monthly burn: $4,200"
- **HTML:** `<div data-section="quantified-impact">`
- **Category:** `section_view`
- **Label:** `quantified-impact`

---

## Implementation Details

### Code Location
- **File:** `/home/mike/nebula/index.html`
- **Line:** ~2280 (after scroll depth tracking)
- **Method:** `IntersectionObserver` with 50% threshold

### JavaScript Logic

```javascript
var sectionTracking = {
  'founder-proof': { fired: false, event: 'founder_proof_view' },
  'feature-comparison': { fired: false, event: 'comparison_table_view' },
  'quantified-impact': { fired: false, event: 'hero_impact_view' }
};

function trackSection(sectionId) {
  if (!sectionTracking[sectionId].fired) {
    sectionTracking[sectionId].fired = true;
    if (typeof gtag === 'function') {
      gtag('event', sectionTracking[sectionId].event, {
        event_category: 'section_view',
        event_label: sectionId,
        value: 1
      });
    }
  }
}

// IntersectionObserver for each section
if ('IntersectionObserver' in window) {
  Object.keys(sectionTracking).forEach(function(sectionId) {
    var section = document.querySelector('[data-section="' + sectionId + '"]') ||
                  document.getElementById(sectionId);
    if (section) {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            trackSection(sectionId);
          }
        });
      }, { threshold: 0.5 });
      observer.observe(section);
    }
  });
}
```

---

## HTML Markup

### Founder Proof Section
```html
<section class="card" data-section="founder-proof" style="...">
  <p>BUILT BY</p>
  <h2>Someone who burned money on 4 failed agency experiments.</h2>
  <!-- ... -->
</section>
```

### Feature Comparison Table
```html
<section class="card" data-section="feature-comparison" style="...">
  <p>HOW WE COMPARE</p>
  <h2>What existing tools are missing.</h2>
  <!-- ... -->
</section>
```

### Quantified Impact Box
```html
<div data-section="quantified-impact" style="...">
  <strong>We audited 200+ landing pages.</strong>
  Same 5 leaks every time. Avg. monthly burn: <strong>$4,200</strong>
  <!-- ... -->
</div>
```

---

## Existing GA4 Events

Nebula already tracks these events:

1. `audit_submit` — Form submission (line ~2180)
2. `free_kit_download` — Fix kit form submit (line ~2218)
3. `newsletter_signup` — Footer newsletter (line ~2237)
4. `scroll_depth` — 25/50/75/100% thresholds (line ~2248)
5. `roi_calc` — ROI calculator interaction (line ~2447)

**Total events tracked:** 8 (5 existing + 3 new)

---

## Metrics to Monitor

### Week 1 Targets (First 7 Days)

| Event | Expected Volume | Target Rate |
|-------|-----------------|-------------|
| `founder_proof_view` | 70% of visitors | >60% view rate |
| `comparison_table_view` | 50% of visitors | >45% view rate |
| `hero_impact_view` | 85% of visitors | >80% view rate |

### Funnel Analysis

```
Page view
  ↓
hero_impact_view (85% - near top)
  ↓
founder_proof_view (70% - mid-page)
  ↓
comparison_table_view (50% - below founder)
  ↓
audit_submit (5-10% - CTA)
```

---

## GA4 Dashboard Setup

### Custom Dimensions

1. **Section Name** (Event Label)
   - `founder-proof`
   - `feature-comparison`
   - `quantified-impact`

### Custom Metrics

1. **Section View Rate** = (Section Views / Page Views) × 100
2. **Scroll Depth Correlation** = % who view section AND convert
3. **Drop-off Rate** = % who view section but don't convert

### Recommended Reports

1. **Section Engagement Dashboard:**
   - Compare 3 new section view rates
   - Correlate with audit_submit events
   - Time on page by section viewed

2. **Conversion Funnel:**
   - hero_impact_view → founder_proof_view → comparison_table_view → audit_submit
   - Identify drop-off points

3. **A/B Test Ready:**
   - Test different founder proof headlines
   - Track which version drives higher comparison_table_view rate

---

## Verification

### Test in Browser Console

```javascript
// Check if tracking is loaded
console.log(window.sectionTracking); // Should show 3 sections

// Manually trigger event (for testing)
gtag('event', 'founder_proof_view', {
  event_category: 'section_view',
  event_label: 'founder-proof',
  value: 1
});
```

### Real-time Verification

1. Open GA4 DebugView
2. Navigate to landing page
3. Scroll to founder proof section
4. Verify `founder_proof_view` event appears

---

## Deployment Status

- ✅ **JavaScript added:** Line ~2280 (IntersectionObserver)
- ✅ **HTML attributes added:** 3 `data-section` attributes
- ✅ **Server restarted:** nebula-site.service
- ✅ **Verified:** curl confirms tracking code present

---

## Next Steps

1. **Monitor for 7 days** — Collect baseline data
2. **Check GA4 DebugView** — Confirm events fire correctly
3. **Create custom dashboard** — Section engagement metrics
4. **A/B test founder headline:**
   - Version A: "4 failed experiments"
   - Version B: "39 validated Reddit leads"
5. **Optimize comparison table placement** based on drop-off data

---

## Files Modified

1. `/home/mike/nebula/index.html`:
   - Added IntersectionObserver tracking (line ~2280)
   - Added `data-section="founder-proof"` (line ~1266)
   - Added `data-section="feature-comparison"` (line ~1292)
   - Added `data-section="quantified-impact"` (line ~1175)

---

**Status:** Live. GA4 will start tracking these sections immediately.
