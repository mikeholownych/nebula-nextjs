# Nebula Components
> Landing page audit SaaS. ICP: founders bleeding ad spend on non-converting pages.

## Offer Ladder
- **$0** — Free audit (AI-scored teardown, emailed in <60s)
- **$97** — Fix Pack (top 2 issues fixed, implementation)
- **$997** — Growth Launch (60-day full rebuild)
- **$197/mo** — Retainer (ongoing monitoring + fixes)

## Positioning
- **Trigger-based**, not demographic. ICP = founder actively losing money on ads.
- **Self-serve** — no calls, no contracts, no agency markup.
- **60-second delivery** — audit emailed before the next ad dollar drops.
- **Diff vs competitors:** Zamp (sales-led), Oxygen (spray-list). We are trigger-aware + self-serve.

## Key Copy
- H1: "Stop burning ad spend on a page that can't close."
- CTA: "Run my free audit →"
- Trust: "40+ audits delivered · avg score back in 60s · 30-min-or-30-day guarantee"

## Tech Stack
- Frontend: `index.html` — static, hosted via cloudflare tunnel
- Backend: `agentic_server.py` (Flask, port 8765)
- Audit pipeline: `deliver_audit.py` — scrape_page() → score_audit() → compose_audit_email()
- DB: `lead_state.db` (access via lead_store.py only)
- Email: AgentMail REST API
- Payments: Stripe ($97 Fix Pack link)
- Analytics: GA4 G-KJ9S3450LH

## Revenue
- Revenue to date: $0 (pre-revenue, challenge started 2026-07-04)
- Goal: 1 paying customer minimum by 2026-07-11

## Source
raw/business-state.md
