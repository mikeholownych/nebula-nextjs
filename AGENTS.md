# AGENTS.md — Nebula Components

Read this before touching anything in this repository. It applies to every agent, in every directory, regardless of which harness loaded you.

---

## Production Doctrine (highest priority)

**This is a live production service.** It serves real founders, captures real leads, and processes real payments through Stripe. There is no staging safety net between your changes and customers.

1. **If any development effort is not 100% ready for production use, you are not done.** Keep iterating until it is. "Mostly working", "ready pending cleanup", and "works on my machine" are all failure states.
2. **Every production failure is a permanent hit on our credibility.** A 500 seen by one visitor, a broken audit email, a dead checkout link: each one is trust we do not get back. Treat severity accordingly.
3. **"It builds" is not done. "Tests pass" is not done.** Done means verified against the running service with captured evidence: HTTP status codes, log lines, rendered output, database rows. See Definition of Done below.

---

## Definition of Done (every task, no exceptions)

1. **State a verify plan before building.** One line: how you will prove the change works on the live service when finished.
2. Build the change.
3. **Verify against production**, not assumptions:
   - `curl` the real URL(s) and capture status codes.
   - Check `journalctl` for the relevant unit after restart; confirm zero new errors.
   - Confirm rendered output contains the change (grep the HTML, not the source).
4. **Check blast radius.** Any deploy touches everything downstream of it. Minimum regression set after ANY change to `customer-portal`: homepage `/`, revenue surface `/audit`, and the page(s) you touched all return 200 with correct content.
5. **Report what actually ran.** Include exit codes, real command output, and any failures encountered. A report without artifacts is a claim, not a result.

---

## Failure Rules

- **Never leave a broken state deployed.** If a build fails or a restart breaks something, roll back to the last known-good build FIRST (`git` + rebuild + restart), then debug. Downtime while debugging is worse than downtime while rolling back.
- **Half-finished features must not ship.** If you cannot complete a feature to production quality in this session, do not merge partial wiring. An unfinished endpoint behind a flag beats an erroring endpoint in the open.
- **Erroring endpoints are incidents, not backlog.** If `journalctl -u nebula-platform-api.service` shows recurring 500s caused by your area, fix or disable the route now. Known example pattern: a missing DB migration surfacing as continuous 500s on a public route.
- **Never fabricate results.** If a tool fails, say so with the exact error. Inventing output is grounds for immediate removal from this codebase's history.
- **Secrets stay out of the repo.** Live keys live in `$HOME/.hermes/.env`. Never stage, log, or echo them.

---

## Operational Map (quick reference)

- Canonical domain: **nebulacomponents.com** (not .shop)
- Next.js app: `customer-portal/`, systemd `nebula-nextjs.service`, port 3000
- Platform API: FastAPI, systemd `nebula-platform-api.service`, port 8001, venv required
- Audit DB: local Postgres `nebula_audit`, socket `/var/run/postgresql`, port 5433
- Deploys: rebuild (`npx next build`) then `systemctl restart`, then verify per Definition of Done
- Full operational facts, lead-stage flow, pre-commit checks, and known pitfalls: see `CLAUDE.md` in this directory. It applies to you even if you are not Claude.

---

## Hard Content Rules (enforced site-wide)

- No em-dashes anywhere in shipped content. Ever.
- One accent color: `#c7ff2f`. No teal. No glow orbs.
- `warning` Tailwind class does not exist by design; amber `signal-fail` is reserved exclusively for failed audit signals on the results page.
- Drift surfaces to verify against canonical before committing copy: `$97`, `48 hours`, signal count and names.
- Homepage is frozen except explicit Mike approval. Client Workspace nav link must always exist.

---

## Delegation Contract (binding on anyone who spawns subagents or lanes)

Every delegated task that touches this repository MUST carry, embedded in its context block at spawn time — never assumed from discovery:

1. **The Production Doctrine, verbatim**: "This is a live production service. If any development effort is not 100% ready for production use, you are not done. Keep iterating until it is. Every failure is a permanent hit on our credibility."
2. **A completion contract**: `for/g` (goal state), `verify` (artifact the child must return: URL status codes, log lines, DB rows), `constraints` (explicit forbidden actions).
3. **No send/publish/spend/deploy authority** unless the spawn brief grants it explicitly. Researched targets are not send authorization. Drafts are drafts until independently verified on the live surface.
4. **Repo hygiene**: never delete files or content without an explicit paper trail; archive superseded material to `.legacy/` with an `ARCHIVE_INVENTORY.md`. Audit logs (`aidlc-docs/audit.md`) are append-only.
5. Lane workers produce bounded artifacts only; they never write canonical ledgers, canonical site surfaces, or lead stores. The parent merges, gates, and deploys.

An orchestrator that delegates without embedding items 1-3 has not actually delegated this repo's standard. Discovery of AGENTS.md is a fallback, not the mechanism.

## When Unsure

Escalate to Mike rather than guessing. Guessing in production is how credibility gets spent. Reversible experiments are fine; irreversible ones are not yours to authorize.
