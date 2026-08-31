# Archive Inventory (customer-portal)

This directory holds retired customer-portal material kept for paper-trail
purposes only. Nothing here is built, served, or referenced by the live app.

## Contents

- `learning-centre/landing-page-bounce-rate-fix-leaks/meta.json` (2026-08-31): archived orphan metadata. No matching `page.tsx` ever shipped, and the active article `landing-page-bounce-rate-high` already covers the intent. Keeping this sidecar active created a ghost sitemap URL.
- Retired scripts were moved out of version control per `.gitignore`
  (`.legacy/`, `*.legacy/`); recover them from git history if needed.

## Authoritative indexes

- Quarantined/dead routes: see `ROUTE_REGISTER.md`, section
  "Archive Routes" (28 routes, owner `quarantine-task1`, all noindex/nofollow).
- Claim exclusions and pricing evidence: see `CLAIM_REGISTER.md`.

## Rules

1. Anything moved into this directory must be listed here with a date and a
   reason, or removed from the repo entirely.
2. Archived routes must never be re-linked from live navigation or copy.
3. This file is force-added (`git add -f`) because the directory is ignored;
   CI's governance validator requires it to exist.
