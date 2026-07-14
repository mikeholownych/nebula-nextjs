# Nebula Agentic SEO/AEO System — Implementation Plan

Based on the 7 requirements outlined, mapping existing skills to each requirement and identifying gaps.

---

## 1. Site Rulebook (AI reads every time)

**What**: Target pages, priority keywords, brand voice, AI brand description. Written once, no re-explaining.

**Existing**: 
- Memory system (honcho) stores user preferences and brand facts
- Site configs in `agentic_server.py` (lines 14-43) define pages/priorities
- llms.txt at site root for AI consumption

**Gap**: Need structured brand voice/positioning document loaded as site-wide context.

**Implementation**:
```
/memory/sites/nebulacomponents.shop/
  ├── brand-voice.md        # Tone, style, positioning
  ├── target-pages.json     # Priority pages with intent
  ├── keywords.json         # Target keywords by funnel stage
  └── ai-description.md     # How AI should describe Nebula
```

Load via memory tool at session start.

---

## 2. Reusable Workflows

**What**: Pre-built playbooks for content gap audits, CTR recovery, schema checks, AI citation gap analysis.

**Existing Skills**:
- `content-gap-analysis` — competitor-relative coverage map
- `content-refresher` — traffic/ranking decay recovery
- `schema-markup-generator` — JSON-LD generation
- `geo-content-optimizer` — AI citation readiness
- `meta-tags-optimizer` — CTR optimization

**Gap**: Need workflow composition layer (multi-skill orchestration).

**Implementation**:
Create top-level workflow skills that compose existing skills:

```python
# /workflows/ai-visibility-audit/SKILL.md
# Runs: geo-content-optimizer → content-gap-analysis → entity-optimizer
# Output: unified AI visibility report
```

---

## 3. AI Visibility Audit Agent

**What**: Specialized agent that checks: does ChatGPT, Perplexity, Gemini cite you on buyer queries? Who wins when you don't? Runs weekly.

**Existing**:
- `geo-content-optimizer` — optimizes for AI citations
- `rank-tracker` — includes AI-response checks
- `alert-manager` — could monitor AI citation loss

**Gap**: Need active polling/monitoring of AI engines for specific queries.

**Implementation**:

```python
# New skill: ai-visibility-monitor
# 1. Poll ChatGPT, Perplexity, Gemini with buyer queries
# 2. Extract cited brands from responses
# 3. Build citation share leaderboard
# 4. Detect when competitors win citations you don't
# 5. Weekly cron: Sunday 9am, deliver to Telegram
```

Cron setup:
```bash
hermes cron schedule \
  --schedule "0 9 * * 0" \
  --prompt "Run ai-visibility-monitor for nebulacomponents.shop" \
  --deliver telegram
```

---

## 4. Specialized Agents

**What**: Mini setups for content, technical health, GSC data, AI citation. Work in background, report back.

**Existing Skills**:
- `on-page-seo-auditor` — content agent
- `technical-seo-checker` — technical health agent
- `content-quality-auditor` — content QA
- PerformanceReporter — GSC data agent

**Gap**: Need agent orchestration framework (parallel execution, reporting consolidation).

**Implementation**:

```
# Agent definitions (cron jobs):
/content-agent → Monday 10am, audits top 10 pages
/technical-agent → Wednesday 10am, runs technical-seo-checker
/gsc-agent → Friday 10am, extracts GSC metrics + anomalies
/ai-citation-agent → Sunday 10am, runs ai-visibility-monitor

# Consolidation:
/weekly-brief → Sunday 6pm, aggregates all agent reports into CEO memo
```

---

## 5. Shortcuts

**What**: One-word triggers: /audit, /visibility, /refresh.

**Existing**: Skills are already invoked by name (`skill_view("rank-tracker")`).

**Gap**: Need alias system for common workflows.

**Implementation**:

Add to memory as aliases:
```json
{
  "/audit": "Run on-page-seo-auditor + content-quality-auditor",
  "/visibility": "Run ai-visibility-monitor",
  "/refresh": "Run content-refresher for top decay pages",
  "/gap": "Run content-gap-analysis",
  "/health": "Run technical-seo-checker"
}
```

---

## 6. Automations

**What**: Monday ranking check, Wednesday AI citation scan, Friday content brief. Runs whether you remember or not.

**Existing**:
- Cron jobs can schedule recurring tasks
- Alert-manager sets up threshold notifications
- Watchers poll external sources

**Implementation**:

```bash
# Monday 8am: Ranking check
cronjob schedule '0 8 * * 1' \
  --prompt "Run rank-tracker for nebulacomponents.shop, summarize deltas"

# Wednesday 8am: AI citation scan
cronjob schedule '0 8 * * 3' \
  --prompt "Run ai-visibility-monitor, deliver top 5 citation gaps"

# Friday 8am: Content brief
cronjob schedule '0 8 * * 5' \
  --prompt "Run content-gap-analysis, produce Monday content brief"
```

---

## 7. Site-Specific Rules

**What**: Different rules for different sites/clients. Site A's targets don't bleed into Site B.

**Existing**:
- Memory has `profile` parameter (isolation per profile)
- Honcho has peer isolation
- `agentic_server.py` has `SITE_CONFIGS` dict

**Implementation**:

```
/memory/sites/
  ├── nebulacomponents.shop/
  │   ├── brand-voice.md
  │   ├── keywords.json
  │   └── targets.json
  ├── launchcrate.io/
  │   ├── brand-voice.md
  │   └── targets.json
  └── client-xyz.com/
      └── ...
```

Agent loads site-specific memory based on `--site` flag or context.

---

## Priority Ranking

1. **Site Rulebook** (1-2h) — Foundation for everything else
2. **Shortcuts** (30min) — Immediate UX win
3. **Automations** (2h) — Week 1: ranking + citation scans
4. **AI Visibility Monitor** (4-6h) — Core differentiator
5. **Specialized Agents** (2h) — Wire existing skills into cron
6. **Reusable Workflows** (3h) — Compose skills into meta-workflows
7. **Site-Specific Rules** (1h) — Multi-tenancy foundation

---

## Next Step

**Start with**: Site Rulebook + Shortcuts (foundation + quick win)

1. Create `/memory/sites/nebulacomponents.shop/` structure
2. Document brand voice, keywords, AI description
3. Add shortcut aliases to memory
4. Test: `/audit` triggers proper workflow
