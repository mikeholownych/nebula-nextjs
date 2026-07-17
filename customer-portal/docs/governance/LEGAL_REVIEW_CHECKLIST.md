# Legal Review Checklist

> **Purpose:** Blocking checklist for legal review before production promotion. Engineering does not self-certify legal compliance.
>
> **Generated:** 2026-07-17 (Task 2)
> **Authority:** Qualified counsel must review before go-live.

---

## Pre-Review Checklist (Engineering)

Complete these items before submitting for legal review:

- [ ] All public claims in `/docs/governance/CLAIM_REGISTER.md` have evidence links
- [ ] All routes in `/docs/governance/ROUTE_REGISTER.md` have owner and canonical URL
- [ ] All data fields in `/docs/governance/DATA_REGISTER.md` have lawful basis and retention
- [ ] No fabricated testimonials, ratings, or case studies in any public route
- [ ] Stripe Price IDs match in `/pricing`, `/checkout`, schema, and terms
- [ ] No countdown timers or false urgency
- [ ] `/privacy-policy` exists and is linked from footer
- [ ] `/terms` exists and includes refund/guarantee language
- [ ] `/data-rights` exists and links from privacy policy
- [ ] `/unsubscribe` one-click link in all marketing emails
- [ ] GA4 consent default is denied
- [ ] No raw card data in application systems

---

## Legal Review Required

Submit to qualified counsel for review of:

### 1. Legal Entity Disclosure

| Item | Status | Notes |
|------|--------|-------|
| Legal entity name | **PENDING** | Must match Stripe/business registration |
| Jurisdiction | **PENDING** | Province/state/country of registration |
| Business registration number | **PENDING** | If applicable |
| Registered address | **PENDING** | May use Registered Agent service |

**Route:** `/about`, `/terms`, `/privacy-policy`, footer

---

### 2. Privacy Policy

| Requirement | Status | Notes |
|-------------|--------|-------|
| Data controller identity | **PENDING** | Legal entity name |
| DPO/contact | **PENDING** | Email or contact form |
| Lawful basis per field | Documented | See DATA_REGISTER.md |
| Processor list | Documented | See DATA_REGISTER.md |
| International transfers | **PENDING** | Specify SCCs or adequacy decision |
| Cookie policy | **PENDING** | GA4 + functional cookies |
| Retention periods | Documented | See DATA_REGISTER.md |
| Data subject rights | Documented | See DATA_REGISTER.md |
| Complaint mechanism | **PENDING** | Supervisory authority or internal |

**Route:** `/privacy-policy`

---

### 3. Terms of Service

| Requirement | Status | Notes |
|-------------|--------|-------|
| Service description | **PENDING** | Audit + consulting |
| Payment terms | **PENDING** | Stripe Payment Link terms |
| Refund/guarantee | **PENDING** | Must match Stripe policy |
| Limitation of liability | **PENDING** | Consult counsel |
| IP assignment | **PENDING** | Audit deliverables |
| Termination | **PENDING** | Service termination rights |
| Governing law | **PENDING** | Jurisdiction for disputes |
| Force majeure | **PENDING** | Standard clause |

**Route:** `/terms`

---

### 4. Refund/Guarantee Policy

| Requirement | Status | Notes |
|-------------|--------|-------|
| Refund window | **PENDING** | Must match Stripe policy |
| Refund process | **PENDING** | Email or self-serve |
| No-refund conditions | **PENDING** | Deliverable consumed, etc. |
| Chargeback policy | **PENDING** | Reference Stripe |

**Routes:** `/terms`, `/pricing`, `/checkout`

**Note:** Task 1 removed all "money-back guarantee" claims pending legal review.

---

### 5. Cookie/ePrivacy Compliance

| Requirement | Status | Notes |
|-------------|--------|-------|
| Cookie banner | **PENDING** | GA4 consent mode v2 |
| Essential cookies | **PENDING** | Session, CSRF |
| Analytics cookies | **PENDING** | GA4 (marketing consent) |
| Cookie duration | **PENDING** | Max 12 months |
| ePrivacy consent | **PENDING** | Before setting non-essential |

**Route:** Cookie banner component, `/privacy-policy`

---

### 6. CAN-SPAM/GDPR Email Compliance

| Requirement | Status | Notes |
|-------------|--------|-------|
| Sender identity | **PENDING** | AgentMail sender address |
| Physical address | **PENDING** | In footer |
| One-click unsubscribe | Implemented | `/unsubscribe` |
| Suppression list | Implemented | PostgreSQL `suppression` table |
| Consent recording | Implemented | Timestamp + IP |
| No purchased lists | Confirmed | All leads from organic/boundary sources |

**Route:** All outbound emails

---

### 7. Agency/White-Label Fair Use

| Requirement | Status | Notes |
|-------------|--------|-------|
| Resale rights | **PENDING** | Agency partner terms |
| Branding requirements | **PENDING** | White-label vs co-brand |
| Rate limits | **PENDING** | Fair use clause |
| Support scope | **PENDING** | Agency vs end-client |

**Route:** `/agency-partner` (currently quarantined)

---

### 8. Testimonials/Case Studies

| Requirement | Status | Notes |
|-------------|--------|-------|
| Written permission | **PENDING** | Per testimonial |
| Fact check | **PENDING** | Specific outcomes verified |
| No cherry-picking | **PENDING** | Representative sample |
| Disclosure | **PENDING** | Material connection |

**Route:** `/about`, `/about/team` (currently neutral)

---

### 9. Data Processing Agreements

| Processor | DPA Signed | Status |
|-----------|------------|--------|
| Stripe | Yes | Automatic on account creation |
| AgentMail | **PENDING** | Verify DPA on file |
| RB2B | **PENDING** | B2B context exemption? |
| Google Analytics | **PENDING** | Google Terms of Service |

---

### 10. Accessibility (WCAG 2.2 AA)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Automated axe-core | Implemented | Critical routes |
| Manual keyboard nav | **PENDING** | Expert review |
| Screen reader test | **PENDING** | Expert review |
| Color contrast | Implemented | Design system |
| Focus indicators | Implemented | Design system |

**Route:** All production routes

---

## Submission Checklist

Before submitting to counsel:

- [ ] Print this document with status fields completed
- [ ] Attach CLAIM_REGISTER.md, DATA_REGISTER.md, ROUTE_REGISTER.md
- [ ] Provide links to live routes: `/`, `/pricing`, `/checkout`, `/privacy-policy`, `/terms`, `/data-rights`
- [ ] Provide Stripe Dashboard screenshot (Price IDs)
- [ ] Provide AgentMail API docs link
- [ ] Provide RB2B integration spec

---

## Counsel Sign-Off

| Review Area | Approved | Date | Counsel |
|-------------|----------|------|---------|
| Legal entity | [ ] | | |
| Privacy policy | [ ] | | |
| Terms of service | [ ] | | |
| Refund/guarantee | [ ] | | |
| Cookie/ePrivacy | [ ] | | |
| Email compliance | [ ] | | |
| Agency terms | [ ] | | |
| Testimonials | [ ] | | |
| DPAs | [ ] | | |
| Accessibility | [ ] | | |

**Final approval required before:**
- Task 14 (content resumption)
- Any public claim re-enablement

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-07-17 | Initial LEGAL_REVIEW_CHECKLIST.md created (Task 2) | Hermes |
