# Nebula Components — Domain Glossary

> Load this file at the start of every agent session working in this repo.
> Terms here define the shared language. Use them exactly — don't drift to synonyms.

---

## Product

**Nebula** — the whole product: the audit engine, the customer portal, the platform API, and the ops tooling.

**Audit** — a single URL analysis run. Produces a score, grade, and set of findings across 9 signals. Identified by `audit_id` (UUID).

**Signal** — one dimension of a landing page's conversion health. There are exactly 9:
1. `headline` — H1 clarity and specificity
2. `cta` — call-to-action presence and prominence
3. `above_fold` — visible content before scroll
4. `social_proof` — testimonials, logos, reviews
5. `load_speed` — Core Web Vitals, TTFB
6. `mobile` — responsive layout and tap targets
7. `ad_signals` — landing page / ad message match
8. `seo_foundations` — title, meta description, canonical
9. `ai_readiness` — LLM-accessible structure, structured data

**Finding** — one signal's result for a given audit. Has: `passed` (bool), `score` (0.0–1.0), `issue` (what's wrong), `evidence` (raw value observed).

**Score** — composite 0–100 across all 9 signals (each signal contributes ~11 pts at full weight). Stored as `audits.score` in the DB, rendered as a 0–10 grade in the UI.

**Grade** — letter grade derived from score: A (≥90), B (≥75), C (≥60), D (≥45), F (<45).

**Signal Verifier** — `platform_api/services/signal_verifier.py`. Fetches the target URL and runs all 9 `verify_*` functions. Returns a `SignalResult` dict per signal.

**One-Leak Repair Sprint** — the $97 paid offer. A single sprint to identify and fix the #1 conversion leak. Triggered by `checkout.session.completed` webhook from Stripe (product `5kQbJ1eawdj6eql1Jg43S0h`).

**Fix Pack** — legacy name for the $97 offer. Prefer "One-Leak Repair Sprint" in new copy.

---

## Architecture

**Customer Portal** — Next.js app at `/home/mike/nebula/customer-portal`. Serves `nebulacomponents.com`. Deployed via `nebula-nextjs` systemd unit on :3000, exposed via Cloudflare Tunnel.

**Platform API** — FastAPI app at `/home/mike/nebula/platform_api`. Serves `:8001`. Handles audit runs, user records, monitors, payment webhooks, and dispatch.

**AuditDB** — `platform_api/services/audit_db.py`. Singleton async service backed by `nebula_audit` PostgreSQL DB (port 5433). Primary tables: `audits`, `customers`, `recommendations`, `monitors`, `monitor_events`.

**content_ops DB** — Separate PostgreSQL DB (port 5432). Canonical tables managed by n8n Trigger Engine: `prospects`, `web_properties`, `audits` (different schema), `findings`, `qualifications`, `offers`, `interventions`, `outcomes`, `events`.

**Dispatch** — `platform_api/services/dispatch.py`. Builds and sends weekly workspace activity summaries to users via AgentMail.

**Manifest** — a structured summary payload built by `dispatch.build_manifest()`. Represents one user's weekly activity.

**Screenshot Service** — `platform_api/services/screenshot_service.py`. Captures before/after screenshots for audit evidence.

**Signal Verifier** — see above.

---

## Data

**`audit_id`** — UUID. Primary key for an audit run. Links findings to payments to screenshots.

**`customer_id`** — UUID. Links to `customers` table by email.

**Score range** — `audits.score` is 0–100. UI multiplies by 0.1 to show 0–10. Don't confuse the two.

**Evidence atom** — the raw scraped value attached to a finding (e.g. H1 text, meta description length). Used in the results UI as proof.

**Cohort aggregate** — anonymized group metrics stored via `record_cohort_aggregate()`. Never contains individual PII.

---

## Frontend

**Workspace** — the authenticated area at `/workspace`. Gated by email (localStorage MVP). Shows audit history, monitors, billing.

**Audit Page** — `/audit`. Public URL-input form. Submits to Platform API `/audit/run`. No email required.

**Results Page** — `/audit/[id]/results`. Public permalink for a completed audit. Shows score, grade, 9 signal findings, and the $97 offer.

**Lab** — `/audit/lab` or `/api/audit/lab`. Component-level signal tester. Rate-limited to 10 req/min.

**EmailGate** — `components/EmailGate.tsx`. Wrapper that stores email in localStorage and gates the workspace. Not a hard auth boundary.

**Magic Link** — `/api/auth/magic-link`. Issues a JWT session via HTTP-only cookie after email verification. Replaces the localStorage gate for sensitive routes.

---

## Ops / Infra

**nebula-nextjs** — systemd unit running the Next.js production build on :3000.

**nebula-platform-api** — systemd unit running FastAPI on :8001.

**Cloudflare Tunnel** — exposes :3000 publicly as `nebulacomponents.com`. Changes go live only after `sudo systemctl restart nebula-nextjs`.

**n8n** — workflow automation at `n8n.mikeholownych.com` (10.0.8.220:5678). Hosts the Trigger Engine workflow (`9HGVFfIPDHRYMtuE`). Webhooks use `/webhook/<path>` (no UUID prefix).

**AgentMail** — transactional email service. Used for magic links, dispatch summaries, and One-Leak Repair Sprint delivery. `send()` is synchronous.

**IndexNow** — search engine ping protocol. Key deployed at `/nebula-indexnow-key.txt`.

---

## Avoid

| Don't use | Use instead |
|-----------|-------------|
| Fix Pack | One-Leak Repair Sprint |
| component | signal |
| page health | audit |
| errors | findings |
| service | Platform API |
| frontend | Customer Portal |
| dashboard | Workspace |
| grades / scores interchangeably | score (0–100 internal), grade (A–F display) |
