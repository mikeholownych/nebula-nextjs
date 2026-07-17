# Data Register

> **Purpose:** Authoritative inventory of all personal data fields with lawful basis, provenance, processor mapping, retention, and deletion mechanisms.
>
> **Generated:** 2026-07-17 (Task 2)
> **Regulatory scope:** GDPR, CCPA/CPRA, CAN-SPAM, ePrivacy

---

## Data Fields

### Email Address

| Field | Purpose | Lawful Basis | Source | Processors | Retention | Deletion | Access Role |
|-------|---------|--------------|--------|------------|-----------|----------|-------------|
| `email` (audit request) | Deliver audit results | Legitimate interest (audit fulfillment) | User submission | AgentMail (api.agentmail.to) | 90 days post-delivery | `/data-rights` form or API | Mike (founder) |
| `email` (lead capture) | Outreach sequence | Explicit consent checkbox | User submission | AgentMail, PostgreSQL | 90 days or unsubscribe | `/data-rights` form + `/unsubscribe` | Mike (founder) |
| `email` (payment) | Receipt + support | Legitimate interest (payment fulfillment) | Stripe webhook | Stripe, AgentMail | 7 years (tax/chargeback) | Stripe dashboard + `/data-rights` | Mike (founder) |

### Name

| Field | Purpose | Lawful Basis | Source | Processors | Retention | Deletion | Access Role |
|-------|---------|--------------|--------|------------|-----------|----------|-------------|
| `name` (lead) | Personalization | Explicit consent | User submission | AgentMail, PostgreSQL | 90 days or unsubscribe | `/data-rights` form | Mike (founder) |
| `name` (payment) | Billing + support | Contract performance | Stripe checkout | Stripe | 7 years (tax/chargeback) | Stripe dashboard | Mike (founder) |

### Phone Number

| Field | Purpose | Lawful Basis | Source | Processors | Retention | Deletion | Access Role |
|-------|---------|--------------|--------|------------|-----------|----------|-------------|
| `phone` (payment) | Fraud prevention (Stripe) | Legitimate interest | Stripe checkout | Stripe | 7 years (tax/chargeback) | Stripe dashboard | Mike (founder) |

**Note:** Phone is only collected through Stripe. Nebula does not directly process phone numbers.

### Website URL

| Field | Purpose | Lawful Basis | Source | Processors | Retention | Deletion | Access Role |
|-------|---------|--------------|--------|------------|-----------|----------|-------------|
| `landing_page_url` (audit) | Run audit | Legitimate interest | User submission | Playwright (local), PostgreSQL | 90 days post-audit | `/data-rights` form | Mike (founder) |
| `website` (lead) | Outreach personalization | Explicit consent | User submission | PostgreSQL | 90 days or unsubscribe | `/data-rights` form | Mike (founder) |

### RB2B Visitor Data

| Field | Purpose | Lawful Basis | Source | Processors | Retention | Deletion | Access Role |
|-------|---------|--------------|--------|------------|-----------|----------|-------------|
| `rb2b.email` | Lead identification | Legitimate interest (B2B visitor tracking) | RB2B webhook | PostgreSQL | 90 days | `/data-rights` form | Mike (founder) |
| `rb2b.company` | Lead scoring | Legitimate interest | RB2B webhook | PostgreSQL | 90 days | `/data-rights` form | Mike (founder) |
| `rb2b.page_views` | Lead scoring | Legitimate interest | RB2B webhook | PostgreSQL | 90 days | `/data-rights` form | Mike (founder) |

**Note:** RB2B is disabled pending signed webhook verification (Task 9). Unsigned events are rejected.

### Analytics Data

| Field | Purpose | Lawful Basis | Source | Processors | Retention | Deletion | Access Role |
|-------|---------|--------------|--------|------------|-----------|----------|-------------|
| GA4 client ID | Analytics measurement | Consent (default denied) | Browser cookie | Google Analytics | 26 months | Browser GA4 opt-out | Mike (founder) |
| Session ID | Analytics measurement | Consent (default denied) | Browser cookie | Google Analytics | 26 months | Browser GA4 opt-out | Mike (founder) |

---

## Processors

| Processor | Purpose | DPA Signed | Location | Data | Sub-processors |
|-----------|---------|------------|----------|------|----------------|
| Stripe | Payment processing | Yes (via Stripe checkout) | US/IE | Email, name, payment info | AWS, payment networks |
| AgentMail | Email delivery | Yes (api.agentmail.to) | US | Email, name | AWS |
| RB2B | B2B visitor identification | Yes (RB2B.io) | US | Email, company, page views | AWS |
| PostgreSQL (local) | Application database | No (self-hosted) | CA | Email, URL, leads, audit data | None |
| Redis (local) | Session/rate-limit | No (self-hosted) | CA | Session tokens | None |

---

## Retention Policies

| Category | Retention | Rationale | Enforcement |
|----------|-----------|-----------|-------------|
| Lead (active) | 90 days | Outreach is time-sensitive | Cron job: `delete_stale_leads.py` |
| Lead (unsubscribed) | 30 days | CAN-SPAM suppression | Cron job: `suppression_list.py` |
| Audit data | 90 days post-delivery | Audit evidence is perishable | Cron job: `delete_old_audits.py` |
| Payment data | 7 years | Tax/chargeback/legal | Stripe dashboard + manual |
| Analytics data | 26 months | GA4 default | GA4 auto-expiry |
| Session tokens | 24 hours | Security | Redis TTL |

---

## Data Subject Rights

| Right | Endpoint | Implementation |
|-------|----------|----------------|
| Access | `/data-rights` | Form → email with exported data |
| Rectification | `/data-rights` | Form → manual review + SQL update |
| Erasure | `/data-rights` | Form → verify identity → delete from PostgreSQL |
| Objection | `/unsubscribe` | One-click → suppression list |
| Portability | `/data-rights` | Form → email with JSON export |

---

## Third-Party Sharing

| Recipient | Purpose | Data | Legal Basis |
|-----------|---------|------|-------------|
| Stripe | Payment processing | Email, name, payment info | Contract performance |
| AgentMail | Email delivery | Email, name | Contract performance |
| RB2B | Lead identification | Email, company | Legitimate interest (B2B) |
| AI models (OpenAI, etc.) | Audit generation | Landing page URL | Legitimate interest |

**Note:** We do NOT sell or share personal data with advertisers or data brokers.

---

## Validation Rules

1. **Every data field** must have:
   - Lawful basis documented
   - Processor list
   - Retention period
   - Deletion mechanism

2. **Consent fields** (email capture) must:
   - Default to unchecked
   - Record consent timestamp and IP
   - Allow one-click unsubscribe

3. **RB2B events** must:
   - Have valid HMAC signature
   - Be rejected if unsigned

4. **No raw card data** in application systems
   - Stripe Checkout handles all card data
   - Webhook is the only payment authority

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-07-17 | Initial DATA_REGISTER.md created (Task 2) | Hermes |
