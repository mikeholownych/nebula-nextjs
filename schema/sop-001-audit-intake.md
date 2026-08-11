# SOP-001: Audit Intake
**Owner:** Acquisition Plane → Mike (manual) / n8n (automated)
**Service Target:** < 5 min from submission to audit start

## Trigger
User submits a URL via:
- Public audit form (`/audit` on nebulacomponents.shop)
- Direct POST to `POST /webhook/audit-inbound` (n8n webhook)
- Reddit/outbound reply offering audit

## Required Inputs
| Field | Required | Source |
|-------|----------|--------|
| URL | Yes | Form, webhook, manual entry |
| Email | No | Form or webhook (empty = anonymous audit) |
| Source identifier | Yes | UTM, post_id, or channel tag |
| Consent status | Yes | Default "pending" for webhook, "granted" for form |
| Name | No | Optional from form |

## Validation Rules
1. URL must be valid HTTP/HTTPS - reject `localhost`, `127.0.0.1`, private IP ranges, `10.x`, `172.16-31.x`, `192.168.x`
2. Domain must resolve (check DNS A/AAAA records)
3. Site must be accessible - return HTTP 200 on GET
4. Content-Type must be HTML - reject PDFs, images, binary downloads
5. Crawl must not be blocked by `/robots.txt` on audit-relevant paths
6. Language must be primarily English (ISO 639-1 detection)
7. Maximum submission rate: 3/hour per email or IP

## Procedure
1. Normalize URL (strip trailing slash and fragments, lowercase host)
2. Create or look up `prospects` record by email
   - If new: `prospect_id = gen_random_uuid()`, `lifecycle_state = 'audit_requested'`
   - If existing: update `lifecycle_state`, preserve provenance
3. Create `web_properties` record (dedup by domain)
4. Create `audits` record with `status = 'pending'`
5. Set `audits.started_at = now()`
6. Execute audit engine:
   a. Fetch page via headless browser (30s timeout)
   b. Capture HTML, screenshot, metadata
   c. Run rule engine against captured state
   d. Write `findings` records
   e. Set `audits.completed_at = now()`, `audits.status = 'completed'`
7. Publish event: `audit.completed` with `correlation_id`
8. Advance prospect to `audit_completed` state

## Decision Points
- **URL invalid or unreachable →** set `audits.status = 'failed'`, `audits.error_message = reason`, log event `audit.failed`, route to manual review queue
- **Crawl blocked by robots.txt →** attempt browser render fallback; if still blocked, mark as `failed` with reason "blocked by robots.txt"
- **Email already exists →** merge into existing prospect record, do not duplicate

## Outputs
- `prospect_id` (UUID)
- `audit_id` (UUID)
- Normalized URL
- Findings array (each with `finding_id`, severity, confidence, evidence)
- Event log entries

## Evidence Produced
- `findings` table rows with full evidence JSONB
- `audits` record with timestamps and version
- Event: `audit.completed` with `audit_id` in payload

## Failure States
| Failure | Behavior |
|---------|----------|
| Invalid URL | Return 400, log event `audit.failed`, no DB changes |
| Timeout (30s) | Retry once with browser rendering; if both fail, mark failed |
| DNS failure | Return "Domain not found", mark failed |
| JavaScript render failure | Return partial results if HTML available; mark crawled_with_errors in evidence |
| Auth wall | Return "Authentication required", mark failed |
| Rate limit exceeded | Return 429, set audits.status = 'waiting' |

## Escalation Path
- **2+ consecutive failures for same prospect →** route to Mike for manual review
- **New or unusual business model →** flag for Mike before qualification
- **Stripe payment failure on x402 →** log event `audit.x402_failed`, return "Payment declined by network"

## Automation Readiness Gate
- [ ] Deterministic trigger: YES - form submission or webhook POST
- [ ] Structured inputs: YES - validated URL + optional email + source
- [ ] Bounded output: PARTIAL - findings are variable in count but schema is fixed
- [ ] Explicit failure handling: YES - all failure modes defined above
- [ ] Observable execution: YES - audits table + events table
- [ ] Reversibility: YES - audits can be re-run, old records are preserved
- [ ] Stable decision rule: YES - URL validation and crawl rules are objective
