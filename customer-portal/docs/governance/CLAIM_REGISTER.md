# Claim Register

> **Purpose:** Authoritative inventory of all public-facing claims with evidence provenance, approval status, and expiry.
>
> **Generated:** 2026-07-17 (Task 2)
> **Policy:** Unsupported metrics, ratings, anonymous testimonials, and fabricated case studies remain excluded.

---

## Active Claims

### Product Claims

| Claim | Evidence | Source | Date | Approval | Expiry | Used In |
|-------|----------|--------|------|----------|--------|---------|
| "$147 Conversion Fix Pack" | Stripe Price ID: price_1Rgxxx | Stripe Dashboard | 2026-07-15 | Mike (founder) | — | `/pricing`, `/checkout`, schema |
| "Stripe Payment Link checkout" | https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b | Stripe Dashboard | 2026-07-15 | Mike (founder) | — | `/checkout`, `/pricing` |
| "GA4 measurement ID: G-KJ9S3450LH" | GA4 Property | Google Analytics | 2026-07-15 | Mike (founder) | — | `app/layout.tsx` |

### Service Claims

| Claim | Evidence | Source | Date | Approval | Expiry | Used In |
|-------|----------|--------|------|----------|--------|---------|
| "Landing page audit scoring" | Service definition | Service description | 2026-07-16 | Mike (founder) | — | `/audit`, schema |
| "Evidence-backed audit results" | Service promise | Service description | 2026-07-16 | Mike (founder) | — | `/about` |

---

## Excluded Claims (Removed in Task 1)

The following claims were removed from public surfaces because they lacked evidence, approval, or verifiable source records.

| Claim | Reason | Removal Date | Routes Cleaned |
|-------|--------|--------------|----------------|
| "60-second audit" | Unsupported metric; audit engine rebuild in progress | 2026-07-16 | `/`, `/audit`, `/about`, `/7-systems`, schema |
| "Find the leak in 60 seconds" | Unsupported claim | 2026-07-16 | `app/layout.tsx` metadata |
| "$2.3M in recovered revenue" | Anonymous/unevidenced | 2026-07-16 | `/about`, `/about/team` |
| "200+ landing pages audited" | Anonymous/unevidenced | 2026-07-16 | `/about`, `/about/team` |
| "95% of ads can't pass audit" | Fabricated statistic | 2026-07-16 | `/audit-lander`, `/audit` |
| "450+ case studies" | Fabricated count | 2026-07-16 | `/`, `/about` |
| "4.9/5 customer rating" | No source, no reviews | 2026-07-16 | `/`, `/about` |
| "Trusted by 200+ founders" | Anonymous testimonials | 2026-07-16 | `/`, `/about` |
| Case study: "ecommerce-example-com" | Fabricated case study | 2026-07-16 | `/case-studies/[slug]`, schema |
| "Real conversion data" | No source | 2026-07-16 | `/demo`, `/audit-dashboard` |
| "$97 audit" | Retired price, misleading | 2026-07-16 | `/create-97-checkout`, `/launch-page-97` |
| "$7 audit (limited)" | Expired offer, countdown | 2026-07-16 | `/generator`, `/accessible-nebula` |
| "$997 growth launch" | Unverified fulfillment | 2026-07-16 | `/growth-launch`, `/growth-launch-confirmation` |
| "Money-back guarantee" | Unsupported legal | 2026-07-16 | Multiple routes |
| "24-hour response time" | Unsupported SLA | 2026-07-16 | `/ai-ops-retainer` |

---

## Claim Validation Rules

1. **Price claims** must be synchronized across:
   - Stripe Price ID
   - `/pricing` page
   - `/checkout` page
   - Schema (`offers` JSON-LD)
   - Terms of Service

2. **Customer proof claims** require:
   - Customer name (or verified pseudonym)
   - Written permission on file
   - Specific outcome (not vague "increased conversions")
   - Evidence link or document

3. **Performance claims** require:
   - Measurement methodology documented
   - Sample size and date range
   - Confidence interval or qualifier

4. **Rating/review claims** require:
   - Platform URL (Google, Trustpilot, etc.)
   - Minimum review count
   - No cherry-picking

5. **Expiry:**
   - All claims with date-specific evidence expire in 90 days
   - Expired claims must be removed or re-validated

---

## Approval Workflow

1. **Draft claim** with evidence link and proposed copy
2. **Evidence check** by independent reviewer
3. **Legal review** if claim involves:
   - Financial outcomes
   - Customer identity
   - Competitive comparison
   - Guarantee/refund terms
4. **Approval** recorded with date and approver
5. **Deploy** to approved routes only
6. **Monitor** for drift or expiry

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-07-17 | Initial CLAIM_REGISTER.md created (Task 2) | Hermes |
| 2026-07-16 | Removed all unevidenced claims from public routes (Task 1) | Hermes |
