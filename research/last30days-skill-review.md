# last30days-skill Review and Nebula Extraction

**Reviewed:** `mvanhorn/last30days-skill`  
**Commit:** `4b027919c76e24ac27875c854bfd9f57c0b7cb69`  
**Date:** 2026-07-13

## Verdict

**Grade: A- for research infrastructure; B for prompt/skill maintainability.**

Use the architecture. Do not make Nebula's production lead pipeline depend on the whole package yet. The repository has strong tests, explicit source-health semantics, safe preflight behavior, pinned GitHub Actions, provenance attestations, and clean dependency results. Its 2,148-line runtime skill contract is the main operational risk: it is expensive to load, host-specific, repetitive, and difficult for models to follow reliably.

## Evidence

- Python tests: `3,087 passed, 5 skipped, 23 subtests passed`.
- Go MCP tests: all packages passed under `go test -race ./...`.
- Dependency audit: no known vulnerabilities across the locked Python graph.
- Safe preflight: no writes; browser-cookie reads disabled; secret values not printed.
- Mock engine run produced versioned JSON with 21 per-source outcomes.
- Tracked-secret scan found only an obvious dummy test value.
- Scale: 1,370 files; 769 Python files; 179 Python test files; 44,670 engine Python LOC.

## What is worth stealing

| Component | Their approach | Nebula before | Nebula after |
|---|---|---|---|
| Source outcome taxonomy | Distinguishes `no-results` from auth, rate-limit, timeout, network, and schema failures | Apify errors returned `[]`, indistinguishable from a quiet market | Structured `source_outcomes.jsonl` evidence |
| Partial coverage semantics | Returned items plus later failure becomes `partial` | Empty-list/error laundering | Failure remains visible and never becomes market evidence |
| Watchlist deltas | SQLite history, new-vs-updated delivery, daily budget | Independent stateless scrapes | Candidate for a later trigger-watch layer |
| Safe preflight | Reports reads, writes, credentials, binaries without exposing values | Ad hoc source checks | Pattern should be reused before new source activation |
| Confidence floors | Honest “nothing solid” outcome instead of ranking noise | Weak signals can enter pipeline | Keep Nebula’s ICP gate; add cross-source corroboration later |

## Implemented now

- Added `source_outcomes.py` to Nebula.
- Added source states: `ok`, `no-results`, `partial`, `rate-limited`, `auth-failed`, `unreachable`, `timeout`, `schema-drift`, `skipped-unconfigured`, `error`.
- Integrated Apify calls in `signal_scrapers.py` so HTTP 429/401/403/5xx and timeouts are persisted instead of silently returned as empty market results.
- Added four tests, including a regression test proving an Apify 429 is recorded as `rate-limited` with `market_quiet=false`.

## Repository issues

1. `HERMES_SETUP.md` install guidance says the explicit `/skills/last30days` path is required, but its update command reverts to the short stale-index path.
2. `HERMES_SETUP.md` links Hermes support to `github.com/mercurial-tf/hermes`; the active Hermes Agent repository is `NousResearch/hermes-agent`.
3. ScrapeCreators allowance conflicts: README says 10,000 free calls; Hermes guide says 100 free credits.
4. The main `SKILL.md` is 2,148 lines and contains repeated incident histories and output-law reinforcement. Tests compensate, but the contract itself remains a context and compliance risk.
5. Semgrep and OSV scheduled scans are advisory (`continue-on-error` / `fail-on-vuln: false`), so known findings can remain non-blocking.
6. Release CI disables Go checksum verification (`GOSUMDB=off`) while installing an external release tool. The module is version-pinned and outputs are attested, but checksum bypass still weakens the build chain.

## Recommendation

Adopt in two layers:

1. **Now:** keep the source-outcome and confidence-floor patterns inside Nebula’s existing trigger engine.
2. **Later:** install `last30days` as an optional market-research skill for CEO/market work, not as the sole lead source. Gate production adoption on one real 30-day trigger-search benchmark against Nebula’s current IH/HN/Google pipeline.
