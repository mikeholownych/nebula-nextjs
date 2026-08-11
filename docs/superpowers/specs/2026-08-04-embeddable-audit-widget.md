# Embeddable Audit Widget - Technical Specification

## Overview

A lightweight JavaScript widget that agency partners can embed on their own websites. When a visitor enters a URL, the widget runs a Nebula landing page audit and displays the score - capturing the lead for both the agency and Nebula.

This turns the $497 Agency Partner offer into a lead generation tool that works on the partner's domain, not just ours.

## Business Model

| Party | Gets |
|-------|------|
| Agency partner | Leads from their own traffic (email + URL + score) |
| Nebula | Attribution, co-branded audit data, upgrade path to $97 fix pack |
| Visitor | Free instant score with actionable diagnosis |

## Embed Code (what the partner copies)

```html
<div id="nebula-audit-widget" data-partner="PARTNER_ID" data-theme="dark"></div>
<script src="https://nebulacomponents.com/widget/audit.js" async></script>
```

## Widget Behavior

### States

1. **Form** - URL input + optional email field + "Scan my page" button
2. **Processing** - animated progress indicator (30-90 seconds)
3. **Score** - overall score (0-10), grade (A-F), top 3 findings summary
4. **Expand** - "See full report" links to `nebulacomponents.com/audit/{id}/results?partner=PARTNER_ID`

### Data Flow

```
Visitor enters URL
  → Widget POSTs to /api/widget/audit
  → Backend validates partner_id (from embed data attribute)
  → Backend runs standard audit pipeline
  → Returns: { audit_id, score, grade, top_findings[] }
  → Widget renders score card
  → Email capture gate before full findings (same as /audit flow)
  → Lead attributed to partner in lead_state.db
```

### API Endpoint

```
POST /api/widget/audit
Content-Type: application/json

{
  "url": "https://example.com",
  "partner_id": "agency_abc123",
  "visitor_email": "optional@example.com"  // if collected in widget
}

Response:
{
  "audit_id": "uuid",
  "score": 6.2,
  "grade": "C",
  "findings_summary": [
    { "key": "message_match", "score": 4, "label": "Weak message match with likely ad copy" },
    { "key": "mobile_ux", "score": 7, "label": "Mobile experience is adequate" },
    { "key": "trust_signals", "score": 5, "label": "Limited social proof above fold" }
  ],
  "full_report_url": "https://nebulacomponents.com/audit/{id}/results?partner=agency_abc123"
}
```

### Rate Limiting

- 10 audits/hour per partner (prevents abuse)
- 3 audits/day per visitor IP (prevents spam)
- Partners on $497 plan: 100 audits/month included, $2/audit after

### Partner Dashboard (Future)

Partners see in their Nebula workspace:
- Total widget audits this month
- Leads captured (email + URL pairs)
- Conversion to full report views
- Upgrade to fix pack attribution

## Technical Implementation

### Widget JS (`public/widget/audit.js`)

- Self-contained, no dependencies (vanilla JS + shadow DOM)
- ~15KB gzipped
- Renders inside shadow DOM to avoid CSS conflicts
- Communicates only with `nebulacomponents.com/api/widget/*`
- Supports `data-theme="dark"` (default) and `data-theme="light"`
- Responsive: works in any container ≥320px wide

### Backend

- New route: `app/api/widget/audit/route.ts`
- Validates `partner_id` against `partners` table
- CORS: allows only domains registered by the partner
- Runs same audit engine as `/api/audit/start`
- Records `source: "widget"` and `partner_id` in audit metadata
- Attribution: lead_state.db gets `source_partner` field

### Partner Registration

When an agency pays $497:
1. Stripe webhook creates partner record
2. Partner receives `partner_id` + embed code
3. Partner registers their domain(s) for CORS allowlist
4. Widget becomes active on their registered domains

## Design

### Dark theme (default)

- Background: `#0a0f1a` (matches Nebula brand)
- Text: `#e2e8f0`
- Accent: `#00c2a0` (Nebula green)
- Border: `#1e293b`
- Score ring: animated SVG circle, color based on grade

### Light theme

- Background: `#ffffff`
- Text: `#1a202c`
- Accent: `#00c2a0`
- Border: `#e2e8f0`

### Dimensions

- Default width: 100% of container
- Min width: 320px
- Height: auto (expands with content)
- Form state: ~180px tall
- Processing: ~200px
- Score card: ~300px

## Validation Criteria

- [ ] Widget loads in <2s on a cold cache
- [ ] Audit completes within 90s (same as direct)
- [ ] Shadow DOM isolates styles from host page
- [ ] CORS rejects requests from unregistered domains
- [ ] Rate limits enforce per-partner and per-IP caps
- [ ] Lead attribution traces to partner in lead_state.db
- [ ] "Powered by Nebula" link visible in all states
- [ ] Full report link includes partner attribution query param
- [ ] Widget gracefully handles API errors with user-friendly message
- [ ] Partner can copy embed code from their workspace after payment

## Revenue Impact Model

If each agency partner generates 20 widget audits/month:
- 20 leads × 63% email capture (our current rate) = ~13 emails
- 13 emails × current funnel = potential fix pack conversions
- Partner gets the leads; Nebula gets the attribution + upgrade path
- At 10 partners: 200 audits/month → 130 emails → measurable pipeline

## Priority

This is a force multiplier for the $497 offer. Instead of "pay $497 for partnership" (vague), it becomes "pay $497 and get a lead-generating audit widget for your site" (concrete, measurable value).

Marvin Russell / Marvlus proved this model converts at 27% with their embeddable SEO audit. Our conversion rate today is strong on the submit step but we're losing people between submit and results (18% completion). The widget solves this by showing the score immediately and gating only the full report.
