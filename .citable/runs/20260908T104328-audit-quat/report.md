# Citable audit report

- Run: `20260908T104328-audit-quat`
- Command: `audit`
- Target: url — https://nebulacomponents.com
- Timestamp: 2026-09-08T10:43:28.781Z
- Tool version: 1.16.0; commit: 2fc71dae2f54dfc1148bf7f78551d8cf31854fa2 (dirty)

> Findings describe observed conditions and probabilities. Nothing in this report guarantees crawling, indexing, ranking, citation, recommendation, or conversion outcomes.

## Summary

| Metric | Value |
| --- | --- |
| Total findings | 544 |
| Deterministic observations | 524 |
| Heuristic / semantic findings | 20 |
| high | 150 |
| medium | 324 |
| low | 70 |

## Separate eligibility and observation states

| Dimension | Result | Evidence |
| --- | --- | --- |
| Retrieval eligibility | partial | 297 finding(s); 0 skipped check(s) |
| Source extraction and support | not_established | 246 finding(s); 1 skipped check(s) |
| Observed citation behavior | not_evidenced | 0 controlled observation(s); property citation rate: not evidenced |

These states are not combined into an AI visibility score. Readiness does not establish retrieval selection or citation behavior.

## Skipped checks

- `GEO-013`: missing context: observations
- `MEAS-001`: missing context: promptResults

## Incomplete or untestable conditions

- URL collection reached the 50-page limit with 198 discovered URL(s) pending; sitemap absence checks are incomplete.

## Findings

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/teardowns#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/teardowns#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/repair-sprint#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/repair-sprint#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/pricing#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/pricing#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/learning-centre#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/learning-centre#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/blog#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/blog#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/about#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/about#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/audit?utm_source=site-nav&utm_medium=internal#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/audit?utm_source=site-nav&utm_medium=internal#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/research/landing-page-performance-q3-2026#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/research/landing-page-performance-q3-2026#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/resources/citable#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/resources/citable#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/teardowns/knallhart#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/teardowns/knallhart#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/teardowns/postmint#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/teardowns/postmint#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/teardowns/basecamp#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/teardowns/basecamp#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/repair-sprint?utm_source=homepage&utm_medium=internal#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/repair-sprint?utm_source=homepage&utm_medium=internal#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/audit?utm_source=homepage&utm_medium=internal#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/audit?utm_source=homepage&utm_medium=internal#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/audit#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/audit#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/benchmarks#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/benchmarks#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/case-studies#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/case-studies#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/compare#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/compare#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/ecommerce-landing-page-audit#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/ecommerce-landing-page-audit#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/saas-landing-page-audit#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/saas-landing-page-audit#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/mobile-landing-page-audit#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/mobile-landing-page-audit#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/lead-generation-landing-page-audit#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/lead-generation-landing-page-audit#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/landing-page-cta-audit#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/landing-page-cta-audit#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/landing-page-message-match#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/landing-page-message-match#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/why-is-my-landing-page-not-converting#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/why-is-my-landing-page-not-converting#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/ads-getting-clicks-but-no-sales#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/ads-getting-clicks-but-no-sales#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/what-is-landing-page-audit#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/what-is-landing-page-audit#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/best-landing-page-audit-tools#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/best-landing-page-audit-tools#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/playbooks#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/playbooks#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/press#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/press#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/brand#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/brand#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/editorial-standards#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/editorial-standards#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/audit?utm_source=footer&utm_medium=internal#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/audit?utm_source=footer&utm_medium=internal#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/privacy-policy#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/privacy-policy#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/terms#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/terms#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/data-rights#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/data-rights#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/audit?utm_source=teardowns-hero&utm_medium=hero-cta#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/audit?utm_source=teardowns-hero&utm_medium=hero-cta#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/teardowns/carrd#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/teardowns/carrd#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/teardowns/hotjar#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/teardowns/hotjar#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/teardowns/kit#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/teardowns/kit#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/teardowns/beehiiv#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/teardowns/beehiiv#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/teardowns/unbounce#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/teardowns/unbounce#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/teardowns/webflow#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/teardowns/webflow#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/teardowns/framer#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/teardowns/framer#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/teardowns/notion#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/teardowns/notion#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/teardowns/calendly#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/teardowns/calendly#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/teardowns/hubspot#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/teardowns/hubspot#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Dangling @id reference "https://nebulacomponents.com/#founder" not defined in site graph

- Subject: `https://nebulacomponents.com/teardowns/mailchimp#founder`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - property "founder" references @id: https://nebulacomponents.com/#founder
  - no entity node with this @id is defined on the site
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-010 · Circular @id self-reference detected on https://nebulacomponents.com/#organization

- Subject: `https://nebulacomponents.com/teardowns/mailchimp#founder.worksFor`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:high
- Evidence:
  - node https://nebulacomponents.com/#organization references itself in property "worksFor"
- Remediation: Ensure all @id references point to defined entity nodes on the site, and resolve circular reference loops.
- Verify: All referenced @id targets exist in the graph and graph references are acyclic. (rerun `SCHEMA-010`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/teardowns#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/repair-sprint#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/pricing#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/learning-centre#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/blog#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/about#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/audit?utm_source=site-nav&utm_medium=internal#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/research/landing-page-performance-q3-2026#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/resources/citable#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/teardowns/knallhart#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/teardowns/postmint#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/teardowns/basecamp#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/repair-sprint?utm_source=homepage&utm_medium=internal#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/audit?utm_source=homepage&utm_medium=internal#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/audit#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/benchmarks#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/case-studies#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/compare#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/ecommerce-landing-page-audit#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/saas-landing-page-audit#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/mobile-landing-page-audit#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/lead-generation-landing-page-audit#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/landing-page-cta-audit#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/landing-page-message-match#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/why-is-my-landing-page-not-converting#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/ads-getting-clicks-but-no-sales#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/what-is-landing-page-audit#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/best-landing-page-audit-tools#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/playbooks#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/press#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/brand#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/editorial-standards#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/audit?utm_source=footer&utm_medium=internal#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/privacy-policy#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/terms#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/data-rights#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/audit?utm_source=teardowns-hero&utm_medium=hero-cta#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/teardowns/carrd#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/teardowns/hotjar#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/teardowns/kit#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/teardowns/beehiiv#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/teardowns/unbounce#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/teardowns/webflow#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/teardowns/framer#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/teardowns/notion#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/teardowns/calendly#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/teardowns/hubspot#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### HIGH · SCHEMA-015 · Circular self-reference detected in schema graph: property "founder.worksFor" references parent @id (https://nebulacomponents.com/#organization)

- Subject: `https://nebulacomponents.com/teardowns/mailchimp#https://nebulacomponents.com/#organization`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:high, representation:high
- Evidence:
  - node @id: https://nebulacomponents.com/#organization
  - cyclic property: founder.worksFor
  - search engines fail graph parsing when structured data nodes reference themselves circularly
- Remediation: Remove self-referential @id links and ensure parent/child entity relationships form a directed acyclic graph.
- Verify: Validate JSON-LD graph to ensure no entity points to its own @id. (rerun `SCHEMA-015`)

### MEDIUM · TECH-019 · Open Graph URL (https://nebulacomponents.com) disagrees with rel=canonical (https://nebulacomponents.com/teardowns)

- Subject: `https://nebulacomponents.com/teardowns`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:low, ranking:medium, citation:medium
- Evidence:
  - rel=canonical: https://nebulacomponents.com/teardowns
  - og:url: https://nebulacomponents.com
- Remediation: Align og:url with the rel=canonical target on the index-target document, or omit og:url if self-canonicalizing.
- Verify: Compare og:url and rel=canonical in rendered HTML. (rerun `TECH-019`)

### MEDIUM · TECH-019 · Open Graph URL (https://nebulacomponents.com) disagrees with rel=canonical (https://nebulacomponents.com/repair-sprint)

- Subject: `https://nebulacomponents.com/repair-sprint`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:low, ranking:medium, citation:medium
- Evidence:
  - rel=canonical: https://nebulacomponents.com/repair-sprint
  - og:url: https://nebulacomponents.com
- Remediation: Align og:url with the rel=canonical target on the index-target document, or omit og:url if self-canonicalizing.
- Verify: Compare og:url and rel=canonical in rendered HTML. (rerun `TECH-019`)

### MEDIUM · TECH-019 · Open Graph URL (https://nebulacomponents.com) disagrees with rel=canonical (https://nebulacomponents.com/learning-centre)

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:low, ranking:medium, citation:medium
- Evidence:
  - rel=canonical: https://nebulacomponents.com/learning-centre
  - og:url: https://nebulacomponents.com
- Remediation: Align og:url with the rel=canonical target on the index-target document, or omit og:url if self-canonicalizing.
- Verify: Compare og:url and rel=canonical in rendered HTML. (rerun `TECH-019`)

### MEDIUM · TECH-019 · Open Graph URL (https://nebulacomponents.com) disagrees with rel=canonical (https://nebulacomponents.com/blog)

- Subject: `https://nebulacomponents.com/blog`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:low, ranking:medium, citation:medium
- Evidence:
  - rel=canonical: https://nebulacomponents.com/blog
  - og:url: https://nebulacomponents.com
- Remediation: Align og:url with the rel=canonical target on the index-target document, or omit og:url if self-canonicalizing.
- Verify: Compare og:url and rel=canonical in rendered HTML. (rerun `TECH-019`)

### MEDIUM · TECH-019 · Open Graph URL (https://nebulacomponents.com) disagrees with rel=canonical (https://nebulacomponents.com/about)

- Subject: `https://nebulacomponents.com/about`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:low, ranking:medium, citation:medium
- Evidence:
  - rel=canonical: https://nebulacomponents.com/about
  - og:url: https://nebulacomponents.com
- Remediation: Align og:url with the rel=canonical target on the index-target document, or omit og:url if self-canonicalizing.
- Verify: Compare og:url and rel=canonical in rendered HTML. (rerun `TECH-019`)

### MEDIUM · TECH-019 · Open Graph URL (https://nebulacomponents.com) disagrees with rel=canonical (https://nebulacomponents.com/research/landing-page-performance-q3-2026)

- Subject: `https://nebulacomponents.com/research/landing-page-performance-q3-2026`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:low, ranking:medium, citation:medium
- Evidence:
  - rel=canonical: https://nebulacomponents.com/research/landing-page-performance-q3-2026
  - og:url: https://nebulacomponents.com
- Remediation: Align og:url with the rel=canonical target on the index-target document, or omit og:url if self-canonicalizing.
- Verify: Compare og:url and rel=canonical in rendered HTML. (rerun `TECH-019`)

### MEDIUM · TECH-019 · Open Graph URL (https://nebulacomponents.com) disagrees with rel=canonical (https://nebulacomponents.com/repair-sprint)

- Subject: `https://nebulacomponents.com/repair-sprint?utm_source=homepage&utm_medium=internal`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:low, ranking:medium, citation:medium
- Evidence:
  - rel=canonical: https://nebulacomponents.com/repair-sprint
  - og:url: https://nebulacomponents.com
- Remediation: Align og:url with the rel=canonical target on the index-target document, or omit og:url if self-canonicalizing.
- Verify: Compare og:url and rel=canonical in rendered HTML. (rerun `TECH-019`)

### MEDIUM · TECH-019 · Open Graph URL (https://nebulacomponents.com) disagrees with rel=canonical (https://nebulacomponents.com/benchmarks)

- Subject: `https://nebulacomponents.com/benchmarks`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:low, ranking:medium, citation:medium
- Evidence:
  - rel=canonical: https://nebulacomponents.com/benchmarks
  - og:url: https://nebulacomponents.com
- Remediation: Align og:url with the rel=canonical target on the index-target document, or omit og:url if self-canonicalizing.
- Verify: Compare og:url and rel=canonical in rendered HTML. (rerun `TECH-019`)

### MEDIUM · TECH-019 · Open Graph URL (https://nebulacomponents.com) disagrees with rel=canonical (https://nebulacomponents.com/case-studies)

- Subject: `https://nebulacomponents.com/case-studies`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:low, ranking:medium, citation:medium
- Evidence:
  - rel=canonical: https://nebulacomponents.com/case-studies
  - og:url: https://nebulacomponents.com
- Remediation: Align og:url with the rel=canonical target on the index-target document, or omit og:url if self-canonicalizing.
- Verify: Compare og:url and rel=canonical in rendered HTML. (rerun `TECH-019`)

### MEDIUM · TECH-019 · Open Graph URL (https://nebulacomponents.com) disagrees with rel=canonical (https://nebulacomponents.com/ecommerce-landing-page-audit)

- Subject: `https://nebulacomponents.com/ecommerce-landing-page-audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:low, ranking:medium, citation:medium
- Evidence:
  - rel=canonical: https://nebulacomponents.com/ecommerce-landing-page-audit
  - og:url: https://nebulacomponents.com
- Remediation: Align og:url with the rel=canonical target on the index-target document, or omit og:url if self-canonicalizing.
- Verify: Compare og:url and rel=canonical in rendered HTML. (rerun `TECH-019`)

### MEDIUM · TECH-019 · Open Graph URL (https://nebulacomponents.com) disagrees with rel=canonical (https://nebulacomponents.com/what-is-landing-page-audit)

- Subject: `https://nebulacomponents.com/what-is-landing-page-audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:low, ranking:medium, citation:medium
- Evidence:
  - rel=canonical: https://nebulacomponents.com/what-is-landing-page-audit
  - og:url: https://nebulacomponents.com
- Remediation: Align og:url with the rel=canonical target on the index-target document, or omit og:url if self-canonicalizing.
- Verify: Compare og:url and rel=canonical in rendered HTML. (rerun `TECH-019`)

### MEDIUM · TECH-019 · Open Graph URL (https://nebulacomponents.com) disagrees with rel=canonical (https://nebulacomponents.com/playbooks)

- Subject: `https://nebulacomponents.com/playbooks`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:low, ranking:medium, citation:medium
- Evidence:
  - rel=canonical: https://nebulacomponents.com/playbooks
  - og:url: https://nebulacomponents.com
- Remediation: Align og:url with the rel=canonical target on the index-target document, or omit og:url if self-canonicalizing.
- Verify: Compare og:url and rel=canonical in rendered HTML. (rerun `TECH-019`)

### MEDIUM · TECH-019 · Open Graph URL (https://nebulacomponents.com) disagrees with rel=canonical (https://nebulacomponents.com/brand)

- Subject: `https://nebulacomponents.com/brand`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:low, ranking:medium, citation:medium
- Evidence:
  - rel=canonical: https://nebulacomponents.com/brand
  - og:url: https://nebulacomponents.com
- Remediation: Align og:url with the rel=canonical target on the index-target document, or omit og:url if self-canonicalizing.
- Verify: Compare og:url and rel=canonical in rendered HTML. (rerun `TECH-019`)

### MEDIUM · TECH-019 · Open Graph URL (https://nebulacomponents.com) disagrees with rel=canonical (https://nebulacomponents.com/editorial-standards)

- Subject: `https://nebulacomponents.com/editorial-standards`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:low, ranking:medium, citation:medium
- Evidence:
  - rel=canonical: https://nebulacomponents.com/editorial-standards
  - og:url: https://nebulacomponents.com
- Remediation: Align og:url with the rel=canonical target on the index-target document, or omit og:url if self-canonicalizing.
- Verify: Compare og:url and rel=canonical in rendered HTML. (rerun `TECH-019`)

### MEDIUM · TECH-019 · Open Graph URL (https://nebulacomponents.com) disagrees with rel=canonical (https://nebulacomponents.com/privacy-policy)

- Subject: `https://nebulacomponents.com/privacy-policy`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:low, ranking:medium, citation:medium
- Evidence:
  - rel=canonical: https://nebulacomponents.com/privacy-policy
  - og:url: https://nebulacomponents.com
- Remediation: Align og:url with the rel=canonical target on the index-target document, or omit og:url if self-canonicalizing.
- Verify: Compare og:url and rel=canonical in rendered HTML. (rerun `TECH-019`)

### MEDIUM · TECH-019 · Open Graph URL (https://nebulacomponents.com) disagrees with rel=canonical (https://nebulacomponents.com/terms)

- Subject: `https://nebulacomponents.com/terms`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:low, ranking:medium, citation:medium
- Evidence:
  - rel=canonical: https://nebulacomponents.com/terms
  - og:url: https://nebulacomponents.com
- Remediation: Align og:url with the rel=canonical target on the index-target document, or omit og:url if self-canonicalizing.
- Verify: Compare og:url and rel=canonical in rendered HTML. (rerun `TECH-019`)

### MEDIUM · TECH-019 · Open Graph URL (https://nebulacomponents.com) disagrees with rel=canonical (https://nebulacomponents.com/data-rights)

- Subject: `https://nebulacomponents.com/data-rights`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:low, ranking:medium, citation:medium
- Evidence:
  - rel=canonical: https://nebulacomponents.com/data-rights
  - og:url: https://nebulacomponents.com
- Remediation: Align og:url with the rel=canonical target on the index-target document, or omit og:url if self-canonicalizing.
- Verify: Compare og:url and rel=canonical in rendered HTML. (rerun `TECH-019`)

### MEDIUM · CRAWL-004 · robots.txt has 17 parse problem(s)

- Subject: `https://nebulacomponents.com/robots.txt`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium
- Evidence:
  - line 12: unknown directive "Content-Signal"
  - line 16: unknown directive "Content-Signal"
  - line 20: unknown directive "Content-Signal"
  - line 24: unknown directive "Content-Signal"
  - line 28: unknown directive "Content-Signal"
  - line 34: unknown directive "Content-Signal"
  - line 39: unknown directive "Content-Signal"
  - line 44: unknown directive "Content-Signal"
  - line 49: unknown directive "Content-Signal"
  - line 54: unknown directive "Content-Signal"
- Remediation: Fix the malformed lines; regenerate robots.txt from the crawler policy registry.
- Verify: Re-parse robots.txt and confirm zero errors. (rerun `CRAWL-004`)

### MEDIUM · PAGE-002 · 2 pages share the title "Landing Page Audit for Paid Traffic Not Converting | Nebula"

- Subject: `title:Landing Page Audit for Paid Traffic Not Converting | Nebula`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: ranking:medium
- Evidence:
  - https://nebulacomponents.com/
  - https://nebulacomponents.com/
- Remediation: Differentiate titles to reflect each page’s distinct intent.
- Verify: Confirm title uniqueness across index targets. (rerun `PAGE-002`)

### MEDIUM · PAGE-002 · 2 pages share the title "Repair Sprint - One Page, One Condition, One Fix | Nebula"

- Subject: `title:Repair Sprint - One Page, One Condition, One Fix | Nebula`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: ranking:medium
- Evidence:
  - https://nebulacomponents.com/repair-sprint
  - https://nebulacomponents.com/repair-sprint?utm_source=homepage&utm_medium=internal
- Remediation: Differentiate titles to reflect each page’s distinct intent.
- Verify: Confirm title uniqueness across index targets. (rerun `PAGE-002`)

### MEDIUM · PAGE-002 · 5 pages share the title "Free Landing Page Audit: Find Conversion Friction | Nebula"

- Subject: `title:Free Landing Page Audit: Find Conversion Friction | Nebula`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: ranking:medium
- Evidence:
  - https://nebulacomponents.com/audit?utm_source=site-nav&utm_medium=internal
  - https://nebulacomponents.com/audit?utm_source=homepage&utm_medium=internal
  - https://nebulacomponents.com/audit
  - https://nebulacomponents.com/audit?utm_source=footer&utm_medium=internal
  - https://nebulacomponents.com/audit?utm_source=teardowns-hero&utm_medium=hero-cta
- Remediation: Differentiate titles to reflect each page’s distinct intent.
- Verify: Confirm title uniqueness across index targets. (rerun `PAGE-002`)

### MEDIUM · PAGE-008 · Index-target page has only ~104 words (threshold 120)

- Subject: `https://nebulacomponents.com/blog`
- Type: probabilistic_inference; confidence: high; deterministic: false
- Impact: ranking:medium, citation:medium
- Evidence:
  - extracted word count: 104
- Remediation: Either add substantive content for the intent or remove the page from the index target set.
- Verify: Re-measure extracted word count after revision. (rerun `PAGE-008`)
- Limitations: heuristic detection; verify manually before acting

### MEDIUM · PAGE-008 · Index-target page has only ~114 words (threshold 120)

- Subject: `https://nebulacomponents.com/playbooks`
- Type: probabilistic_inference; confidence: high; deterministic: false
- Impact: ranking:medium, citation:medium
- Evidence:
  - extracted word count: 114
- Remediation: Either add substantive content for the intent or remove the page from the index target set.
- Verify: Re-measure extracted word count after revision. (rerun `PAGE-008`)
- Limitations: heuristic detection; verify manually before acting

### MEDIUM · PAGE-009 · Term "page" is 8.4% of page words (38 occurrences)

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: probabilistic_inference; confidence: medium; deterministic: false
- Impact: ranking:medium, reputational:low
- Evidence:
  - density 8.4% exceeds 8% threshold
- Remediation: Rewrite for human comprehension; vary phrasing naturally; do not chase term-frequency quotas.
- Verify: Re-measure dominant-term density. (rerun `PAGE-009`)
- Limitations: heuristic detection; verify manually before acting

### MEDIUM · ANS-011 · Question section "What This Demonstrates" lacks a concise direct answer lead (opening paragraph is 136 words)

- Subject: `https://nebulacomponents.com/teardowns/mailchimp`
- Type: probabilistic_inference; confidence: medium; deterministic: false
- Impact: citation:medium, representation:low
- Evidence:
  - heading: "What This Demonstrates"
  - opening: "Mailchimp (an Intuit company) is one of the most recognizable marketing brands in the world. The engine scores the page 7.2/B: strong trust signals, a..."
  - word_count: 136
- Remediation: Provide a concise 30–70 word direct declarative answer immediately following the question heading before elaborating with background details.
- Verify: Re-inspect question sections to verify the first paragraph delivers a direct factual answer. (rerun `ANS-011`)
- Limitations: heuristic detection; verify manually before acting

### MEDIUM · ANS-012 · Ungrounded quantitative metric "32% increase" in answer prose lacks citation or evidence attribution

- Subject: `https://nebulacomponents.com/ads-getting-clicks-but-no-sales`
- Type: probabilistic_inference; confidence: medium; deterministic: false
- Impact: citation:medium, legal:low
- Evidence:
  - metric: "32% increase"
  - passage: "Largest Contentful Paint (LCP) above 3 seconds correlates with a 32% increase in bounce rate relative to a 1-second LCP baseline (Google, 2018 - the a..."
- Remediation: Attach an adjacent citation, benchmark link, methodology note, or registered evidence ID near the metric.
- Verify: Confirm every statistical or multiple claim has adjacent attribution or registered evidence. (rerun `ANS-012`)
- Limitations: heuristic detection; verify manually before acting

### MEDIUM · ENTITY-003 · Entity "one-leak repair sprint" uses 2 different @id values

- Subject: `Service|one-leak repair sprint`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium
- Evidence:
  - @id: https://nebulacomponents.com/repair-sprint#service
  - @id: https://nebulacomponents.com/pricing#fix-pack
- Remediation: Emit one stable @id per entity from shared data, referenced everywhere.
- Verify: Collect @id values per entity name; each name maps to one @id. (rerun `ENTITY-003`)

### MEDIUM · CLAIM-007 · Superlative "the fastest" with no registered comparative claim for this page

- Subject: `https://nebulacomponents.com/case-studies`
- Type: probabilistic_inference; confidence: high; deterministic: false
- Impact: legal:medium, reputational:medium, citation:low
- Evidence:
  - matched: "the fastest"
  - no comparative claim lists this page as a publication surface
- Remediation: Remove the superlative, or register a comparative claim with a defined comparison set and evidence.
- Verify: Superlatives on the page map to registered, evidenced comparative claims. (rerun `CLAIM-007`)
- Limitations: heuristic detection; verify manually before acting

### MEDIUM · CLAIM-007 · Superlative "The fastest" with no registered comparative claim for this page

- Subject: `https://nebulacomponents.com/saas-landing-page-audit`
- Type: probabilistic_inference; confidence: high; deterministic: false
- Impact: legal:medium, reputational:medium, citation:low
- Evidence:
  - matched: "The fastest"
  - no comparative claim lists this page as a publication surface
- Remediation: Remove the superlative, or register a comparative claim with a defined comparison set and evidence.
- Verify: Superlatives on the page map to registered, evidenced comparative claims. (rerun `CLAIM-007`)
- Limitations: heuristic detection; verify manually before acting

### MEDIUM · CLAIM-007 · Superlative "the best" with no registered comparative claim for this page

- Subject: `https://nebulacomponents.com/best-landing-page-audit-tools`
- Type: probabilistic_inference; confidence: high; deterministic: false
- Impact: legal:medium, reputational:medium, citation:low
- Evidence:
  - matched: "the best"
  - no comparative claim lists this page as a publication surface
- Remediation: Remove the superlative, or register a comparative claim with a defined comparison set and evidence.
- Verify: Superlatives on the page map to registered, evidenced comparative claims. (rerun `CLAIM-007`)
- Limitations: heuristic detection; verify manually before acting

### MEDIUM · CLAIM-007 · Superlative "the top" with no registered comparative claim for this page

- Subject: `https://nebulacomponents.com/editorial-standards`
- Type: probabilistic_inference; confidence: high; deterministic: false
- Impact: legal:medium, reputational:medium, citation:low
- Evidence:
  - matched: "the top"
  - no comparative claim lists this page as a publication surface
- Remediation: Remove the superlative, or register a comparative claim with a defined comparison set and evidence.
- Verify: Superlatives on the page map to registered, evidenced comparative claims. (rerun `CLAIM-007`)
- Limitations: heuristic detection; verify manually before acting

### MEDIUM · CLAIM-007 · Superlative "The most powerful" with no registered comparative claim for this page

- Subject: `https://nebulacomponents.com/teardowns/unbounce`
- Type: probabilistic_inference; confidence: high; deterministic: false
- Impact: legal:medium, reputational:medium, citation:low
- Evidence:
  - matched: "The most powerful"
  - no comparative claim lists this page as a publication surface
- Remediation: Remove the superlative, or register a comparative claim with a defined comparison set and evidence.
- Verify: Superlatives on the page map to registered, evidenced comparative claims. (rerun `CLAIM-007`)
- Limitations: heuristic detection; verify manually before acting

### MEDIUM · CLAIM-007 · Superlative "the top" with no registered comparative claim for this page

- Subject: `https://nebulacomponents.com/teardowns/hubspot`
- Type: probabilistic_inference; confidence: high; deterministic: false
- Impact: legal:medium, reputational:medium, citation:low
- Evidence:
  - matched: "the top"
  - no comparative claim lists this page as a publication surface
- Remediation: Remove the superlative, or register a comparative claim with a defined comparison set and evidence.
- Verify: Superlatives on the page map to registered, evidenced comparative claims. (rerun `CLAIM-007`)
- Limitations: heuristic detection; verify manually before acting

### MEDIUM · CLAIM-007 · Superlative "the top" with no registered comparative claim for this page

- Subject: `https://nebulacomponents.com/teardowns/mailchimp`
- Type: probabilistic_inference; confidence: high; deterministic: false
- Impact: legal:medium, reputational:medium, citation:low
- Evidence:
  - matched: "the top"
  - no comparative claim lists this page as a publication surface
- Remediation: Remove the superlative, or register a comparative claim with a defined comparison set and evidence.
- Verify: Superlatives on the page map to registered, evidenced comparative claims. (rerun `CLAIM-007`)
- Limitations: heuristic detection; verify manually before acting

### MEDIUM · SCHEMA-002 · Schema headline "Nebula Components: Free Landing Page Audit" does not match visible title or H1

- Subject: `https://nebulacomponents.com/#WebPage`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium
- Evidence:
  - schema headline: Nebula Components: Free Landing Page Audit
  - visible title: Landing Page Audit for Paid Traffic Not Converting | Nebula
  - H1: You paid for the click.Your page lost the sale.
- Remediation: Generate the headline from the same authoritative field that renders the visible title.
- Verify: Schema headline equals visible title or H1. (rerun `SCHEMA-002`)

### MEDIUM · SCHEMA-002 · Schema headline "Nebula Components: Free Landing Page Audit" does not match visible title or H1

- Subject: `https://nebulacomponents.com/#WebPage`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium
- Evidence:
  - schema headline: Nebula Components: Free Landing Page Audit
  - visible title: Landing Page Audit for Paid Traffic Not Converting | Nebula
  - H1: You paid for the click.Your page lost the sale.
- Remediation: Generate the headline from the same authoritative field that renders the visible title.
- Verify: Schema headline equals visible title or H1. (rerun `SCHEMA-002`)

### MEDIUM · SCHEMA-002 · Schema headline "SaaS Landing Page Audit: Demo Friction, ICP Clarity & Trial Conversion" does not match visible title or H1

- Subject: `https://nebulacomponents.com/saas-landing-page-audit#Article`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium
- Evidence:
  - schema headline: SaaS Landing Page Audit: Demo Friction, ICP Clarity & Trial Conversion
  - visible title: SaaS Landing Page Audit: Fix Trial & Demo Leaks | Nebula
  - H1: Run a Free SaaS Landing Page Audit to Boost Demo Conversions
- Remediation: Generate the headline from the same authoritative field that renders the visible title.
- Verify: Schema headline equals visible title or H1. (rerun `SCHEMA-002`)

### MEDIUM · SCHEMA-002 · Schema headline "Mobile Landing Page Audit: CTA Visibility, 44px Tap Targets & Viewport Failures for Meta and TikTok Traffic" does not match visible title or H1

- Subject: `https://nebulacomponents.com/mobile-landing-page-audit#Article`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium
- Evidence:
  - schema headline: Mobile Landing Page Audit: CTA Visibility, 44px Tap Targets & Viewport Failures for Meta and TikTok Traffic
  - visible title: Mobile Landing Page Audit: Fix Mobile Ad Leaks | Nebula
  - H1: Run a Free Mobile Landing Page Audit to Stop Wasted Ad Spend
- Remediation: Generate the headline from the same authoritative field that renders the visible title.
- Verify: Schema headline equals visible title or H1. (rerun `SCHEMA-002`)

### MEDIUM · SCHEMA-002 · Schema headline "Lead Generation Landing Page Audit: Form Field Count, CTA Labels & Post-Submit Clarity" does not match visible title or H1

- Subject: `https://nebulacomponents.com/lead-generation-landing-page-audit#Article`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium
- Evidence:
  - schema headline: Lead Generation Landing Page Audit: Form Field Count, CTA Labels & Post-Submit Clarity
  - visible title: Lead Gen Landing Page Audit: Fix Form & CTA Leaks | Nebula
  - H1: Run a Free Lead Gen Landing Page Audit to Boost Inbound CVR
- Remediation: Generate the headline from the same authoritative field that renders the visible title.
- Verify: Schema headline equals visible title or H1. (rerun `SCHEMA-002`)

### MEDIUM · SCHEMA-002 · Schema headline "Landing Page CTA Audit: Label Clarity, Placement, Contrast & Hierarchy" does not match visible title or H1

- Subject: `https://nebulacomponents.com/landing-page-cta-audit#Article`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium
- Evidence:
  - schema headline: Landing Page CTA Audit: Label Clarity, Placement, Contrast & Hierarchy
  - visible title: Landing Page CTA Audit: Placement & Contrast Guide | Nebula
  - H1: Fix Landing Page CTA Leaks to Boost Conversion Rates
- Remediation: Generate the headline from the same authoritative field that renders the visible title.
- Verify: Schema headline equals visible title or H1. (rerun `SCHEMA-002`)

### MEDIUM · SCHEMA-002 · Schema headline "Landing Page Message Match: Ad-to-Page Alignment and Quality Score" does not match visible title or H1

- Subject: `https://nebulacomponents.com/landing-page-message-match#Article`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium
- Evidence:
  - schema headline: Landing Page Message Match: Ad-to-Page Alignment and Quality Score
  - visible title: Landing Page Message Match: Boost Ad Quality Score | Nebula
  - H1: Improve Message Match to Boost Paid Traffic Conversions
- Remediation: Generate the headline from the same authoritative field that renders the visible title.
- Verify: Schema headline equals visible title or H1. (rerun `SCHEMA-002`)

### MEDIUM · SCHEMA-002 · Schema headline "Why Is My Landing Page Not Converting? 12 Root Causes" does not match visible title or H1

- Subject: `https://nebulacomponents.com/why-is-my-landing-page-not-converting#Article`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium
- Evidence:
  - schema headline: Why Is My Landing Page Not Converting? 12 Root Causes
  - visible title: Why Is My Landing Page Not Converting? 12 Causes | Nebula
  - H1: Discover Why Your Landing Page Is Not Converting Paid Traffic
- Remediation: Generate the headline from the same authoritative field that renders the visible title.
- Verify: Schema headline equals visible title or H1. (rerun `SCHEMA-002`)

### MEDIUM · SCHEMA-002 · Schema headline "Ads Getting Clicks But No Sales: Diagnosing Post-Click Abandonment" does not match visible title or H1

- Subject: `https://nebulacomponents.com/ads-getting-clicks-but-no-sales#Article`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium
- Evidence:
  - schema headline: Ads Getting Clicks But No Sales: Diagnosing Post-Click Abandonment
  - visible title: Ads Getting Clicks But No Sales? Post-Click Audit | Nebula
  - H1: Fix Landing Page Leaks When Ads Get Clicks but No Sales
- Remediation: Generate the headline from the same authoritative field that renders the visible title.
- Verify: Schema headline equals visible title or H1. (rerun `SCHEMA-002`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/cloudwise

- Subject: `https://nebulacomponents.com/teardowns`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/cloudwise (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/postdew

- Subject: `https://nebulacomponents.com/teardowns`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/postdew (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/smartwatermark

- Subject: `https://nebulacomponents.com/teardowns`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/smartwatermark (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/folioverse

- Subject: `https://nebulacomponents.com/teardowns`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/folioverse (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/asana

- Subject: `https://nebulacomponents.com/teardowns`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/asana (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/canva

- Subject: `https://nebulacomponents.com/teardowns`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/canva (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/figma

- Subject: `https://nebulacomponents.com/teardowns`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/figma (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/intercom

- Subject: `https://nebulacomponents.com/teardowns`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/intercom (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/monday

- Subject: `https://nebulacomponents.com/teardowns`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/monday (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/shopify

- Subject: `https://nebulacomponents.com/teardowns`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/shopify (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/slack

- Subject: `https://nebulacomponents.com/teardowns`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/slack (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/squarespace

- Subject: `https://nebulacomponents.com/teardowns`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/squarespace (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/typeform

- Subject: `https://nebulacomponents.com/teardowns`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/typeform (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/zapier

- Subject: `https://nebulacomponents.com/teardowns`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/zapier (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/linear

- Subject: `https://nebulacomponents.com/teardowns`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/linear (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/loom

- Subject: `https://nebulacomponents.com/teardowns`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/loom (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/miro

- Subject: `https://nebulacomponents.com/teardowns`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/miro (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/clickup

- Subject: `https://nebulacomponents.com/teardowns`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/clickup (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/airtable

- Subject: `https://nebulacomponents.com/teardowns`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/airtable (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/pipedrive

- Subject: `https://nebulacomponents.com/teardowns`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/pipedrive (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/mixpanel

- Subject: `https://nebulacomponents.com/teardowns`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/mixpanel (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/amplitude

- Subject: `https://nebulacomponents.com/teardowns`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/amplitude (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/drift

- Subject: `https://nebulacomponents.com/teardowns`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/drift (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?from=%2Fteardowns

- Subject: `https://nebulacomponents.com/teardowns`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Find the Leak →" → https://nebulacomponents.com/audit?from=%2Fteardowns (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/checkout

- Subject: `https://nebulacomponents.com/repair-sprint`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get $97 Repair Sprint →" → https://nebulacomponents.com/checkout (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=repair-sprint&utm_medium=internal

- Subject: `https://nebulacomponents.com/repair-sprint`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Run free audit first" → https://nebulacomponents.com/audit?utm_source=repair-sprint&utm_medium=internal (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/repair-sprint/example

- Subject: `https://nebulacomponents.com/repair-sprint`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "See example artifact" → https://nebulacomponents.com/repair-sprint/example (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/checkout

- Subject: `https://nebulacomponents.com/pricing`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get the exact repair →" → https://nebulacomponents.com/checkout (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=pricing&utm_medium=internal

- Subject: `https://nebulacomponents.com/pricing`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Run free audit" → https://nebulacomponents.com/audit?utm_source=pricing&utm_medium=internal (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=learning-centre&utm_medium=organic-content

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Run the free audit" → https://nebulacomponents.com/audit?utm_source=learning-centre&utm_medium=organic-content (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/paid-traffic-leak-map

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Open leak map" → https://nebulacomponents.com/learning-centre/paid-traffic-leak-map (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/above-fold-landing-page

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Above The Fold: The 3-Second Window That Determines If Paid Traffic Converts" → https://nebulacomponents.com/learning-centre/above-fold-landing-page (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/confessions

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Founder Confessions: When We Found Our Page Was Broken" → https://nebulacomponents.com/learning-centre/confessions (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/landing-page-bounce-rate-high

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Landing Page Bounce Rate High? It's Usually 3 Things" → https://nebulacomponents.com/learning-centre/landing-page-bounce-rate-high (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/landing-page-load-time-slow

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Landing Page Load Time Slow? Every Second Costs Conversions" → https://nebulacomponents.com/learning-centre/landing-page-load-time-slow (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/landing-page-not-converting

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Landing Page Not Converting? Diagnose These 5 Leaks First" → https://nebulacomponents.com/learning-centre/landing-page-not-converting (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/google-ads-clicks-no-sales

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Google Ads Clicks But No Sales: Check The Page Before Budget" → https://nebulacomponents.com/learning-centre/google-ads-clicks-no-sales (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/google-ads-disapproved-ads-still-spending

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Google Ads Disapproved? Your Page May Be The Hidden Reason" → https://nebulacomponents.com/learning-centre/google-ads-disapproved-ads-still-spending (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/google-ads-high-ctr-low-conversion

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Your Google Ads CTR Is 8% But Conversion Rate Is 0.1% - The Landing Page Disconnect Audit | Nebula" → https://nebulacomponents.com/learning-centre/google-ads-high-ctr-low-conversion (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/google-ads-quality-score-low

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Google Ads Quality Score Low? Fix The Page Before The Account" → https://nebulacomponents.com/learning-centre/google-ads-quality-score-low (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/facebook-ads-no-leads

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Facebook Ads Getting Clicks But No Leads: The Page Broke The Chain" → https://nebulacomponents.com/learning-centre/facebook-ads-no-leads (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/meta-ads-high-frequency-not-converting

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Meta Ads High Frequency? The Page May Be Burning Budget" → https://nebulacomponents.com/learning-centre/meta-ads-high-frequency-not-converting (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/retargeting-ads-not-converting

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Retargeting Ads Not Converting? The First Page Failed Them" → https://nebulacomponents.com/learning-centre/retargeting-ads-not-converting (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/tiktok-ads-not-converting

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "TikTok Ads Getting Views But No Sales: The Landing Page Disconnect" → https://nebulacomponents.com/learning-centre/tiktok-ads-not-converting (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/tiktok-landing-page-scroll-speed-gap

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "TikTok to Landing Page: The Scroll-Speed Gap That Burns Your Ad Budget" → https://nebulacomponents.com/learning-centre/tiktok-landing-page-scroll-speed-gap (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/tiktok-trust-collapse

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "The TikTok Trust Collapse: When Gen Z Buyers Hit a Page That Looks Like 2019 | Nebula" → https://nebulacomponents.com/learning-centre/tiktok-trust-collapse (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/linkedin-ad-copy-landing-page-mismatch

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Why Your LinkedIn Ad Does the Job and Your Landing Page Undoes It | Nebula" → https://nebulacomponents.com/learning-centre/linkedin-ad-copy-landing-page-mismatch (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/linkedin-ads-not-converting

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "LinkedIn Ads Getting Clicks But No Conversions: The Page Is Usually Why" → https://nebulacomponents.com/learning-centre/linkedin-ads-not-converting (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/linkedin-authority-gap

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "The LinkedIn-to-Page Authority Gap | Nebula Learning Centre" → https://nebulacomponents.com/learning-centre/linkedin-authority-gap (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/cpc-break-even-landing-page

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "What a $50 CPC Actually Needs to Look Like on a Landing Page to Break Even | Nebula" → https://nebulacomponents.com/learning-centre/cpc-break-even-landing-page (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/high-cpc-low-conversion

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "High CPC, Low Conversion: Stop Optimizing The Wrong Layer" → https://nebulacomponents.com/learning-centre/high-cpc-low-conversion (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/landing-page-conversion-rate-benchmark

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "What Is A Good Landing Page Conversion Rate? The Benchmark By Traffic Source" → https://nebulacomponents.com/learning-centre/landing-page-conversion-rate-benchmark (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/before-you-raise-ad-budget

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Before You Raise Ad Budget, Run This Leak Check" → https://nebulacomponents.com/learning-centre/before-you-raise-ad-budget (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/the-11pm-founder-spiral

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "The 11pm Founder Spiral | Nebula Learning Centre" → https://nebulacomponents.com/learning-centre/the-11pm-founder-spiral (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/cta-not-working

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "CTA Not Working? Fix Commitment, Clarity, And Timing" → https://nebulacomponents.com/learning-centre/cta-not-working (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/cta-not-working-7-fixes

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "CTA Not Working? 7 Fixes That Actually Convert" → https://nebulacomponents.com/learning-centre/cta-not-working-7-fixes (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/ad-says-one-thing-page-says-another

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Your Ad Says One Thing and Your Page Says Something Else: The Invisible Conversion Killer" → https://nebulacomponents.com/learning-centre/ad-says-one-thing-page-says-another (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/headline-cta-mismatch

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Your Headline Promises One Thing. Your CTA Asks for Something Else. Here's the Receipt." → https://nebulacomponents.com/learning-centre/headline-cta-mismatch (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/headline-fails-message-match

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Why Your Landing Page Headline Fails Message Match (And How to Fix It)" → https://nebulacomponents.com/learning-centre/headline-fails-message-match (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/landing-page-headline-formula

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Landing Page Headline Formula: Write H1s That Convert Paid Traffic" → https://nebulacomponents.com/learning-centre/landing-page-headline-formula (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/message-match-checklist

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Message Match Checklist For Paid Traffic Landing Pages" → https://nebulacomponents.com/learning-centre/message-match-checklist (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/what-is-message-match

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "What Is Message Match? Landing Page to Ad Alignment Explained" → https://nebulacomponents.com/learning-centre/what-is-message-match (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/proof-before-cta

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Proof Before CTA: The Simple Fix Most Landing Pages Miss" → https://nebulacomponents.com/learning-centre/proof-before-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/social-proof-backfire

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Social Proof Backfire: The 4 Testimonial Configurations That Hurt Conversion | Nebula" → https://nebulacomponents.com/learning-centre/social-proof-backfire (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/social-proof-above-fold

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Social Proof Above the Fold: Why Placement Beats Volume on Landing Pages" → https://nebulacomponents.com/learning-centre/social-proof-above-fold (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/types-of-social-proof

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Types of Social Proof for Landing Pages: Which Work and Which Backfire" → https://nebulacomponents.com/learning-centre/types-of-social-proof (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/what-is-social-proof-landing-page

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Social Proof on a Landing Page: What It Is and Why It Drives Conversions" → https://nebulacomponents.com/learning-centre/what-is-social-proof-landing-page (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/landing-page-lcp

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "LCP on Landing Pages: What Largest Contentful Paint Means for Your Paid Traffic" → https://nebulacomponents.com/learning-centre/landing-page-lcp (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/landing-page-speed-test

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "How to Test Landing Page Speed (and What to Do With the Results)" → https://nebulacomponents.com/learning-centre/landing-page-speed-test (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/slow-landing-page-causes

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Why Is My Landing Page Slow? The 5 Most Common Causes and Fixes" → https://nebulacomponents.com/learning-centre/slow-landing-page-causes (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/form-has-zero-friction

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Your Form Has Zero Friction and That's Exactly Why Nobody Fills It Out | Nebula" → https://nebulacomponents.com/learning-centre/form-has-zero-friction (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/traffic-but-no-form-fills

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Traffic But No Form Fills: The Form Is Usually Not The First Leak" → https://nebulacomponents.com/learning-centre/traffic-but-no-form-fills (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/cta-below-fold-mobile

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Your CTA May Be Below the Fold on Smaller Phones | Nebula" → https://nebulacomponents.com/learning-centre/cta-below-fold-mobile (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/mobile-landing-page-leaks

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Mobile Landing Page Leaks That Kill Paid Traffic" → https://nebulacomponents.com/learning-centre/mobile-landing-page-leaks (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/b2b-saas-landing-page-not-converting

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "B2B SaaS Landing Page Not Converting? The Demo Ask Is Too Soon" → https://nebulacomponents.com/learning-centre/b2b-saas-landing-page-not-converting (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/coach-consultant-landing-page

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Coach Or Consultant Landing Page Not Converting? The Discovery Call Ask Is The Leak" → https://nebulacomponents.com/learning-centre/coach-consultant-landing-page (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/ecommerce-landing-page-not-converting

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Ecommerce Landing Page Not Converting? The Product Page Is A Leak" → https://nebulacomponents.com/learning-centre/ecommerce-landing-page-not-converting (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/pricing-page-not-converting

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Pricing Page Not Converting? The Tier Structure May Be Wrong" → https://nebulacomponents.com/learning-centre/pricing-page-not-converting (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/agency-handoff-debt

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Agency Handoff Debt: 7 Regressions That Kill Conversions" → https://nebulacomponents.com/learning-centre/agency-handoff-debt (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/ghost-variant-ab-test

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Ghost Variant: When A/B Test Winners Are False Positives" → https://nebulacomponents.com/learning-centre/ghost-variant-ab-test (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/landing-page-intelligence-stack

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Landing Page Intelligence Stack: 6 Evidence-Grade Workflows" → https://nebulacomponents.com/learning-centre/landing-page-intelligence-stack (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/topic-guides/ad-spend-roi-improvement

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Ad Spend ROI Improvement Starts With Page Diagnosis" → https://nebulacomponents.com/learning-centre/topic-guides/ad-spend-roi-improvement (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/topic-guides/ai-traffic-optimization-vs-landing-page-builders

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "AI Traffic Optimization vs Landing Page Builders" → https://nebulacomponents.com/learning-centre/topic-guides/ai-traffic-optimization-vs-landing-page-builders (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/topic-guides/conversion-rate-optimization-tools

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Conversion Rate Optimization Tools for Paid Traffic" → https://nebulacomponents.com/learning-centre/topic-guides/conversion-rate-optimization-tools (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/learning-centre/topic-guides/landing-page-conversion-leaks

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Landing Page Conversion Leaks in Paid Traffic" → https://nebulacomponents.com/learning-centre/topic-guides/landing-page-conversion-leaks (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/blog/paid-traffic-not-converting

- Subject: `https://nebulacomponents.com/blog`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Why is paid traffic not converting?" → https://nebulacomponents.com/blog/paid-traffic-not-converting (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/blog/what-we-got-wrong-about-filter-based-targeting

- Subject: `https://nebulacomponents.com/blog`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "What did we get wrong about filter-based targeting?" → https://nebulacomponents.com/blog/what-we-got-wrong-about-filter-based-targeting (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=about-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/about`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get your free audit →" → https://nebulacomponents.com/audit?utm_source=about-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/about/team

- Subject: `https://nebulacomponents.com/about`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Founder Profile →" → https://nebulacomponents.com/about/team (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=content&utm_medium=organic-content

- Subject: `https://nebulacomponents.com/about`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Run a free audit →" → https://nebulacomponents.com/audit?utm_source=content&utm_medium=organic-content (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/lab

- Subject: `https://nebulacomponents.com/audit?utm_source=site-nav&utm_medium=internal`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Component Lab: test your headline, CTA, and message match" → https://nebulacomponents.com/lab (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/how-nebula-audits

- Subject: `https://nebulacomponents.com/audit?utm_source=site-nav&utm_medium=internal`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "How Nebula audits: the 9-signal methodology" → https://nebulacomponents.com/how-nebula-audits (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=research-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/research/landing-page-performance-q3-2026`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get your free audit →" → https://nebulacomponents.com/audit?utm_source=research-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=content&utm_medium=organic-content

- Subject: `https://nebulacomponents.com/research/landing-page-performance-q3-2026`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Nebula Audit Engine" → https://nebulacomponents.com/audit?utm_source=content&utm_medium=organic-content (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/spec/landing-page-diagnostic-v1

- Subject: `https://nebulacomponents.com/research/landing-page-performance-q3-2026`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Landing Page Diagnostic Specification v1" → https://nebulacomponents.com/spec/landing-page-diagnostic-v1 (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/research

- Subject: `https://nebulacomponents.com/research/landing-page-performance-q3-2026`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "← All Research" → https://nebulacomponents.com/research (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/resources

- Subject: `https://nebulacomponents.com/resources/citable`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Resources" → https://nebulacomponents.com/resources (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=citable-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/resources/citable`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get your free audit →" → https://nebulacomponents.com/audit?utm_source=citable-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/resources/citable/quick-start

- Subject: `https://nebulacomponents.com/resources/citable`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Citable quick start" → https://nebulacomponents.com/resources/citable/quick-start (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/resources/citable/jobs/technical-retrieval-audit

- Subject: `https://nebulacomponents.com/resources/citable`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Retrieval evidenceDiscover and Fix Technical Retrieval Eligibility IssuesIs this site technically retrievable?Read guide →" → https://nebulacomponents.com/resources/citable/jobs/technical-retrieval-audit (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/resources/citable/jobs/claim-evidence-governance

- Subject: `https://nebulacomponents.com/resources/citable`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Claim governanceBuild Proven Claim and Evidence Governance WorkflowsCan this claim be published and defended?Read guide →" → https://nebulacomponents.com/resources/citable/jobs/claim-evidence-governance (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/resources/citable/jobs/answer-extractability-audit

- Subject: `https://nebulacomponents.com/resources/citable`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Answer extractionImprove Answer Extractability for AI Search EnginesCan an answer engine reliably extract this answer?Read guide →" → https://nebulacomponents.com/resources/citable/jobs/answer-extractability-audit (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/resources/citable/jobs/entity-narrative-audit

- Subject: `https://nebulacomponents.com/resources/citable`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Entity consistencyImprove Entity and Narrative Consistency in AI ModelsIs the entity represented consistently?Read guide →" → https://nebulacomponents.com/resources/citable/jobs/entity-narrative-audit (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/resources/citable/jobs/release-deployment-verification

- Subject: `https://nebulacomponents.com/resources/citable`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Release evidenceBuild Proven Release and Deployment VerificationDid this release reach its controlled surfaces?Read guide →" → https://nebulacomponents.com/resources/citable/jobs/release-deployment-verification (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/resources/citable/compare

- Subject: `https://nebulacomponents.com/resources/citable`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Category comparisonDiscover When to Use Citable for AI Search VerificationWhen is Citable a verification layer rather than a monitoring replacement?Read guide →" → https://nebulacomponents.com/resources/citable/compare (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/resources/citable/releases

- Subject: `https://nebulacomponents.com/resources/citable`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Current releaseDiscover Synchronized Citable Releases and Package FactsWhat changed in the synchronized published release?Read guide →" → https://nebulacomponents.com/resources/citable/releases (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=teardown-detail-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/teardowns/knallhart`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get your free audit →" → https://nebulacomponents.com/audit?utm_source=teardown-detail-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/knallhart/claim

- Subject: `https://nebulacomponents.com/teardowns/knallhart`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Claim this teardown" → https://nebulacomponents.com/teardowns/knallhart/claim (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?from=%2Fteardowns%2Fknallhart

- Subject: `https://nebulacomponents.com/teardowns/knallhart`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Find the Leak →" → https://nebulacomponents.com/audit?from=%2Fteardowns%2Fknallhart (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=teardown-detail-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/teardowns/postmint`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get your free audit →" → https://nebulacomponents.com/audit?utm_source=teardown-detail-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/postmint/claim

- Subject: `https://nebulacomponents.com/teardowns/postmint`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Claim this teardown" → https://nebulacomponents.com/teardowns/postmint/claim (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?from=%2Fteardowns%2Fpostmint

- Subject: `https://nebulacomponents.com/teardowns/postmint`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Find the Leak →" → https://nebulacomponents.com/audit?from=%2Fteardowns%2Fpostmint (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=teardown-detail-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/teardowns/basecamp`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get your free audit →" → https://nebulacomponents.com/audit?utm_source=teardown-detail-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/basecamp/claim

- Subject: `https://nebulacomponents.com/teardowns/basecamp`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Claim this teardown" → https://nebulacomponents.com/teardowns/basecamp/claim (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?from=%2Fteardowns%2Fbasecamp

- Subject: `https://nebulacomponents.com/teardowns/basecamp`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Find the Leak →" → https://nebulacomponents.com/audit?from=%2Fteardowns%2Fbasecamp (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/checkout

- Subject: `https://nebulacomponents.com/repair-sprint?utm_source=homepage&utm_medium=internal`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get $97 Repair Sprint →" → https://nebulacomponents.com/checkout (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=repair-sprint&utm_medium=internal

- Subject: `https://nebulacomponents.com/repair-sprint?utm_source=homepage&utm_medium=internal`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Run free audit first" → https://nebulacomponents.com/audit?utm_source=repair-sprint&utm_medium=internal (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/repair-sprint/example

- Subject: `https://nebulacomponents.com/repair-sprint?utm_source=homepage&utm_medium=internal`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "See example artifact" → https://nebulacomponents.com/repair-sprint/example (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/lab

- Subject: `https://nebulacomponents.com/audit?utm_source=homepage&utm_medium=internal`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Component Lab: test your headline, CTA, and message match" → https://nebulacomponents.com/lab (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/how-nebula-audits

- Subject: `https://nebulacomponents.com/audit?utm_source=homepage&utm_medium=internal`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "How Nebula audits: the 9-signal methodology" → https://nebulacomponents.com/how-nebula-audits (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/lab

- Subject: `https://nebulacomponents.com/audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Component Lab: test your headline, CTA, and message match" → https://nebulacomponents.com/lab (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/how-nebula-audits

- Subject: `https://nebulacomponents.com/audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "How Nebula audits: the 9-signal methodology" → https://nebulacomponents.com/how-nebula-audits (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/spec/landing-page-diagnostic-v1

- Subject: `https://nebulacomponents.com/benchmarks`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Landing Page Diagnostic Specification v1" → https://nebulacomponents.com/spec/landing-page-diagnostic-v1 (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=content&utm_medium=organic-content

- Subject: `https://nebulacomponents.com/benchmarks`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Audit Your Page" → https://nebulacomponents.com/audit?utm_source=content&utm_medium=organic-content (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/api/audit/stats/benchmarks

- Subject: `https://nebulacomponents.com/benchmarks`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "/api/audit/stats/benchmarks" → https://nebulacomponents.com/api/audit/stats/benchmarks (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=case-studies-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/case-studies`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get your free audit →" → https://nebulacomponents.com/audit?utm_source=case-studies-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/postdew

- Subject: `https://nebulacomponents.com/case-studies`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/postdew (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/drift

- Subject: `https://nebulacomponents.com/case-studies`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/drift (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/folioverse

- Subject: `https://nebulacomponents.com/case-studies`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/folioverse (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/canva

- Subject: `https://nebulacomponents.com/case-studies`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/canva (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/clickup

- Subject: `https://nebulacomponents.com/case-studies`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/clickup (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/typeform

- Subject: `https://nebulacomponents.com/case-studies`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/typeform (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/amplitude

- Subject: `https://nebulacomponents.com/case-studies`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/amplitude (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/mixpanel

- Subject: `https://nebulacomponents.com/case-studies`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/mixpanel (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/slack

- Subject: `https://nebulacomponents.com/case-studies`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/slack (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/asana

- Subject: `https://nebulacomponents.com/case-studies`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/asana (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/monday

- Subject: `https://nebulacomponents.com/case-studies`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/monday (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/intercom

- Subject: `https://nebulacomponents.com/case-studies`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/intercom (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/figma

- Subject: `https://nebulacomponents.com/case-studies`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/figma (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/cloudwise

- Subject: `https://nebulacomponents.com/case-studies`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/cloudwise (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/shopify

- Subject: `https://nebulacomponents.com/case-studies`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/shopify (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/squarespace

- Subject: `https://nebulacomponents.com/case-studies`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/squarespace (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/loom

- Subject: `https://nebulacomponents.com/case-studies`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/loom (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/airtable

- Subject: `https://nebulacomponents.com/case-studies`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/airtable (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/linear

- Subject: `https://nebulacomponents.com/case-studies`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/linear (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/miro

- Subject: `https://nebulacomponents.com/case-studies`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/miro (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/zapier

- Subject: `https://nebulacomponents.com/case-studies`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/zapier (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/pipedrive

- Subject: `https://nebulacomponents.com/case-studies`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/pipedrive (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/smartwatermark

- Subject: `https://nebulacomponents.com/case-studies`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Read teardown →" → https://nebulacomponents.com/teardowns/smartwatermark (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=content&utm_medium=organic-content

- Subject: `https://nebulacomponents.com/case-studies`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Find the Leak →" → https://nebulacomponents.com/audit?utm_source=content&utm_medium=organic-content (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=compare-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/compare`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get your free audit →" → https://nebulacomponents.com/audit?utm_source=compare-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/compare/unbounce

- Subject: `https://nebulacomponents.com/compare`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "vs  UnbounceLanding page builderA landing page builder for publishing and A/B testing pages without a developer." → https://nebulacomponents.com/compare/unbounce (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/compare/instapage

- Subject: `https://nebulacomponents.com/compare`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "vs  InstapageLanding page platformA landing page platform with personalization and conversion intelligence for pages built inside it." → https://nebulacomponents.com/compare/instapage (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/compare/pagespeed-insights

- Subject: `https://nebulacomponents.com/compare`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "vs  PageSpeed InsightsPerformance measurementGoogle’s lab-based tool that scores page load performance using Core Web Vitals." → https://nebulacomponents.com/compare/pagespeed-insights (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/compare/leadpages

- Subject: `https://nebulacomponents.com/compare`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "vs  LeadpagesLanding page builderA budget landing page builder for small businesses publishing pages from templates." → https://nebulacomponents.com/compare/leadpages (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/compare/whyiq

- Subject: `https://nebulacomponents.com/compare`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "vs  WhyIQSynthetic user testingAI-simulated visitor feedback and personas vs deterministic HTML DOM conversion inspection." → https://nebulacomponents.com/compare/whyiq (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/compare/landing-doctors

- Subject: `https://nebulacomponents.com/compare`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "vs  Landing DoctorsCRO agency & redesignsFull-page agency rewrites and design overhauls vs bounded single-condition repairs." → https://nebulacomponents.com/compare/landing-doctors (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/compare/fixroast

- Subject: `https://nebulacomponents.com/compare`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "vs  FixRoastAI website roast & search optimizationAI landing page roaster and search scoring vs. deterministic DOM conversion leak inspection." → https://nebulacomponents.com/compare/fixroast (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=content&utm_medium=organic-content

- Subject: `https://nebulacomponents.com/compare`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Free Audit" → https://nebulacomponents.com/audit?utm_source=content&utm_medium=organic-content (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=ecommerce-audit&utm_medium=organic

- Subject: `https://nebulacomponents.com/ecommerce-landing-page-audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Run a free audit" → https://nebulacomponents.com/audit?utm_source=ecommerce-audit&utm_medium=organic (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/why-cro-agencies-dont-work

- Subject: `https://nebulacomponents.com/ecommerce-landing-page-audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Why diagnosis comes before a CRO retainer →" → https://nebulacomponents.com/why-cro-agencies-dont-work (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=saas-audit-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/saas-landing-page-audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get your free audit →" → https://nebulacomponents.com/audit?utm_source=saas-audit-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=content&utm_medium=organic-content

- Subject: `https://nebulacomponents.com/saas-landing-page-audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Run Free SaaS Audit →" → https://nebulacomponents.com/audit?utm_source=content&utm_medium=organic-content (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=mobile-audit-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/mobile-landing-page-audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get your free audit →" → https://nebulacomponents.com/audit?utm_source=mobile-audit-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=content&utm_medium=organic-content

- Subject: `https://nebulacomponents.com/mobile-landing-page-audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Run Free Mobile Audit →" → https://nebulacomponents.com/audit?utm_source=content&utm_medium=organic-content (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/page-speed-conversion

- Subject: `https://nebulacomponents.com/mobile-landing-page-audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "GuidePage speed and conversion" → https://nebulacomponents.com/page-speed-conversion (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/mobile-landing-page-optimization

- Subject: `https://nebulacomponents.com/mobile-landing-page-audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "GuideMobile optimization guide" → https://nebulacomponents.com/mobile-landing-page-optimization (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=lead-gen-audit-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/lead-generation-landing-page-audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get your free audit →" → https://nebulacomponents.com/audit?utm_source=lead-gen-audit-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=content&utm_medium=organic-content

- Subject: `https://nebulacomponents.com/lead-generation-landing-page-audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Run Free Lead Gen Audit →" → https://nebulacomponents.com/audit?utm_source=content&utm_medium=organic-content (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/landing-page-trust-signals

- Subject: `https://nebulacomponents.com/lead-generation-landing-page-audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "GuideTrust signals that convert" → https://nebulacomponents.com/landing-page-trust-signals (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=cta-audit-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/landing-page-cta-audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get your free audit →" → https://nebulacomponents.com/audit?utm_source=cta-audit-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=content&utm_medium=organic-content

- Subject: `https://nebulacomponents.com/landing-page-cta-audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Run Free CTA Audit →" → https://nebulacomponents.com/audit?utm_source=content&utm_medium=organic-content (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/cta-optimization

- Subject: `https://nebulacomponents.com/landing-page-cta-audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "GuideCTA optimization guide" → https://nebulacomponents.com/cta-optimization (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=lp-mm-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/landing-page-message-match`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get your free audit →" → https://nebulacomponents.com/audit?utm_source=lp-mm-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=content&utm_medium=organic-content

- Subject: `https://nebulacomponents.com/landing-page-message-match`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Run Free Message Match Audit →" → https://nebulacomponents.com/audit?utm_source=content&utm_medium=organic-content (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/landing-page-trust-signals

- Subject: `https://nebulacomponents.com/landing-page-message-match`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Audit TypeTrust signals audit" → https://nebulacomponents.com/landing-page-trust-signals (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=why-not-conv-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/why-is-my-landing-page-not-converting`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get your free audit →" → https://nebulacomponents.com/audit?utm_source=why-not-conv-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/landing-page-performance-analysis

- Subject: `https://nebulacomponents.com/why-is-my-landing-page-not-converting`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "the performance analysis guide" → https://nebulacomponents.com/landing-page-performance-analysis (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=content&utm_medium=organic-content

- Subject: `https://nebulacomponents.com/why-is-my-landing-page-not-converting`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Run Free Landing Page Audit →" → https://nebulacomponents.com/audit?utm_source=content&utm_medium=organic-content (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/landing-page-mistakes

- Subject: `https://nebulacomponents.com/why-is-my-landing-page-not-converting`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "GuideCommon landing page mistakes" → https://nebulacomponents.com/landing-page-mistakes (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/landing-page-trust-signals

- Subject: `https://nebulacomponents.com/why-is-my-landing-page-not-converting`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "GuideTrust signals that convert" → https://nebulacomponents.com/landing-page-trust-signals (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=ads-clicks-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/ads-getting-clicks-but-no-sales`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get your free audit →" → https://nebulacomponents.com/audit?utm_source=ads-clicks-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=content&utm_medium=organic-content&utm_campaign=ads-clicks-no-sales

- Subject: `https://nebulacomponents.com/ads-getting-clicks-but-no-sales`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Find the Leak, Free →" → https://nebulacomponents.com/audit?utm_source=content&utm_medium=organic-content&utm_campaign=ads-clicks-no-sales (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=content&utm_medium=organic-content

- Subject: `https://nebulacomponents.com/ads-getting-clicks-but-no-sales`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Run Free Audit Now →" → https://nebulacomponents.com/audit?utm_source=content&utm_medium=organic-content (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/roas-cliff

- Subject: `https://nebulacomponents.com/ads-getting-clicks-but-no-sales`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "The ROAS Cliff" → https://nebulacomponents.com/roas-cliff (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=what-is-audit-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/what-is-landing-page-audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get your free audit →" → https://nebulacomponents.com/audit?utm_source=what-is-audit-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/signals/message-match

- Subject: `https://nebulacomponents.com/what-is-landing-page-audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "message match" → https://nebulacomponents.com/signals/message-match (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/signals/trust-signals

- Subject: `https://nebulacomponents.com/what-is-landing-page-audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "trust signals" → https://nebulacomponents.com/signals/trust-signals (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=content&utm_medium=organic-content

- Subject: `https://nebulacomponents.com/what-is-landing-page-audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Run the audit before checkout →" → https://nebulacomponents.com/audit?utm_source=content&utm_medium=organic-content (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/vs

- Subject: `https://nebulacomponents.com/best-landing-page-audit-tools`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Comparisons" → https://nebulacomponents.com/vs (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=best-tools-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/best-landing-page-audit-tools`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get your free audit →" → https://nebulacomponents.com/audit?utm_source=best-tools-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/landing-page-audit-tools-pricing

- Subject: `https://nebulacomponents.com/best-landing-page-audit-tools`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "See the verified pricing for all 8 tools →" → https://nebulacomponents.com/landing-page-audit-tools-pricing (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=best-tools-listical&utm_medium=organic-content

- Subject: `https://nebulacomponents.com/best-landing-page-audit-tools`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Find the Leak →" → https://nebulacomponents.com/audit?utm_source=best-tools-listical&utm_medium=organic-content (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=playbooks-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/playbooks`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get your free audit →" → https://nebulacomponents.com/audit?utm_source=playbooks-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/playbooks/founder-second-brain

- Subject: `https://nebulacomponents.com/playbooks`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Founder Second BrainCapture and reuse your best thinking - a system for turning founder expertise into compounding content and decision frameworks." → https://nebulacomponents.com/playbooks/founder-second-brain (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/playbooks/linkedin-skill-engine

- Subject: `https://nebulacomponents.com/playbooks`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "LinkedIn Skill EngineBuild authority with your own experience - convert real skills into LinkedIn content that reads as authority because it is." → https://nebulacomponents.com/playbooks/linkedin-skill-engine (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/playbooks/specialist-ai-agent-library

- Subject: `https://nebulacomponents.com/playbooks`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Specialist AI Agent LibraryDeploy purpose-built agents for growth - one specialist per role instead of one generalist AI for every task." → https://nebulacomponents.com/playbooks/specialist-ai-agent-library (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=press-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/press`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get free audit →" → https://nebulacomponents.com/audit?utm_source=press-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/spec/landing-page-diagnostic-v1

- Subject: `https://nebulacomponents.com/press`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Landing Page Diagnostic Specification v1" → https://nebulacomponents.com/spec/landing-page-diagnostic-v1 (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/brand/wordmark-dark.svg

- Subject: `https://nebulacomponents.com/press`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "LogoNebula Wordmark (SVG)/brand/wordmark-dark.svg" → https://nebulacomponents.com/brand/wordmark-dark.svg (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/brand/mark-dark.svg

- Subject: `https://nebulacomponents.com/press`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "LogoNebula Mark (SVG)/brand/mark-dark.svg" → https://nebulacomponents.com/brand/mark-dark.svg (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/press/grade-distribution.png

- Subject: `https://nebulacomponents.com/press`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "ResearchGrade Distribution Chart/press/grade-distribution.png" → https://nebulacomponents.com/press/grade-distribution.png (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/press/scorecard-example.png

- Subject: `https://nebulacomponents.com/press`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "ScreenshotScorecard Example/press/scorecard-example.png" → https://nebulacomponents.com/press/scorecard-example.png (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/mike-holownych-founder.jpg

- Subject: `https://nebulacomponents.com/press`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "PhotoFounder Photo/mike-holownych-founder.jpg" → https://nebulacomponents.com/mike-holownych-founder.jpg (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=brand-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/brand`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get free audit →" → https://nebulacomponents.com/audit?utm_source=brand-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/brand/mark-dark.svg

- Subject: `https://nebulacomponents.com/brand`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "SVG" → https://nebulacomponents.com/brand/mark-dark.svg (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/brand/mark-dark-64.png

- Subject: `https://nebulacomponents.com/brand`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "64 px" → https://nebulacomponents.com/brand/mark-dark-64.png (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/brand/mark-dark-128.png

- Subject: `https://nebulacomponents.com/brand`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "128 px" → https://nebulacomponents.com/brand/mark-dark-128.png (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/brand/mark-dark-256.png

- Subject: `https://nebulacomponents.com/brand`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "256 px" → https://nebulacomponents.com/brand/mark-dark-256.png (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/brand/mark-light.svg

- Subject: `https://nebulacomponents.com/brand`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "SVG" → https://nebulacomponents.com/brand/mark-light.svg (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/brand/mark-light-64.png

- Subject: `https://nebulacomponents.com/brand`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "64 px" → https://nebulacomponents.com/brand/mark-light-64.png (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/brand/mark-light-128.png

- Subject: `https://nebulacomponents.com/brand`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "128 px" → https://nebulacomponents.com/brand/mark-light-128.png (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/brand/mark-light-256.png

- Subject: `https://nebulacomponents.com/brand`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "256 px" → https://nebulacomponents.com/brand/mark-light-256.png (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/brand/mark-mono.svg

- Subject: `https://nebulacomponents.com/brand`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "SVG" → https://nebulacomponents.com/brand/mark-mono.svg (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/brand/mark-mono-64.png

- Subject: `https://nebulacomponents.com/brand`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "64 px" → https://nebulacomponents.com/brand/mark-mono-64.png (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/brand/mark-mono-128.png

- Subject: `https://nebulacomponents.com/brand`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "128 px" → https://nebulacomponents.com/brand/mark-mono-128.png (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/brand/mark-mono-256.png

- Subject: `https://nebulacomponents.com/brand`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "256 px" → https://nebulacomponents.com/brand/mark-mono-256.png (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/brand/mark-accent.svg

- Subject: `https://nebulacomponents.com/brand`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "SVG" → https://nebulacomponents.com/brand/mark-accent.svg (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/brand/mark-accent-64.png

- Subject: `https://nebulacomponents.com/brand`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "64 px" → https://nebulacomponents.com/brand/mark-accent-64.png (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/brand/mark-accent-128.png

- Subject: `https://nebulacomponents.com/brand`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "128 px" → https://nebulacomponents.com/brand/mark-accent-128.png (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/brand/mark-accent-256.png

- Subject: `https://nebulacomponents.com/brand`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "256 px" → https://nebulacomponents.com/brand/mark-accent-256.png (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/brand/wordmark-dark.svg

- Subject: `https://nebulacomponents.com/brand`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "SVG ↓" → https://nebulacomponents.com/brand/wordmark-dark.svg (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/brand/wordmark-light.svg

- Subject: `https://nebulacomponents.com/brand`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "SVG ↓" → https://nebulacomponents.com/brand/wordmark-light.svg (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=editorial-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/editorial-standards`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get free audit →" → https://nebulacomponents.com/audit?utm_source=editorial-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/lab

- Subject: `https://nebulacomponents.com/audit?utm_source=footer&utm_medium=internal`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Component Lab: test your headline, CTA, and message match" → https://nebulacomponents.com/lab (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/how-nebula-audits

- Subject: `https://nebulacomponents.com/audit?utm_source=footer&utm_medium=internal`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "How Nebula audits: the 9-signal methodology" → https://nebulacomponents.com/how-nebula-audits (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=privacy-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/privacy-policy`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get free audit →" → https://nebulacomponents.com/audit?utm_source=privacy-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=terms-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/terms`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get free audit →" → https://nebulacomponents.com/audit?utm_source=terms-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=data-rights-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/data-rights`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get free audit →" → https://nebulacomponents.com/audit?utm_source=data-rights-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/lab

- Subject: `https://nebulacomponents.com/audit?utm_source=teardowns-hero&utm_medium=hero-cta`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Component Lab: test your headline, CTA, and message match" → https://nebulacomponents.com/lab (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/how-nebula-audits

- Subject: `https://nebulacomponents.com/audit?utm_source=teardowns-hero&utm_medium=hero-cta`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "How Nebula audits: the 9-signal methodology" → https://nebulacomponents.com/how-nebula-audits (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=teardown-detail-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/teardowns/carrd`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get your free audit →" → https://nebulacomponents.com/audit?utm_source=teardown-detail-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/carrd/claim

- Subject: `https://nebulacomponents.com/teardowns/carrd`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Claim this teardown" → https://nebulacomponents.com/teardowns/carrd/claim (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?from=%2Fteardowns%2Fcarrd

- Subject: `https://nebulacomponents.com/teardowns/carrd`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Find the Leak →" → https://nebulacomponents.com/audit?from=%2Fteardowns%2Fcarrd (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=teardown-detail-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/teardowns/hotjar`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get your free audit →" → https://nebulacomponents.com/audit?utm_source=teardown-detail-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/hotjar/claim

- Subject: `https://nebulacomponents.com/teardowns/hotjar`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Claim this teardown" → https://nebulacomponents.com/teardowns/hotjar/claim (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?from=%2Fteardowns%2Fhotjar

- Subject: `https://nebulacomponents.com/teardowns/hotjar`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Find the Leak →" → https://nebulacomponents.com/audit?from=%2Fteardowns%2Fhotjar (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=teardown-detail-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/teardowns/kit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get your free audit →" → https://nebulacomponents.com/audit?utm_source=teardown-detail-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/kit/claim

- Subject: `https://nebulacomponents.com/teardowns/kit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Claim this teardown" → https://nebulacomponents.com/teardowns/kit/claim (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?from=%2Fteardowns%2Fkit

- Subject: `https://nebulacomponents.com/teardowns/kit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Find the Leak →" → https://nebulacomponents.com/audit?from=%2Fteardowns%2Fkit (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=teardown-detail-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/teardowns/beehiiv`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get your free audit →" → https://nebulacomponents.com/audit?utm_source=teardown-detail-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/beehiiv/claim

- Subject: `https://nebulacomponents.com/teardowns/beehiiv`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Claim this teardown" → https://nebulacomponents.com/teardowns/beehiiv/claim (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?from=%2Fteardowns%2Fbeehiiv

- Subject: `https://nebulacomponents.com/teardowns/beehiiv`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Find the Leak →" → https://nebulacomponents.com/audit?from=%2Fteardowns%2Fbeehiiv (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=teardown-detail-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/teardowns/unbounce`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get your free audit →" → https://nebulacomponents.com/audit?utm_source=teardown-detail-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/unbounce/claim

- Subject: `https://nebulacomponents.com/teardowns/unbounce`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Claim this teardown" → https://nebulacomponents.com/teardowns/unbounce/claim (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?from=%2Fteardowns%2Funbounce

- Subject: `https://nebulacomponents.com/teardowns/unbounce`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Find the Leak →" → https://nebulacomponents.com/audit?from=%2Fteardowns%2Funbounce (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=teardown-detail-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/teardowns/webflow`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get your free audit →" → https://nebulacomponents.com/audit?utm_source=teardown-detail-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/webflow/claim

- Subject: `https://nebulacomponents.com/teardowns/webflow`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Claim this teardown" → https://nebulacomponents.com/teardowns/webflow/claim (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?from=%2Fteardowns%2Fwebflow

- Subject: `https://nebulacomponents.com/teardowns/webflow`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Find the Leak →" → https://nebulacomponents.com/audit?from=%2Fteardowns%2Fwebflow (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=teardown-detail-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/teardowns/framer`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get your free audit →" → https://nebulacomponents.com/audit?utm_source=teardown-detail-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/framer/claim

- Subject: `https://nebulacomponents.com/teardowns/framer`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Claim this teardown" → https://nebulacomponents.com/teardowns/framer/claim (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?from=%2Fteardowns%2Fframer

- Subject: `https://nebulacomponents.com/teardowns/framer`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Find the Leak →" → https://nebulacomponents.com/audit?from=%2Fteardowns%2Fframer (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=teardown-detail-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/teardowns/notion`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get your free audit →" → https://nebulacomponents.com/audit?utm_source=teardown-detail-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/notion/claim

- Subject: `https://nebulacomponents.com/teardowns/notion`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Claim this teardown" → https://nebulacomponents.com/teardowns/notion/claim (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?from=%2Fteardowns%2Fnotion

- Subject: `https://nebulacomponents.com/teardowns/notion`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Find the Leak →" → https://nebulacomponents.com/audit?from=%2Fteardowns%2Fnotion (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=teardown-detail-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/teardowns/calendly`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get your free audit →" → https://nebulacomponents.com/audit?utm_source=teardown-detail-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/calendly/claim

- Subject: `https://nebulacomponents.com/teardowns/calendly`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Claim this teardown" → https://nebulacomponents.com/teardowns/calendly/claim (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?from=%2Fteardowns%2Fcalendly

- Subject: `https://nebulacomponents.com/teardowns/calendly`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Find the Leak →" → https://nebulacomponents.com/audit?from=%2Fteardowns%2Fcalendly (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=teardown-detail-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/teardowns/hubspot`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get your free audit →" → https://nebulacomponents.com/audit?utm_source=teardown-detail-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/hubspot/claim

- Subject: `https://nebulacomponents.com/teardowns/hubspot`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Claim this teardown" → https://nebulacomponents.com/teardowns/hubspot/claim (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?from=%2Fteardowns%2Fhubspot

- Subject: `https://nebulacomponents.com/teardowns/hubspot`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Find the Leak →" → https://nebulacomponents.com/audit?from=%2Fteardowns%2Fhubspot (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?utm_source=teardown-detail-hero&utm_medium=hero-cta

- Subject: `https://nebulacomponents.com/teardowns/mailchimp`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Get your free audit →" → https://nebulacomponents.com/audit?utm_source=teardown-detail-hero&utm_medium=hero-cta (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/teardowns/mailchimp/claim

- Subject: `https://nebulacomponents.com/teardowns/mailchimp`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Claim this teardown" → https://nebulacomponents.com/teardowns/mailchimp/claim (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · LINK-001 · Internal link to missing URL https://nebulacomponents.com/audit?from=%2Fteardowns%2Fmailchimp

- Subject: `https://nebulacomponents.com/teardowns/mailchimp`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, conversion:low
- Evidence:
  - link "Find the Leak →" → https://nebulacomponents.com/audit?from=%2Fteardowns%2Fmailchimp (not found in audited output)
- Remediation: Fix or remove the link; add a redirect if the target moved.
- Verify: All internal links resolve to 200 pages. (rerun `LINK-001`)

### MEDIUM · GEO-011 · Oversized section under "intro" (456 words) risks RAG chunk fracture for unanchored claims

- Subject: `https://nebulacomponents.com/`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, representation:high
- Evidence:
  - section heading: "intro"
  - accumulated section words: 456
  - generative search RAG pipelines chunk text at 300-500 tokens, severing unanchored claims from qualifying context
- Remediation: Subdivide sections exceeding 400 words with H3 sub-headings or bullet lists, and anchor citations in the same paragraph as the claim.
- Verify: Re-audit section word counts and ensure paragraphs with factual claims contain adjacent citation anchors. (rerun `GEO-011`)

### MEDIUM · GEO-011 · Oversized section under "intro" (456 words) risks RAG chunk fracture for unanchored claims

- Subject: `https://nebulacomponents.com/`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, representation:high
- Evidence:
  - section heading: "intro"
  - accumulated section words: 456
  - generative search RAG pipelines chunk text at 300-500 tokens, severing unanchored claims from qualifying context
- Remediation: Subdivide sections exceeding 400 words with H3 sub-headings or bullet lists, and anchor citations in the same paragraph as the claim.
- Verify: Re-audit section word counts and ensure paragraphs with factual claims contain adjacent citation anchors. (rerun `GEO-011`)

### MEDIUM · GEO-011 · Oversized section under "intro" (458 words) risks RAG chunk fracture for unanchored claims

- Subject: `https://nebulacomponents.com/repair-sprint`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, representation:high
- Evidence:
  - section heading: "intro"
  - accumulated section words: 458
  - generative search RAG pipelines chunk text at 300-500 tokens, severing unanchored claims from qualifying context
- Remediation: Subdivide sections exceeding 400 words with H3 sub-headings or bullet lists, and anchor citations in the same paragraph as the claim.
- Verify: Re-audit section word counts and ensure paragraphs with factual claims contain adjacent citation anchors. (rerun `GEO-011`)

### MEDIUM · GEO-011 · Oversized section under "intro" (476 words) risks RAG chunk fracture for unanchored claims

- Subject: `https://nebulacomponents.com/pricing`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, representation:high
- Evidence:
  - section heading: "intro"
  - accumulated section words: 476
  - generative search RAG pipelines chunk text at 300-500 tokens, severing unanchored claims from qualifying context
- Remediation: Subdivide sections exceeding 400 words with H3 sub-headings or bullet lists, and anchor citations in the same paragraph as the claim.
- Verify: Re-audit section word counts and ensure paragraphs with factual claims contain adjacent citation anchors. (rerun `GEO-011`)

### MEDIUM · GEO-011 · Oversized section under "intro" (481 words) risks RAG chunk fracture for unanchored claims

- Subject: `https://nebulacomponents.com/audit?utm_source=site-nav&utm_medium=internal`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, representation:high
- Evidence:
  - section heading: "intro"
  - accumulated section words: 481
  - generative search RAG pipelines chunk text at 300-500 tokens, severing unanchored claims from qualifying context
- Remediation: Subdivide sections exceeding 400 words with H3 sub-headings or bullet lists, and anchor citations in the same paragraph as the claim.
- Verify: Re-audit section word counts and ensure paragraphs with factual claims contain adjacent citation anchors. (rerun `GEO-011`)

### MEDIUM · GEO-011 · Oversized section under "intro" (518 words) risks RAG chunk fracture for unanchored claims

- Subject: `https://nebulacomponents.com/resources/citable`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, representation:high
- Evidence:
  - section heading: "intro"
  - accumulated section words: 518
  - generative search RAG pipelines chunk text at 300-500 tokens, severing unanchored claims from qualifying context
- Remediation: Subdivide sections exceeding 400 words with H3 sub-headings or bullet lists, and anchor citations in the same paragraph as the claim.
- Verify: Re-audit section word counts and ensure paragraphs with factual claims contain adjacent citation anchors. (rerun `GEO-011`)

### MEDIUM · GEO-011 · Oversized section under "intro" (470 words) risks RAG chunk fracture for unanchored claims

- Subject: `https://nebulacomponents.com/teardowns/knallhart`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, representation:high
- Evidence:
  - section heading: "intro"
  - accumulated section words: 470
  - generative search RAG pipelines chunk text at 300-500 tokens, severing unanchored claims from qualifying context
- Remediation: Subdivide sections exceeding 400 words with H3 sub-headings or bullet lists, and anchor citations in the same paragraph as the claim.
- Verify: Re-audit section word counts and ensure paragraphs with factual claims contain adjacent citation anchors. (rerun `GEO-011`)

### MEDIUM · GEO-011 · Oversized section under "intro" (512 words) risks RAG chunk fracture for unanchored claims

- Subject: `https://nebulacomponents.com/teardowns/postmint`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, representation:high
- Evidence:
  - section heading: "intro"
  - accumulated section words: 512
  - generative search RAG pipelines chunk text at 300-500 tokens, severing unanchored claims from qualifying context
- Remediation: Subdivide sections exceeding 400 words with H3 sub-headings or bullet lists, and anchor citations in the same paragraph as the claim.
- Verify: Re-audit section word counts and ensure paragraphs with factual claims contain adjacent citation anchors. (rerun `GEO-011`)

### MEDIUM · GEO-011 · Oversized section under "intro" (505 words) risks RAG chunk fracture for unanchored claims

- Subject: `https://nebulacomponents.com/teardowns/basecamp`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, representation:high
- Evidence:
  - section heading: "intro"
  - accumulated section words: 505
  - generative search RAG pipelines chunk text at 300-500 tokens, severing unanchored claims from qualifying context
- Remediation: Subdivide sections exceeding 400 words with H3 sub-headings or bullet lists, and anchor citations in the same paragraph as the claim.
- Verify: Re-audit section word counts and ensure paragraphs with factual claims contain adjacent citation anchors. (rerun `GEO-011`)

### MEDIUM · GEO-011 · Oversized section under "intro" (458 words) risks RAG chunk fracture for unanchored claims

- Subject: `https://nebulacomponents.com/repair-sprint?utm_source=homepage&utm_medium=internal`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, representation:high
- Evidence:
  - section heading: "intro"
  - accumulated section words: 458
  - generative search RAG pipelines chunk text at 300-500 tokens, severing unanchored claims from qualifying context
- Remediation: Subdivide sections exceeding 400 words with H3 sub-headings or bullet lists, and anchor citations in the same paragraph as the claim.
- Verify: Re-audit section word counts and ensure paragraphs with factual claims contain adjacent citation anchors. (rerun `GEO-011`)

### MEDIUM · GEO-011 · Oversized section under "intro" (481 words) risks RAG chunk fracture for unanchored claims

- Subject: `https://nebulacomponents.com/audit?utm_source=homepage&utm_medium=internal`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, representation:high
- Evidence:
  - section heading: "intro"
  - accumulated section words: 481
  - generative search RAG pipelines chunk text at 300-500 tokens, severing unanchored claims from qualifying context
- Remediation: Subdivide sections exceeding 400 words with H3 sub-headings or bullet lists, and anchor citations in the same paragraph as the claim.
- Verify: Re-audit section word counts and ensure paragraphs with factual claims contain adjacent citation anchors. (rerun `GEO-011`)

### MEDIUM · GEO-011 · Oversized section under "intro" (481 words) risks RAG chunk fracture for unanchored claims

- Subject: `https://nebulacomponents.com/audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, representation:high
- Evidence:
  - section heading: "intro"
  - accumulated section words: 481
  - generative search RAG pipelines chunk text at 300-500 tokens, severing unanchored claims from qualifying context
- Remediation: Subdivide sections exceeding 400 words with H3 sub-headings or bullet lists, and anchor citations in the same paragraph as the claim.
- Verify: Re-audit section word counts and ensure paragraphs with factual claims contain adjacent citation anchors. (rerun `GEO-011`)

### MEDIUM · GEO-011 · Oversized section under "intro" (460 words) risks RAG chunk fracture for unanchored claims

- Subject: `https://nebulacomponents.com/benchmarks`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, representation:high
- Evidence:
  - section heading: "intro"
  - accumulated section words: 460
  - generative search RAG pipelines chunk text at 300-500 tokens, severing unanchored claims from qualifying context
- Remediation: Subdivide sections exceeding 400 words with H3 sub-headings or bullet lists, and anchor citations in the same paragraph as the claim.
- Verify: Re-audit section word counts and ensure paragraphs with factual claims contain adjacent citation anchors. (rerun `GEO-011`)

### MEDIUM · GEO-011 · Oversized section under "intro" (715 words) risks RAG chunk fracture for unanchored claims

- Subject: `https://nebulacomponents.com/ads-getting-clicks-but-no-sales`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, representation:high
- Evidence:
  - section heading: "intro"
  - accumulated section words: 715
  - generative search RAG pipelines chunk text at 300-500 tokens, severing unanchored claims from qualifying context
- Remediation: Subdivide sections exceeding 400 words with H3 sub-headings or bullet lists, and anchor citations in the same paragraph as the claim.
- Verify: Re-audit section word counts and ensure paragraphs with factual claims contain adjacent citation anchors. (rerun `GEO-011`)

### MEDIUM · GEO-011 · Oversized section under "intro" (476 words) risks RAG chunk fracture for unanchored claims

- Subject: `https://nebulacomponents.com/best-landing-page-audit-tools`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, representation:high
- Evidence:
  - section heading: "intro"
  - accumulated section words: 476
  - generative search RAG pipelines chunk text at 300-500 tokens, severing unanchored claims from qualifying context
- Remediation: Subdivide sections exceeding 400 words with H3 sub-headings or bullet lists, and anchor citations in the same paragraph as the claim.
- Verify: Re-audit section word counts and ensure paragraphs with factual claims contain adjacent citation anchors. (rerun `GEO-011`)

### MEDIUM · GEO-011 · Oversized section under "intro" (481 words) risks RAG chunk fracture for unanchored claims

- Subject: `https://nebulacomponents.com/audit?utm_source=footer&utm_medium=internal`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, representation:high
- Evidence:
  - section heading: "intro"
  - accumulated section words: 481
  - generative search RAG pipelines chunk text at 300-500 tokens, severing unanchored claims from qualifying context
- Remediation: Subdivide sections exceeding 400 words with H3 sub-headings or bullet lists, and anchor citations in the same paragraph as the claim.
- Verify: Re-audit section word counts and ensure paragraphs with factual claims contain adjacent citation anchors. (rerun `GEO-011`)

### MEDIUM · GEO-011 · Oversized section under "intro" (481 words) risks RAG chunk fracture for unanchored claims

- Subject: `https://nebulacomponents.com/audit?utm_source=teardowns-hero&utm_medium=hero-cta`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium, representation:high
- Evidence:
  - section heading: "intro"
  - accumulated section words: 481
  - generative search RAG pipelines chunk text at 300-500 tokens, severing unanchored claims from qualifying context
- Remediation: Subdivide sections exceeding 400 words with H3 sub-headings or bullet lists, and anchor citations in the same paragraph as the claim.
- Verify: Re-audit section word counts and ensure paragraphs with factual claims contain adjacent citation anchors. (rerun `GEO-011`)

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

### LOW · PAGE-004 · 2 pages share the same meta description

- Subject: `description:Free evidence-backed landing page audit.`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: conversion:low
- Evidence:
  - https://nebulacomponents.com/
  - https://nebulacomponents.com/
- Remediation: Write distinct descriptions per page.
- Verify: Confirm description uniqueness. (rerun `PAGE-004`)

### LOW · PAGE-004 · 2 pages share the same meta description

- Subject: `description:The $97 Repair Sprint: Nebula identifies`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: conversion:low
- Evidence:
  - https://nebulacomponents.com/repair-sprint
  - https://nebulacomponents.com/repair-sprint?utm_source=homepage&utm_medium=internal
- Remediation: Write distinct descriptions per page.
- Verify: Confirm description uniqueness. (rerun `PAGE-004`)

### LOW · PAGE-004 · 5 pages share the same meta description

- Subject: `description:Free conversion leak detection for any l`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: conversion:low
- Evidence:
  - https://nebulacomponents.com/audit?utm_source=site-nav&utm_medium=internal
  - https://nebulacomponents.com/audit?utm_source=homepage&utm_medium=internal
  - https://nebulacomponents.com/audit
  - https://nebulacomponents.com/audit?utm_source=footer&utm_medium=internal
  - https://nebulacomponents.com/audit?utm_source=teardowns-hero&utm_medium=hero-cta
- Remediation: Write distinct descriptions per page.
- Verify: Confirm description uniqueness. (rerun `PAGE-004`)

### LOW · PAGE-006 · Heading hierarchy skips from H1 to H3 ("https://launchcrate.io/pricing")

- Subject: `https://nebulacomponents.com/`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: citation:low
- Evidence:
  - sequence: H1 → H3
- Remediation: Restructure headings to descend one level at a time.
- Verify: Walk heading sequence and confirm no level is skipped. (rerun `PAGE-006`)

### LOW · PAGE-006 · Heading hierarchy skips from H1 to H3 ("https://launchcrate.io/pricing")

- Subject: `https://nebulacomponents.com/`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: citation:low
- Evidence:
  - sequence: H1 → H3
- Remediation: Restructure headings to descend one level at a time.
- Verify: Walk heading sequence and confirm no level is skipped. (rerun `PAGE-006`)

### LOW · PAGE-006 · Heading hierarchy skips from H2 to H4 ("Sans-serif Stack")

- Subject: `https://nebulacomponents.com/brand`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: citation:low
- Evidence:
  - sequence: H2 → H4
- Remediation: Restructure headings to descend one level at a time.
- Verify: Walk heading sequence and confirm no level is skipped. (rerun `PAGE-006`)

### LOW · ANS-016 · Long-form guide (5809 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 5809 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (5809 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 5809 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (7024 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/teardowns`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 7024 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (4634 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/repair-sprint`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 4634 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (6015 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/pricing`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 6015 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (6057 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 6057 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (2487 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/blog`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 2487 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (3374 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/about`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 3374 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (6082 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/audit?utm_source=site-nav&utm_medium=internal`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 6082 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (5096 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/resources/citable`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 5096 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (3968 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/teardowns/knallhart`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 3968 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (4000 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/teardowns/postmint`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 4000 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (4148 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/teardowns/basecamp`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 4148 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (4634 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/repair-sprint?utm_source=homepage&utm_medium=internal`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 4634 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (6082 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/audit?utm_source=homepage&utm_medium=internal`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 6082 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (6082 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 6082 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (3321 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/benchmarks`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 3321 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (2799 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/compare`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 2799 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (2818 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/ecommerce-landing-page-audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 2818 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (6063 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/saas-landing-page-audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 6063 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (6107 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/mobile-landing-page-audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 6107 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (6027 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/lead-generation-landing-page-audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 6027 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (5982 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/landing-page-cta-audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 5982 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (6667 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/landing-page-message-match`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 6667 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (7905 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/why-is-my-landing-page-not-converting`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 7905 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (5677 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/ads-getting-clicks-but-no-sales`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 5677 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (2837 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/what-is-landing-page-audit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 2837 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (7374 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/best-landing-page-audit-tools`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 7374 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (2555 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/playbooks`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 2555 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (5293 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/press`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 5293 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (7294 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/brand`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 7294 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (2629 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/editorial-standards`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 2629 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (6082 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/audit?utm_source=footer&utm_medium=internal`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 6082 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (3564 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/privacy-policy`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 3564 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (3178 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/terms`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 3178 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (2702 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/data-rights`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 2702 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (6082 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/audit?utm_source=teardowns-hero&utm_medium=hero-cta`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 6082 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (4230 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/teardowns/carrd`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 4230 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (3967 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/teardowns/hotjar`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 3967 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (3956 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/teardowns/kit`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 3956 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (4162 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/teardowns/beehiiv`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 4162 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (3925 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/teardowns/unbounce`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 3925 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (3849 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/teardowns/webflow`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 3849 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (3911 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/teardowns/framer`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 3911 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (3863 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/teardowns/notion`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 3863 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (3988 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/teardowns/calendly`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 3988 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (4612 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/teardowns/hubspot`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 4612 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · ANS-016 · Long-form guide (4629 words) lacks an executive summary, key takeaways, or TL;DR section

- Subject: `https://nebulacomponents.com/teardowns/mailchimp`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: representation:medium, citation:low
- Evidence:
  - word count: 4629 words
  - no heading matches executive summary, key takeaways, or TL;DR pattern
  - sprawling unsummarized documents experience lower RAG retrieval relevance in generative answer engines
- Remediation: Add an executive summary or bulleted key takeaways block near the top of the article before detailed section walkthroughs.
- Verify: Re-audit page to verify a summary, key takeaways, or TL;DR section precedes long-form content. (rerun `ANS-016`)

### LOW · LINK-004 · Exact-match anchor repeated 50 times sitewide: free landing page audit

- Subject: `free landing page audit→https://nebulacomponents.com/audit`
- Type: probabilistic_inference; confidence: medium; deterministic: false
- Impact: ranking:low, reputational:low
- Evidence:
  - 50 occurrences across 50 pages
- Remediation: Vary contextual anchors naturally; keep repeated labels to navigation chrome only.
- Verify: Re-measure anchor repetition after cleanup. (rerun `LINK-004`)
- Limitations: heuristic detection; verify manually before acting

### LOW · LINK-004 · Exact-match anchor repeated 50 times sitewide: why pages don't convert

- Subject: `why pages don't convert→https://nebulacomponents.com/why-is-my-landing-page-not-converting`
- Type: probabilistic_inference; confidence: medium; deterministic: false
- Impact: ranking:low, reputational:low
- Evidence:
  - 50 occurrences across 50 pages
- Remediation: Vary contextual anchors naturally; keep repeated labels to navigation chrome only.
- Verify: Re-measure anchor repetition after cleanup. (rerun `LINK-004`)
- Limitations: heuristic detection; verify manually before acting

### LOW · LINK-004 · Exact-match anchor repeated 50 times sitewide: ads with no sales

- Subject: `ads with no sales→https://nebulacomponents.com/ads-getting-clicks-but-no-sales`
- Type: probabilistic_inference; confidence: medium; deterministic: false
- Impact: ranking:low, reputational:low
- Evidence:
  - 50 occurrences across 50 pages
- Remediation: Vary contextual anchors naturally; keep repeated labels to navigation chrome only.
- Verify: Re-measure anchor repetition after cleanup. (rerun `LINK-004`)
- Limitations: heuristic detection; verify manually before acting

### LOW · LINK-004 · Exact-match anchor repeated 50 times sitewide: what is an audit?

- Subject: `what is an audit?→https://nebulacomponents.com/what-is-landing-page-audit`
- Type: probabilistic_inference; confidence: medium; deterministic: false
- Impact: ranking:low, reputational:low
- Evidence:
  - 50 occurrences across 50 pages
- Remediation: Vary contextual anchors naturally; keep repeated labels to navigation chrome only.
- Verify: Re-measure anchor repetition after cleanup. (rerun `LINK-004`)
- Limitations: heuristic detection; verify manually before acting

### LOW · LINK-004 · Exact-match anchor repeated 50 times sitewide: audit tools compared

- Subject: `audit tools compared→https://nebulacomponents.com/best-landing-page-audit-tools`
- Type: probabilistic_inference; confidence: medium; deterministic: false
- Impact: ranking:low, reputational:low
- Evidence:
  - 50 occurrences across 50 pages
- Remediation: Vary contextual anchors naturally; keep repeated labels to navigation chrome only.
- Verify: Re-measure anchor repetition after cleanup. (rerun `LINK-004`)
- Limitations: heuristic detection; verify manually before acting

### LOW · LINK-004 · Exact-match anchor repeated 50 times sitewide: all guides 

- Subject: `all guides →→https://nebulacomponents.com/learning-centre`
- Type: probabilistic_inference; confidence: medium; deterministic: false
- Impact: ranking:low, reputational:low
- Evidence:
  - 50 occurrences across 50 pages
- Remediation: Vary contextual anchors naturally; keep repeated labels to navigation chrome only.
- Verify: Re-measure anchor repetition after cleanup. (rerun `LINK-004`)
- Limitations: heuristic detection; verify manually before acting

### LOW · LINK-004 · Exact-match anchor repeated 50 times sitewide: get your free audit 

- Subject: `get your free audit →→https://nebulacomponents.com/audit?utm_source=footer&utm_medium=internal`
- Type: probabilistic_inference; confidence: medium; deterministic: false
- Impact: ranking:low, reputational:low
- Evidence:
  - 50 occurrences across 50 pages
- Remediation: Vary contextual anchors naturally; keep repeated labels to navigation chrome only.
- Verify: Re-measure anchor repetition after cleanup. (rerun `LINK-004`)
- Limitations: heuristic detection; verify manually before acting

### LOW · AGENT-003 · llms.txt not discovered during crawl

- Subject: `/llms.txt`
- Type: probabilistic_inference; confidence: medium; deterministic: false
- Evidence:
  - No /llms.txt found in crawl results or site metadata
- Remediation: Create /llms.txt at your site root with: site purpose, key pages list with descriptions, and optionally /llms-full.txt with complete content. See https://llmstxt.org/ for spec.
- Verify: Fetch /llms.txt and confirm it returns 200 with Markdown content. (rerun `AGENT-003`)
- Limitations: heuristic detection; verify manually before acting
