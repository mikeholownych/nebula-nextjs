# last30days Nebula Lead-Discovery Benchmark

**Date:** 2026-07-13  
**Upstream commit:** `4b027919c76e24ac27875c854bfd9f57c0b7cb69`  
**Decision:** Do not install as a production lead source. Retain as an optional research candidate.

## Query

> founders who spent money on ads and got zero conversions

Thirty-day window ending 2026-07-13. Browser cookies disabled. No paid source credentials used. Sources: Reddit, Hacker News, GitHub. The query plan targeted:

- explicit ad spend + zero conversions
- paid clicks + no sales
- landing pages failing on paid traffic

## Results

| Run | Retrieved | Strict trigger-qualified | Contactable qualified leads |
|---|---:|---:|---:|
| Quick | 8 | 0 | 0 |
| Default | 30 | 0 | 0 |
| Nebula Jul 13 baseline | 4 | 4 | 4 |

The default run returned 24 Hacker News items, 5 GitHub items, and 1 Reddit item. Most were lexical false positives around “spent” or “ads,” including election spending, advertising-policy stories, and unrelated GitHub digests. The source-status layer correctly reported all three sources as operational; this was a relevance failure, not an infrastructure failure.

Nebula's existing trigger pipeline currently contains 121 trigger records and 17 email-enriched leads. The July 13 IndieHackers batch produced four leads and four emails.

## Additional finding: Nebula's ICP gate was too permissive

The benchmark exposed a local defect: `check_icp_fit()` accepted any text containing an advertising term, even without first-person pain or a conversion failure. It incorrectly qualified headlines such as:

> Crypto firms have spent $189M so far on 2026 US election

Fixed behavior now requires one of:

1. ad-spend signal **and** zero-conversion signal;
2. founder signal **and** conversion pain;
3. founder signal **and** explicit landing-page feedback request.

Source labels no longer bypass missing trigger evidence. Added `zero sales` to the conversion-failure vocabulary.

## Adoption decision

- **Production lead discovery:** reject. Zero qualified/contactable leads versus Nebula's four.
- **Market/competitor research:** potentially useful because its source-health, citation, freshness, and watchlist architecture is strong.
- **Next evaluation:** only revisit after X/YouTube are deliberately configured, then benchmark on market intelligence—not contact acquisition.
