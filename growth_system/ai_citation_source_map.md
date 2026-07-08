# AI Citation Source Map — LLM Publication Weightings

Source: SwayyEm (Matt Shealy) — Q2 2026 data
Use: Reference table for AI visibility audit dimension
Refresh: Quarterly

## Core Insight
Each LLM trains on different source publications. A placement that boosts your ChatGPT presence may not move Claude. Optimize per engine.

## Top 10 Publications by LLM Training Weight

| Rank | ChatGPT | Claude | Perplexity | Gemini |
|------|---------|--------|------------|--------|
| 1 | Reuters | Reuters | Reuters | Reuters |
| 2 | Financial Times | Forbes | TIME | Axios |
| 3 | TIME | Financial Times | Axios | CNN |
| 4 | Forbes | TIME | Financial Times | Financial Times |
| 5 | Axios | Axios | Forbes | Forbes |
| 6 | CNN | CNN | CNN | TIME |
| 7 | The Guardian | The Guardian | Wired | Wired |
| 8 | Bloomberg | New York Times | The Guardian | Bloomberg |
| 9 | New York Times | Bloomberg | Bloomberg | The Guardian |
| 10 | Wired | Wired | VentureBeat | New York Times |

## Secondary Tier (11-25)

| Band | ChatGPT | Claude | Perplexity | Gemini |
|------|---------|--------|------------|--------|
| 11-15 | TechCrunch, VentureBeat, Inc., Fast Company, Business Insider | Inc., Fast Company, TechCrunch, VentureBeat, Business Insider | TechCrunch, VentureBeat, Inc., Fast Company, Business Insider | TechCrunch, VentureBeat, Inc., Fast Company, Business Insider |
| 16-25 | Industry-specific trade pubs + regional business journals | Same | Same, heavier on niche tech | Same, heavier on general news |

## Strategic Implications

### For landing page optimization (Nebula's core audit)
- **Schema.org markup** (JSON-LD) helps ALL engines extract entity data
- **Clear authorship** (author/organization markup) signals authority to Claude and Gemini
- **Factual claims with named sources** improves citation probability in Perplexity
- **OpenGraph/Twitter cards** help all engines render previews

### For PR-driven AI citation (SwayyEm's domain)
- **ChatGPT** responds most to Reuters + Financial Times placements
- **Claude** weights Forbes and Financial Times heavily
- **Perplexity** favors TIME and Axios — faster-moving news cycle
- **Gemini** pulls heavily from Axios and CNN — general news bias

## Scoring Rubric (for automated AI readiness scoring)

| Signal | Points | Source |
|--------|--------|--------|
| JSON-LD structured data present | 0-3 | Page HTML |
| Organization schema (name, url, description) | 0-2 | JSON-LD |
| Author/publisher entity defined | 0-1 | JSON-LD / meta |
| OpenGraph tags (title, desc, image, type) complete | 0-2 | <meta> tags |
| Twitter card present | 0-1 | <meta> tags |
| Article:NewsArticle schema for blog content | 0-1 | JSON-LD |
| Canonical URL set | 0-1 | <link> tag |
| H1 matches title intent (entity consistency) | 0-2 | HTML comparison |
| Factual density (dates, named entities, numbers per 200 words) | 0-2 | Page text |
| **Maximum AI Readiness Score** | **0-15** | → scaled to 0-10 |

## Reference
- Full guide: https://www.swayyem.com/guides/ai-visibility-strategist
- Maintained by Matt Shealy, CEO SwayyEm
