# Analytics & Telemetry Measurement Plan - Nebula Components

**Domain**: `nebulacomponents.shop`
**Privacy Stance**: Zero PII Logging, GDPR/CCPA Compliant, PostHog Proxied

---

## Event Schema Specification

| Event Name | Trigger | Key Properties | Prohibited Properties | Purpose |
|---|---|---|---|---|
| `homepage_cta_click` | Primary CTA button click on `/` | `target_url`, `button_location` | PII, raw inputs | Track user intent to start audit from homepage |
| `audit_form_viewed` | Audit form rendered on `/audit` | `referrer`, `device_type` | PII | Measure audit funnel entry |
| `audit_started` | User submits URL for audit | `audit_id`, `page_domain` | Full query params, auth tokens | Track audit initialization and domain distribution |
| `audit_validation_failed` | URL submission fails client/server check | `error_code`, `reason` | Raw user string | Monitor form friction and invalid input rates |
| `audit_processing_started` | Backend audit runner starts DOM scan | `audit_id` | Full target HTML | Measure backend processing queue velocity |
| `audit_processing_completed` | Audit DOM evaluation completes | `audit_id`, `score`, `grade` | Target page PII, screenshots | Track audit completion and grade distribution |
| `audit_processing_failed` | Audit engine timeout or fetch error | `audit_id`, `error_type` | Target page credentials | Monitor crawler reliability and host errors |
| `audit_result_viewed` | User loads `/audit/[id]/results` | `audit_id`, `grade`, `score` | Shared tokens, user email | Measure audit engagement and report consumption |
| `pricing_viewed` | User views `/pricing` | `source_route`, `tier_highlighted` | PII | Measure commercial offer discovery |
| `repair_sprint_cta_clicked` | User clicks $97 Repair Sprint button | `audit_id`, `source_page` | Payment tokens | Track checkout funnel intent |
| `checkout_initiated` | Stripe checkout session created | `offer_key`, `amount` | Customer card data | Track payment conversion start |
| `purchase_completed` | Stripe `checkout.session.completed` webhook | `session_id`, `offer_key`, `amount` | Full customer address/PII | Confirm revenue fulfillment and attribution |

---

## Data Governance & Privacy Restrictions
- **No Private Payload Logging**: Full target page HTML, screenshots, and user form inputs beyond domain/URL operate strictly transiently in-memory and are never sent to analytics backends.
- **No Token / Secret Exposure**: Secret tokens (`share_token`, Stripe session secrets, API keys) must never be passed in event properties.
- **Data Retention**: PostHog telemetry is retained for 90 days. Raw database event logs rotate on 30-day windows.
