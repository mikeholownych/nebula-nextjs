# Content Governance & Claim Verification Policy - Nebula Components

**Domain**: `nebulacomponents.shop`
**Governing Standard**: Strict Evidence-Backed Claim Control

---

## 1. Non-Negotiable Claim Rules

1. **No Conversion Guarantees**: Never claim guaranteed conversion increases, fixed revenue ROI percentages, or automatic sales improvements.
2. **No Turnaround Understatement**: Never publish "60 seconds", "30 minutes", or "instant" turnaround claims. Use accurate descriptions ("runs in seconds", "under two minutes", "real-time inspection").
3. **No Decorative Proof or Fake Metrics**: Never publish fabricated customer results, fake testimonials, unverified star ratings, or invented benchmark stats.
4. **No Generic AI Positioning**: Positioning must frame Nebula as an evidence-backed landing page audit tool for paid traffic conversion leaks, not a generic "AI audit" or "AI generator".
5. **No Em Dashes in User-Facing Copy**: Avoid em dashes (`-`) in user-facing title tags, metadata descriptions, headings, body text, or alt text.
6. **No Thin Programmatic Pages**: Every published URL must contain substantive, actionable diagnostic guidance, clear symptom breakdown, and verified code/DOM inspection logic.

---

## 2. Claim Classification Framework

Every copy block must pass internal claim verification:
- **Directly Verified**: Backed by actual backend audit code (`audit_evidence.py` DOM inspection).
- **Diagnostic Guidance**: Grounded in recognized CRO/UX principles and observable page mechanics.
- **Inference**: Clear hypothesis clearly labeled as needing campaign testing.
- **Prohibited / Unsupported**: Arbitrary claims, guarantees, or synthetic numbers. Must be excised.

---

## 3. Deployment & Review Protocol

Before any new route or content change is deployed to production:
1. Product Truth Audit: Verify all claims map to backend system capabilities.
2. Character & Syntax Audit: Ensure titles fit 50-60 chars (or pass test gates), no em dashes, valid canonical URLs.
3. Automated Quality Gate: Run full test suite (`npm run ci`).
