# DEC-0001: Adopt Autonomous Business OS Architecture

**Status:** Active
**Date:** 2026-07-07
**Author:** CEO Agent
**Approved by:** Mike (via vision document submission)

## Decision

Restructure Hermes' operating model from "AI coding assistant with task optimization" to "Autonomous Business Operating System" with governance layer, living documents, department-based organization, and evidence-first decision framework.

## Context

Mike submitted a comprehensive architecture document defining 10 guiding principles, 13 departments, living document structure, daily operating cycle, decision framework, experiment framework, and escalation policy for running Nebula as an autonomous business OS.

## What Changed

| Before | After |
|---|---|
| Root directory flat with 100+ files | Governance layer in `governance/` directory |
| No MISSION.md (mission implicit in SOUL.md) | `governance/MISSION.md` with north star metric + boundaries |
| No VALUES.md (principles in SOUL.md only) | `governance/VALUES.md` with 10 binding principles |
| No ECONOMICS.md (pricing scattered across Stripe + config files) | `governance/ECONOMICS.md` — single source of truth for all financial data |
| No ORGANIZATION.md (agent roles in SOUL.md) | `governance/ORGANIZATION.md` — 13 departments mapped to agents, crons, files |
| No DECISIONS/ log | `governance/DECISIONS/` — structured decision records (this is #1) |
| No EXPERIMENTS/ log | `governance/EXPERIMENTS/` — formal experiment framework |
| No INCIDENTS/ log | `governance/INCIDENTS/` — incident postmortems |
| No SOPs/ directory | `governance/SOPs/` — runbooks for operations |
| No RETROSPECTIVES/ | `governance/RETROSPECTIVES/` — 30-day retrospectives |
| No daily briefing agent | New cron: `daily-briefing` at 8:30 AM UTC |

## Rationale

1. **Autonomy requires governance.** An OS that makes decisions without asking needs clear boundaries (VALUES.md), financial context (ECONOMICS.md), and department structure (ORGANIZATION.md).

2. **Knowledge must compound.** Flat file structure meant knowledge lived in conversation history. Living documents in organized directories mean the OS gets smarter over time.

3. **Evidence before action.** The decision framework in VALUES.md ensures every significant action passes goal alignment, authority, budget, risk, evidence, and ROI checks before execution.

4. **Survival first.** The VALUES.md hierarchy (preserve → grow → improve → evidence) ensures cash preservation and system reliability before feature development.

## Alternatives Considered

1. **Keep existing flat structure.** Rejected: fails auditability, knowledge compounds poorly, no governance layer for autonomous decision-making.

2. **Minimal change — just add a DECISIONS/ folder.** Rejected: without VALUES.md and ECONOMICS.md, decisions lack principled framework.

3. **Full Notion migration.** Rejected: adds latency, external dependency, and defeats "everything in git" principle.

## Cost/Benefit

| Factor | Impact |
|---|---|
| Time to create | ~30 min (directories + 6 files) |
| Ongoing maintenance | ~5-10 min/week (append decisions, update economics) |
| Risk reduction | High — clear boundaries prevent unauthorized spend, provide recovery paths |
| Decision velocity | Medium — upfront cost, but faster decisions in future with clear context |
| Auditability | High — every decision, experiment, and incident has a home |

## Risks

1. **Documentation rot** — living documents must be updated or they become stale. Mitigation: cron jobs reference these docs; stale content surfaces during execution.
2. **Overhead** — too much process slows execution. Mitigation: only 4 initial documents; new ones added only when a gap is found.
3. **Mike disengagement** — if Mike ignores governance docs, they're dead. Mitigation: docs are structured for AI consumption first, human readability second.

## Dependencies

- None. All files are new, no existing system depends on them.
- Future work: wire daily briefing cron to read MISSION.md, VALUES.md, ECONOMICS.md, and ORGANIZATION.md as context.

## Outcome

Nebula now operates with a governance layer that enables autonomous decision-making within clearly defined boundaries. The CEO Agent can make financial, operational, and strategic decisions by referencing these living documents instead of asking Mike.

## Audit Trail

- `git log` for file creation timestamps
- This document is committed to `governance/DECISIONS/DEC-0001-autonomous-business-os-architecture.md`
