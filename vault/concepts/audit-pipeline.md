# Audit Pipeline
> scrape_page() → score_audit() → compose_audit_email() → AgentMail send

## Functions (deliver_audit.py)

### scrape_page(url)
- Fetches page content via Firecrawl
- Returns: raw HTML/text string (~60k chars for nebulacomponents.shop)
- Note: synchronous, ~5-10s

### score_audit(page)
- Single positional arg only — NO kwargs. Signature: def score_audit(page):
- Returns: dict with keys: score (float), grade (str A-F), dimensions (dict), top_issues (list)
- Note: LLM call inside — can return None on empty response (transient)

### compose_audit_email(score_result, url, email)
- Builds HTML email from score dict
- Returns: subject, html_body tuple

## HTTP Endpoint
- POST /api/audit (agentic_server.py)
- Body: {url, email, role (optional), monthly_spend (optional)}
- Synchronous — full pipeline runs in-request (~30-60s)
- Timeout: client-side 60s is tight; pipeline needs async or background job for prod

## Lead Storage
- lead_state.db — access ONLY via lead_store.py
- Stages: free_kit → audit → warm → beta_tester → 97 → 997 → 197_mo → sdr

## Known Pitfalls
- score_audit() takes ONE arg, no kwargs — will TypeError if you pass url= or monthly_spend=
- score_audit() can return None/empty on LLM timeout — always null-check before composing email
- Above-fold detection: index 20,232 (CTA) < 21,094 (numbers band) — confirmed correct
- HTML entity encoding: use &#8217; for smart apostrophe in index.html

## Source
raw/pipeline-architecture.md
