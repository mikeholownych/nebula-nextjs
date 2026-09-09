# Citable audit report

- Run: `20260908T104455-audit---help-1fca`
- Command: `audit --help`
- Target: registries — /home/mike/nebula/.citable
- Timestamp: 2026-09-08T10:44:55.482Z
- Tool version: 1.16.0; commit: 2fc71dae2f54dfc1148bf7f78551d8cf31854fa2 (dirty)

> Findings describe observed conditions and probabilities. Nothing in this report guarantees crawling, indexing, ranking, citation, recommendation, or conversion outcomes.

## Summary

| Metric | Value |
| --- | --- |
| Total findings | 9 |
| Deterministic observations | 8 |
| Heuristic / semantic findings | 1 |
| low | 9 |

## Separate eligibility and observation states

| Dimension | Result | Evidence |
| --- | --- | --- |
| Retrieval eligibility | not_established | 8 finding(s); 35 skipped check(s) |
| Source extraction and support | not_established | 0 finding(s); 67 skipped check(s) |
| Observed citation behavior | not_evidenced | 0 controlled observation(s); property citation rate: not evidenced |

These states are not combined into an AI visibility score. Readiness does not establish retrieval selection or citation behavior.

## Skipped checks

- `TECH-001`: missing context: site
- `TECH-002`: missing context: site
- `TECH-003`: missing context: site
- `TECH-004`: missing context: site
- `TECH-005`: missing context: site
- `TECH-006`: missing context: site
- `TECH-007`: missing context: site
- `TECH-008`: missing context: site
- `TECH-009`: missing context: site
- `TECH-010`: missing context: site
- `TECH-011`: missing context: site
- `TECH-012`: missing context: site
- `TECH-013`: missing context: site
- `TECH-014`: missing context: site
- `TECH-015`: missing context: site
- `TECH-016`: missing context: site
- `TECH-017`: missing context: site
- `TECH-018`: missing context: site
- `TECH-019`: missing context: site
- `TECH-020`: missing context: site
- `TECH-021`: missing context: site
- `TECH-022`: missing context: site
- `TECH-023`: missing context: site
- `TECH-024`: missing context: site
- `TECH-025`: missing context: site
- `CRAWL-001`: missing context: site
- `CRAWL-003`: missing context: site
- `CRAWL-004`: missing context: site
- `CRAWL-007`: missing context: site
- `ARCH-001`: missing context: site
- `ARCH-002`: missing context: site
- `ARCH-003`: missing context: site
- `ARCH-006`: missing context: site
- `PAGE-001`: missing context: site
- `PAGE-002`: missing context: site
- `PAGE-003`: missing context: site
- `PAGE-004`: missing context: site
- `PAGE-005`: missing context: site
- `PAGE-006`: missing context: site
- `PAGE-007`: missing context: site
- `PAGE-008`: missing context: site
- `PAGE-009`: missing context: site
- `PAGE-010`: missing context: site
- `PAGE-011`: missing context: site
- `ANS-001`: missing context: site
- `ANS-002`: missing context: site
- `ANS-003`: missing context: site
- `ANS-004`: missing context: site
- `ANS-005`: missing context: site
- `ANS-006`: missing context: site
- `ANS-007`: missing context: site
- `ANS-008`: missing context: site
- `ANS-009`: missing context: site
- `ANS-010`: missing context: site
- `ANS-011`: missing context: site
- `ANS-012`: missing context: site
- `ANS-013`: missing context: site
- `ANS-014`: missing context: site
- `ANS-015`: missing context: site
- `ANS-016`: missing context: site
- `ENTITY-002`: missing context: site
- `ENTITY-003`: missing context: site
- `ENTITY-004`: missing context: site
- `ENTITY-006`: missing context: site
- `CLAIM-007`: missing context: site
- `CLAIM-008`: missing context: site
- `SCHEMA-001`: missing context: site
- `SCHEMA-002`: missing context: site
- `SCHEMA-003`: missing context: site
- `SCHEMA-004`: missing context: site
- `SCHEMA-005`: missing context: site
- `SCHEMA-006`: missing context: site
- `SCHEMA-007`: missing context: site
- `SCHEMA-008`: missing context: site
- `SCHEMA-009`: missing context: site
- `SCHEMA-010`: missing context: site
- `SCHEMA-011`: missing context: site
- `SCHEMA-012`: missing context: site
- `SCHEMA-013`: missing context: site
- `SCHEMA-014`: missing context: site
- `SCHEMA-015`: missing context: site
- `SCHEMA-016`: missing context: site
- `LINK-001`: missing context: site
- `LINK-002`: missing context: site
- `LINK-003`: missing context: site
- `LINK-004`: missing context: site
- `LINK-005`: missing context: site
- `LINK-006`: missing context: site
- `GEO-001`: missing context: site
- `GEO-003`: missing context: site
- `GEO-004`: missing context: site
- `GEO-005`: missing context: site
- `GEO-011`: missing context: site
- `GEO-012`: missing context: site
- `GEO-013`: missing context: observations
- `RECO-001`: missing context: site
- `RECO-002`: missing context: site
- `RECO-003`: missing context: site
- `RECO-004`: missing context: site
- `RECO-005`: missing context: site
- `RECO-006`: missing context: site
- `LIFE-006`: missing context: site
- `MEAS-001`: missing context: promptResults
- `CWV-004`: missing context: site
- `CRO-001`: missing context: site
- `CRO-002`: missing context: site
- `CRO-003`: missing context: site
- `CRO-004`: missing context: site
- `CRO-005`: missing context: site
- `CRO-006`: missing context: site
- `CRO-007`: missing context: site
- `CRO-008`: missing context: site
- `CRO-009`: missing context: site
- `CRO-010`: missing context: site
- `CRO-011`: missing context: site
- `CRO-012`: missing context: site
- `CRO-013`: missing context: site
- `CRO-014`: missing context: site
- `CRO-015`: missing context: site
- `CRO-016`: missing context: site
- `CRO-017`: missing context: site
- `CRO-018`: missing context: site
- `CRO-019`: missing context: site

## Incomplete or untestable conditions

- No site target supplied and no built_output_dir configured: page/site detectors were skipped; this run covers registries only.

## Findings

### LOW · CRAWL-006 · No decision recorded for Googlebot (search_indexing)

- Subject: `crawlers/CRAWLER-GOOGLEBOT`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: legal:medium
- Evidence:
  - entry CRAWLER-GOOGLEBOT: decision=undecided
- Remediation: Record an explicit allow/block decision with owner and business and legal rationale.
- Verify: Registry entry decision is allow or block. (rerun `CRAWL-006`)

### LOW · CRAWL-006 · No decision recorded for Bingbot (search_indexing)

- Subject: `crawlers/CRAWLER-BINGBOT`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: legal:medium
- Evidence:
  - entry CRAWLER-BINGBOT: decision=undecided
- Remediation: Record an explicit allow/block decision with owner and business and legal rationale.
- Verify: Registry entry decision is allow or block. (rerun `CRAWL-006`)

### LOW · CRAWL-006 · No decision recorded for OAI-SearchBot (ai_search_discovery)

- Subject: `crawlers/CRAWLER-OAI-SEARCHBOT`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: legal:medium
- Evidence:
  - entry CRAWLER-OAI-SEARCHBOT: decision=undecided
- Remediation: Record an explicit allow/block decision with owner and business and legal rationale.
- Verify: Registry entry decision is allow or block. (rerun `CRAWL-006`)

### LOW · CRAWL-006 · No decision recorded for GPTBot (model_training)

- Subject: `crawlers/CRAWLER-GPTBOT`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: legal:medium
- Evidence:
  - entry CRAWLER-GPTBOT: decision=undecided
- Remediation: Record an explicit allow/block decision with owner and business and legal rationale.
- Verify: Registry entry decision is allow or block. (rerun `CRAWL-006`)

### LOW · CRAWL-006 · No decision recorded for ChatGPT-User (user_initiated_retrieval)

- Subject: `crawlers/CRAWLER-CHATGPT-USER`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: legal:medium
- Evidence:
  - entry CRAWLER-CHATGPT-USER: decision=undecided
- Remediation: Record an explicit allow/block decision with owner and business and legal rationale.
- Verify: Registry entry decision is allow or block. (rerun `CRAWL-006`)

### LOW · CRAWL-006 · No decision recorded for PerplexityBot (ai_search_discovery)

- Subject: `crawlers/CRAWLER-PERPLEXITYBOT`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: legal:medium
- Evidence:
  - entry CRAWLER-PERPLEXITYBOT: decision=undecided
- Remediation: Record an explicit allow/block decision with owner and business and legal rationale.
- Verify: Registry entry decision is allow or block. (rerun `CRAWL-006`)

### LOW · CRAWL-006 · No decision recorded for Perplexity-User (user_initiated_retrieval)

- Subject: `crawlers/CRAWLER-PERPLEXITY-USER`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: legal:medium
- Evidence:
  - entry CRAWLER-PERPLEXITY-USER: decision=undecided
- Remediation: Record an explicit allow/block decision with owner and business and legal rationale.
- Verify: Registry entry decision is allow or block. (rerun `CRAWL-006`)

### LOW · CRAWL-006 · No decision recorded for ClaudeBot (model_training)

- Subject: `crawlers/CRAWLER-CLAUDEBOT`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: legal:medium
- Evidence:
  - entry CRAWLER-CLAUDEBOT: decision=undecided
- Remediation: Record an explicit allow/block decision with owner and business and legal rationale.
- Verify: Registry entry decision is allow or block. (rerun `CRAWL-006`)

### LOW · AGENT-003 · llms.txt not discovered during crawl

- Subject: `/llms.txt`
- Type: probabilistic_inference; confidence: medium; deterministic: false
- Evidence:
  - No /llms.txt found in crawl results or site metadata
- Remediation: Create /llms.txt at your site root with: site purpose, key pages list with descriptions, and optionally /llms-full.txt with complete content. See https://llmstxt.org/ for spec.
- Verify: Fetch /llms.txt and confirm it returns 200 with Markdown content. (rerun `AGENT-003`)
- Limitations: heuristic detection; verify manually before acting
