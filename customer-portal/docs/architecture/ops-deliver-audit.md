# `deliver_audit.py` is outreach-only

Product scoring for `POST /audit/accept` runs in-process in the FastAPI worker via `platform_api.services.audit_engine` (`score_inprocess` / `score_job`, default `AUDIT_ENGINE=inprocess`). That path imports scoring helpers from `deliver_audit.py`; it does not `subprocess` the CLI on the HTTP accept path.

`deliver_audit.py` (101 KB) remains the outreach/email composition CLI: scrape, score, compose, send via AgentMail. Cron, batch, and dry-run callers (`hot_lead_watcher.py`, `parallel_audit.py`, `scripts/run_instantly_aug16_batch.py`, and similar) keep using it.

Do not rewrite this script for the product audit runtime. Do not add a second scoring engine. The CLI adapter (`score_via_cli`) is a fallback for worker threads only.
