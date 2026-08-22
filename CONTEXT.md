# CONTEXT.md - Nebula Components domain language

- **Teardown**: a published landing-page audit of a specific company site, served at
  `/teardowns/[slug]`. Source of truth after Phase 1: `nebula_audit.teardowns` table.
- **Finding**: one issue inside a teardown. Shape: `{key, label, priority, quadrant, issue, evidence, fix}`.
  `quadrant` is exactly `'Quick Win'` or `'Major Project'`.
- **Claim**: a verified statement that an email address represents the company owning a
  teardown's domain. Stored in `nebula_audit.teardown_claims`. At most one `status='active'` per slug.
- **claimed_by_email**: the verified representative's email. Equals their **workspace email**
  (the email key used across `audits.email`, `monitors.email`, `workspace_preferences`).
- **Registered domain**: public-suffix-normalized domain (`app.loom.com` -> `loom.com`).
  Computed only via `platform_api/services/domains.py::registered_domain`.
- **Verification method**: one of `email_domain`, `dns_txt`, `gsc`.
- **Company response**: public attributed text a claimant publishes on their teardown page.
  Status lifecycle: null -> `visible` | `auto_hidden` | `removed`.
- **Private context**: workspace-only notes from the claimant. Never rendered publicly.
- **Founder account**: `mike.holownych@gmail.com` (hard-flagged in code).
