# /score - Score Prospect ICP Fit

Evaluate against buying triggers:
- Spending on ads? (paid traffic, ad spend, google ads, meta ads, campaigns)
- Bleeding on conversions? (zero conversions, no sales, not converting, no leads)
- Has a landing page? (live URL or offer page to audit)

Score 0-100:
- 80-100: Red alert - contact immediately
- 50-79: Warm - queue for today's outreach
- 20-49: Tepid - research first, need more signal
- 0-19: Not ICP - do not contact

Return: score, trigger match (list), gap (list for missing triggers), recommendation, and exactly one offer route:
- `free_audit_to_kit`: paid traffic + weak conversions, but no explicit mismatch evidence yet
- `one_leak_kit`: explicit ad/page mismatch or one high-impact conversion leak
- `pro_monitoring`: recurring conversion concern, repeated traffic, or need to watch regressions
- `growth_or_agency`: multiple pages, client workspaces, or team/agency operating context

Use the offer–trigger test matrix in `growth_system/offer-trigger-test-matrix.md` to record the pairing and downstream outcome. Never route from industry alone, and never count an unqualified reply as success.