larger requirements for the overhaul I mentioned:

# Enterprise Customer Workspace / Dashboard Requirements

For a customer application at `app.domain.com`, I would treat the workspace as a **separate product surface and security boundary**, not merely the authenticated version of the marketing site.

The application should eventually become the authoritative place where a customer can answer:

1. What do I own?
2. What has the service done for me?
3. What is happening now?
4. What requires my attention?
5. What did it cost?
6. Who has access?
7. What changed, who changed it, and when?
8. What data does the vendor hold about my organization?
9. How do I configure, export, integrate, or terminate the service?
10. If something goes wrong, what can I see and what can I do?

That framing produces a substantially different application than the typical SaaS "Dashboard / Billing / Settings" shell.

---

# 1. Architectural boundary

### Domains

Recommended separation:

```text
domain.com             Marketing / public content
www.domain.com         Optional canonical marketing host
app.domain.com         Customer application
api.domain.com         Public/customer API
auth.domain.com        Optional centralized identity boundary
docs.domain.com        Documentation
status.domain.com      Public service status
```

Do not make `app.domain.com` a thin route into the marketing application unless there is a compelling architectural reason.

It should have independent:

* deployment lifecycle
* CSP
* authentication controls
* observability
* error handling
* caching rules
* rate limits
* security headers
* release/version identification
* frontend bundle
* runtime configuration

A compromised marketing surface should not automatically imply compromise of the authenticated application.

### Cookie boundary

Avoid:

```text
Domain=.domain.com
```

for sensitive authentication cookies unless cross-subdomain authentication genuinely requires it.

Prefer host-only cookies for:

```text
app.domain.com
```

with:

```text
Secure
HttpOnly
SameSite=Lax or Strict where viable
```

Do not let unrelated subdomains receive session credentials.

---

# 2. Core tenancy model

This is the foundation. If tenancy is wrong, virtually everything built above it becomes suspect.

The application should explicitly model:

```text
User
Organization / Account
Workspace
Membership
Role
Entitlement
Subscription
Resource
Environment
```

Do not conflate `user_id` with `customer_id`.

A person may belong to:

* multiple organizations
* multiple workspaces
* multiple environments
* different roles in each

For example:

```text
Mike
 ├── ACME Corp
 │    ├── Production
 │    └── Sandbox
 │
 └── Example Agency
      ├── Client A
      ├── Client B
      └── Internal
```

Every customer-owned object should have explicit tenant ownership.

At minimum:

```text
organization_id
workspace_id
```

where appropriate.

Tenant authorization must be enforced server-side. Never depend on:

* hidden UI controls
* URL obscurity
* client-side filtering
* React state
* supplied organization identifiers

as access control.

---

# 3. Workspace switching

If multiple organizations/workspaces are possible, provide a persistent workspace selector.

Example:

```text
Nebula

ACME Inc. ▾
Production

Overview
Audits
Monitoring
...
```

Switching context should immediately update:

* authorization scope
* navigation
* entitlements
* resources
* billing context
* API credentials
* integrations
* audit history

The selected context must not merely be cosmetic.

Deep links should retain sufficient context to prevent ambiguity.

---

# 4. Information architecture

A mature workspace would usually converge toward something resembling:

```text
Overview

Product / Service
 ├── Projects
 ├── Audits / Runs / Jobs
 ├── Results
 ├── Monitoring
 └── Reports

Activity
 ├── Activity feed
 ├── Notifications
 └── Audit log

Integrations
 ├── API
 ├── API keys
 ├── Webhooks
 └── Connected services

Organization
 ├── Members
 ├── Teams
 ├── Roles
 └── Invitations

Usage & Billing
 ├── Plan
 ├── Usage
 ├── Invoices
 └── Payment

Settings
 ├── Workspace
 ├── Security
 ├── Notifications
 ├── Data & privacy
 └── Danger zone

Support
 ├── Documentation
 ├── Support requests
 └── Service status
```

The exact nouns should follow the product domain.

Do not create a navigation wall merely because features exist.

---

# 5. Application shell

Every authenticated screen should have a consistent shell containing:

### Global navigation

* organization/workspace identity
* workspace selector
* primary product navigation
* support
* notifications
* account/profile control

### Context

Clearly display:

* current organization
* current workspace
* current environment where applicable

Production versus test/sandbox should be visually difficult to confuse.

### Breadcrumbs

Use where hierarchy exceeds one meaningful level.

Example:

```text
Projects / nebulacomponents.shop / Audit #NC-29384
```

### User menu

Minimum:

* profile
* personal settings
* security
* sessions
* documentation
* support
* sign out

---

# 6. Dashboard / overview

The overview must answer operational questions, not exist to display decorative charts.

Useful modules include:

### Account state

* plan
* subscription state
* trial state
* entitlement status
* outstanding account issue

### Service state

* configured
* partially configured
* degraded
* paused
* action required

### Current operations

* active jobs
* queued jobs
* completed jobs
* failed jobs
* scheduled activity

### Key customer outcomes

Product-specific KPIs.

For Nebula, for example:

```text
Pages monitored
Audits completed
Active findings
Critical findings
Resolved findings
Regressions detected
Current monitored score
Change since baseline
```

### Recent activity

Example:

```text
2h ago   Monitoring detected CTA regression
1d ago   Audit completed
2d ago   Sarah accepted finding NBL-284
3d ago   Stripe subscription renewed
```

### Required actions

This is particularly important.

Example:

```text
Action required

3 findings need review
1 integration requires reconnection
Payment method expires next month
Monitoring configuration incomplete
```

The dashboard should prioritize customer work requiring attention over vanity metrics.

---

# 7. Empty states

Enterprise-quality empty states are surprisingly important.

Never leave users looking at:

```text
No data.
```

An empty state should explain:

* what this section is
* why it is empty
* whether that is expected
* how to populate it
* what permission may be required

Example:

> No monitored pages yet. Add a page to establish a baseline and begin regression monitoring.

with an appropriate CTA.

---

# 8. Onboarding

Onboarding state must be durable and server-side.

Do not depend exclusively on browser `localStorage`.

Recommended onboarding representation:

```text
Organization created        Complete
Primary domain configured   Complete
First project created       Complete
Initial audit               Running
Monitoring configured       Pending
Team invited                Optional
```

Provide:

* progress
* resumability
* contextual instructions
* validation
* skip where genuinely optional
* explicit prerequisites

Do not trap experienced customers in tutorial flows.

---

# 9. Authentication

Minimum supported capabilities:

* email/password if passwords are supported
* secure password reset
* email verification
* MFA
* recovery codes
* session revocation
* device/session inventory
* brute-force protections
* credential stuffing protections
* generic login failure responses

Enterprise roadmap:

* Google/Microsoft login
* SAML
* OIDC
* enforced SSO
* domain verification
* SCIM provisioning

Authentication and authorization are separate requirements.

Successful login does not imply permission to a resource.

---

# 10. MFA

Support at least:

* TOTP

Prefer support for:

* WebAuthn/passkeys
* hardware security keys

Administrators should eventually be capable of enforcing MFA organization-wide.

Expose security state such as:

```text
MFA required
14 / 16 members compliant
2 members pending
```

---

# 11. Session management

Users should be able to inspect active sessions.

Example:

```text
Chrome • Windows
Toronto, Canada
Current session
Last active now

Safari • iPhone
Toronto, Canada
Last active 2h ago
```

Allow:

* revoke individual session
* revoke all other sessions

Server-side revocation must actually invalidate credentials.

---

# 12. Authorization / RBAC

Start with explicit roles.

Typical baseline:

```text
Owner
Administrator
Billing Administrator
Member
Viewer
```

Potential advanced roles:

```text
Developer
Analyst
Auditor
Support Liaison
```

Avoid arbitrary role proliferation without concrete authorization semantics.

Permissions should map to capabilities such as:

```text
workspace.read
workspace.update

member.read
member.invite
member.remove

audit.create
audit.read
audit.delete

billing.read
billing.manage

apikey.create
apikey.revoke

webhook.manage
```

Server-side authorization should evaluate:

```text
Actor
Tenant
Resource
Action
Environment
Entitlement
```

not simply:

```text
role == admin
```

---

# 13. Ownership controls

The system must define:

* who owns the organization
* whether multiple owners are allowed
* how ownership is transferred
* what happens if the owner leaves
* whether the last owner can remove themselves

Block invalid organization states.

For example:

```text
Cannot remove the organization's final owner.
```

---

# 14. Invitations

Provide controlled invitation lifecycle:

```text
Pending
Accepted
Expired
Revoked
```

Requirements:

* cryptographically random tokens
* expiration
* single use
* tenant binding
* email binding where appropriate
* role assignment
* audit trail

Admin interface should show outstanding invitations.

---

# 15. Customer resource lifecycle

Every significant customer object should have explicit state.

For example:

```text
draft
pending
queued
running
completed
failed
cancelled
archived
```

Do not hide asynchronous operations behind indefinite spinners.

Customers should be able to tell:

* what state an operation is in
* when it started
* how long it has been running
* whether intervention is required

---

# 16. Job execution UX

For services performing background jobs, expose execution state.

Example:

```text
Audit #28491

Status       Running
Started      Aug 22, 2026 19:14 EDT
Duration     3m 41s
Target       example.com
Initiated by Mike
```

On failure:

```text
Status: Failed

Reason:
Target could not be reached after 3 attempts.

Last attempt:
19:18:42 EDT

No charge was consumed.

[Retry]
```

Do not translate every backend error directly into raw stack traces.

But equally, do not reduce every error to:

> Something went wrong.

---

# 17. Idempotency

Any action capable of causing duplicate work or charges should be idempotent.

Examples:

* initiating an audit
* buying credits
* updating subscriptions
* sending invitations
* rotating credentials
* provisioning integrations

A browser retry should not create duplicate operations.

---

# 18. Findings / results

For diagnostic products, findings need durable identity.

Example:

```text
Finding NC-2841

Title
Severity
Status
Category
Affected resource
First detected
Last detected
Evidence
Recommendation
Resolution state
History
```

Lifecycle:

```text
New
Acknowledged
In Progress
Resolved
Accepted Risk
Ignored
Regressed
```

Avoid deleting historical findings when the underlying issue disappears.

Instead preserve lifecycle evidence.

---

# 19. Finding history

Users should be able to see:

```text
Aug 20   Finding detected
Aug 20   Assigned to Sarah
Aug 21   Marked In Progress
Aug 22   Marked Resolved
Aug 23   Verification passed
Sep 04   Regression detected
```

This turns the system from a snapshot generator into an operational history.

---

# 20. Reports

Customers should be able to access historical reports.

Metadata:

* report ID
* type
* generated date
* target
* version
* status
* generation method

Possible formats:

* interactive web
* PDF
* CSV
* JSON

If a report can change later, distinguish:

```text
Live view
```

from:

```text
Generated snapshot
```

Otherwise evidentiary meaning becomes ambiguous.

---

# 21. Evidence provenance

For any material diagnostic result, retain enough information to answer:

> What exactly produced this result?

Potential metadata:

```text
scan_id
target
timestamp
tool_version
rule_version
input_version
environment
source snapshot
model version, if AI contributed
```

If AI contributes to findings, distinguish:

* deterministic observations
* heuristic classifications
* model-generated interpretation
* user-entered data

Do not collapse these into a single undifferentiated "finding."

---

# 22. Monitoring

For recurring products, provide:

```text
Monitoring status
Last successful run
Next scheduled run
Monitored resources
Detected changes
Failures
Alert configuration
```

Monitoring configuration should include:

* enabled/disabled
* frequency
* targets
* scope
* alert rules
* notification destinations

---

# 23. Baselines

Where regression detection exists, customers need visible baseline management.

Example:

```text
Current baseline
Created: August 10
Source: Audit #273
Set by: Sarah Chen
```

Changing a baseline should be auditable.

Do not silently replace historical reference points.

---

# 24. Notifications

Separate:

### Product notifications

* job completed
* job failed
* regression detected
* threshold breached

### Account notifications

* user invited
* role changed
* SSO changed

### Billing notifications

* payment failed
* subscription renewed
* usage threshold

### Security notifications

* password changed
* MFA disabled
* API key created
* unusual login

Allow configuration by:

* in-app
* email
* webhook

Eventually possibly:

* Slack
* Teams

---

# 25. Notification center

Persistent in-app notification history.

Each notification should have:

* type
* timestamp
* state
* target/resource
* action link
* read/unread

Notifications should deep-link into the relevant context.

---

# 26. Activity feed versus audit log

These are **not the same thing**.

### Activity feed

Human-friendly operational events.

Example:

> Sarah resolved the checkout friction finding.

### Audit log

Security/governance-grade evidence.

Example:

```text
2026-08-22T19:18:42.937-04:00
actor=user_8292
action=finding.status.update
resource=finding_28391
tenant=org_193
old_status=open
new_status=resolved
request_id=req_a83d...
ip=...
```

Do not pretend an activity feed is an audit ledger.

---

# 27. Audit log

Enterprise requirements should include:

* timestamp
* actor
* actor type
* tenant
* action
* resource
* old/new value where appropriate
* IP
* user agent
* session
* request/trace ID
* source
* result

Critical changes include:

* authentication settings
* MFA
* SSO
* role changes
* invitations
* user removal
* API credentials
* integration changes
* webhooks
* billing
* data exports
* deletion operations

Customers should eventually be able to:

* search
* filter
* export

---

# 28. API access

If customers or customer agents can call the service directly, the workspace becomes the management plane for that API.

Provide:

```text
API keys
OAuth applications if applicable
Usage
Rate limits
Recent requests
Errors
Documentation
```

API access should not be coupled to browser session credentials.

---

# 29. API key management

Show:

```text
Name
Prefix
Created
Created by
Last used
Scope
Environment
Expiration
Status
```

For example:

```text
Production Automation
nb_live_7x4...
Created Aug 2
Last used 4 minutes ago
Scopes: audits:create, audits:read
```

Raw secrets should be shown once.

Store only a secure representation thereafter.

Support:

* scopes
* rotation
* expiration
* revoke
* environment separation

---

# 30. Webhooks

Full webhook lifecycle:

```text
Endpoint
Subscribed events
Signing secret
Status
Created
Last delivery
Failure rate
```

Delivery history should expose:

```text
Event
Timestamp
HTTP status
Duration
Attempt
Result
```

Customers should be able to:

* inspect payload
* inspect response
* retry delivery
* rotate signing secret
* disable endpoint

Webhook requests should be signed.

Retries require defined semantics.

---

# 31. Integrations

Connected integrations should show:

```text
Integration
Connection status
Connected account
Connected by
Last sync
Permissions/scopes
```

Allow:

* connect
* reconnect
* disconnect

Disconnection must properly revoke or invalidate downstream credentials when technically possible.

---

# 32. Usage

Customers should understand exactly what they are consuming.

Examples:

```text
Audits
Pages
Requests
Monitored URLs
Credits
Storage
API operations
Team seats
```

Expose:

```text
Used
Included
Remaining
Renewal/reset date
Overage behavior
```

Do not leave customers to infer billing from invoices.

---

# 33. Entitlements

Billing plan and application capability must be mediated through an entitlement layer.

Avoid code such as:

```javascript
if (plan === "pro")
```

throughout the product.

Instead:

```text
can_run_audits
max_monitored_pages
api_access
team_members_limit
monitoring_interval
export_pdf
custom_branding
```

This separates:

```text
commercial product
```

from:

```text
runtime authorization
```

and makes migrations, grandfathering, enterprise exceptions, and promotions manageable.

---

# 34. Billing

Billing interface should include:

* current plan
* billing frequency
* renewal date
* payment method
* invoices
* usage
* credits
* taxes
* billing identity
* cancellation state

Lifecycle states should be explicit:

```text
trialing
active
past_due
grace_period
suspended
cancelled
```

Application behavior during each state must be defined.

Do not let Stripe state accidentally become your business logic.

Internally reconcile provider state into your own subscription model.

---

# 35. Billing permissions

Billing information may contain privileged information.

Consider separate:

```text
Billing Admin
```

permission.

Not every workspace member needs:

* invoice access
* payment method access
* revenue/usage detail

---

# 36. Subscription cancellation

Cancellation UX should clearly state:

```text
Cancellation effective date
Remaining access
Monitoring behavior
Data retention period
Export options
Deletion date
Reactivation rules
```

Do not obscure cancellation.

Besides being poor customer experience, dark-pattern cancellation increasingly creates regulatory exposure.

---

# 37. Profile

Personal profile:

* display name
* email
* verified status
* preferred timezone
* locale
* date/time preferences

Potential:

* avatar
* job title

Avoid collecting data merely because profiles commonly contain it.

---

# 38. Organization settings

Organization-level configuration:

```text
Organization name
Workspace name
Slug
Verified domains
Default timezone
Default locale
Billing identity
Security settings
```

Changes should be audited.

---

# 39. Data management

Customers should have a dedicated data-management area.

At minimum:

```text
What data exists
Retention
Exports
Deletion controls
```

Where relevant:

```text
Customer Inputs
Generated Reports
Evidence
Logs
Integration Data
Billing Records
```

Explain retention differences.

There may be legal reasons certain records cannot be deleted on demand.

The application should not falsely claim otherwise.

---

# 40. Data export

Provide machine-readable exports when practical.

Potential formats:

```text
JSON
CSV
PDF
ZIP archive
```

Exports should be:

* authorized
* logged
* expiration controlled
* tenant scoped
* securely delivered

Large exports should be asynchronous.

---

# 41. Deletion

Deletion must have defined semantics.

Distinguish:

```text
archive
soft delete
scheduled deletion
hard delete
legal retention
```

Do not call something "deleted" while silently retaining the same customer data indefinitely.

For destructive account deletion, require strong confirmation.

For example:

```text
Type DELETE ACME to continue.
```

Potentially require recent authentication/MFA.

---

# 42. Support

The workspace should provide contextual support.

At minimum:

* documentation
* support contact
* service status
* incident information

Better:

* support request submission
* request history
* severity/category
* attachments
* product context automatically included

Useful automatically attached metadata:

```text
organization
workspace
app version
request ID
resource ID
browser
timestamp
```

This significantly improves incident triage.

---

# 43. Correlation IDs

Every application/API error should carry a customer-visible reference such as:

```text
Request ID: req_01JAHZ7...
```

Support engineers should be able to trace that identifier through:

```text
frontend
gateway
API
job processor
database
downstream calls
```

Without this, customer-reported transient failures become expensive forensic exercises.

---

# 44. Status page integration

Expose service state somewhere persistent.

Example:

```text
All systems operational
```

Clicking should open detailed service status.

If an incident is currently affecting the logged-in customer's operation, surface it contextually.

Example:

> Audit processing is currently delayed due to an active service incident.

That is far better than presenting repeated mysterious failures.

---

# 45. Error taxonomy

Define application error classes.

At minimum:

```text
Validation
Authentication
Authorization
Entitlement
Rate limit
Conflict
Dependency failure
Temporary service failure
Permanent operation failure
```

The frontend should differentiate them.

For example:

**403 Authorization**

> Your account does not have permission to manage billing.

versus:

**402/entitlement**

> API access is not included in this workspace.

versus:

**503**

> Audit processing is temporarily unavailable. No usage has been consumed.

---

# 46. Optimistic UI

Use cautiously.

Do not optimistically display critical operations as successful before server confirmation.

Particularly:

* role changes
* billing
* API key revocation
* deletion
* security settings
* audit execution
* production configuration

Visual responsiveness is not worth lying about state.

---

# 47. Loading state

Every async surface needs:

```text
initial loading
refreshing
empty
partial
success
failure
stale
```

These are semantically different states.

Skeletons are appropriate for predictable content layouts.

Never use indefinite spinners for jobs that may take minutes.

---

# 48. Stale data

Where the displayed information may be stale, expose freshness.

Example:

```text
Last updated 37 seconds ago
```

Provide refresh when appropriate.

For dashboards, silently presenting a five-hour-old cached service state as current is an operational defect.

---

# 49. Concurrency

Consider concurrent edits.

Administrative screens should prevent silent lost updates.

Options include:

* optimistic locking
* version columns
* ETags

Example:

```text
This configuration changed while you were editing it.
Review the latest version before saving.
```

---

# 50. Accessibility

Target WCAG 2.2 AA.

Requirements include:

* keyboard navigation
* visible focus
* semantic HTML
* accessible forms
* proper labels
* contrast
* reduced-motion compatibility
* screen-reader announcements
* accessible validation
* accessible modals
* skip navigation
* no color-only meaning

Charts must expose meaningful textual equivalents.

---

# 51. Responsive behavior

"Enterprise app" does not excuse broken mobile behavior.

Support at least:

```text
Desktop
Laptop
Tablet
Mobile
```

Complex configuration may be desktop-optimized, but mobile should support essential operations such as:

* dashboard
* alerts
* reviewing findings
* status
* approvals
* account security

---

# 52. Browser support

Define rather than implicitly guess.

Typical:

* latest Chrome
* latest Edge
* latest Firefox
* latest Safari
* previous major version where commercially required

Enterprise customers may force longer support windows.

Track actual customer usage before expanding indefinitely.

---

# 53. Search

As account data grows, provide global/contextual search.

Possible searchable objects:

```text
Projects
Pages
Audits
Findings
Reports
Members
```

Include keyboard access such as:

```text
Ctrl/Cmd + K
```

but never make command palettes the only navigation mechanism.

---

# 54. Tables

Enterprise applications live or die on table quality.

Support where appropriate:

* sorting
* filtering
* pagination
* search
* column visibility
* bulk actions
* export

Persist sensible user preferences.

Use server-side filtering/pagination at scale.

Do not fetch 50,000 rows and filter them in React.

---

# 55. URLs and deep links

Meaningful application state should generally be linkable.

Good:

```text
app.domain.com/findings/NC-284
```

Bad:

```text
app.domain.com/dashboard
```

where six layers of client state are required to recreate the view.

This matters for:

* collaboration
* support
* incident troubleshooting
* documentation
* customer success

---

# 56. Time handling

Store server timestamps in UTC.

Render in user-selected timezone.

Display timezone for ambiguous operational events.

For example:

```text
Aug 22, 2026 7:31 PM EDT
```

not simply:

```text
Aug 22 7:31
```

Audit exports should use unambiguous timestamps.

---

# 57. Security headers

The app should deploy strict headers such as appropriate:

```text
Strict-Transport-Security
Content-Security-Policy
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
```

Prefer CSP without:

```text
unsafe-inline
unsafe-eval
```

where practical.

Frame restrictions should prevent clickjacking unless embedding is intentional.

---

# 58. CORS

Do not configure:

```text
Access-Control-Allow-Origin: *
```

for authenticated customer APIs.

Explicitly control:

* allowed origins
* methods
* headers
* credentials

Public machine-to-machine APIs and browser APIs may require different policies.

---

# 59. CSRF

If cookie-authenticated endpoints mutate state, CSRF protections are mandatory.

Do not assume:

```text
SameSite
```

alone resolves every possible architecture.

---

# 60. Content security boundary

Customer-provided content requires deliberate treatment.

Examples:

* HTML
* URLs
* filenames
* markdown
* report content

Protect against:

* XSS
* HTML injection
* unsafe redirects
* SSRF
* path manipulation

This becomes especially important if customers provide URLs that backend crawlers visit.

---

# 61. SSRF controls

For a product that scans customer-supplied URLs, this is a major attack surface.

Do not allow customers to use your infrastructure to access:

```text
127.0.0.1
localhost
169.254.169.254
RFC1918 ranges
internal DNS
metadata services
```

unless explicitly part of a controlled private-scanning product.

Protect against DNS rebinding and redirect chains into restricted networks.

---

# 62. Rate limiting

Different operations need different controls.

Examples:

```text
Authentication
Password reset
Audit creation
API usage
Export generation
Webhook replay
Invitation sending
```

Limits should be tenant-aware and actor-aware.

They should protect the system without arbitrarily destroying legitimate enterprise workloads.

---

# 63. Abuse controls

Account for:

* credential stuffing
* enumeration
* signup abuse
* scraping
* resource exhaustion
* webhook amplification
* scan target abuse
* credit/billing abuse

Free tiers and trials require especially strong consideration here.

---

# 64. Secrets

Never expose:

* API secrets
* OAuth tokens
* webhook secrets
* integration credentials

after initial creation unless cryptographically necessary.

Never put secrets in:

```text
URLs
analytics events
frontend logs
error reporting
```

---

# 65. Security-sensitive actions

Require elevated/recent authentication for operations such as:

* disabling MFA
* changing account email
* transferring ownership
* modifying SSO
* deleting organization
* revealing/replacing sensitive credentials

This reduces session-hijack blast radius.

---

# 66. Security notification

Notify administrators/users of material events.

For example:

```text
New API credential created
MFA removed
Password changed
Organization ownership transferred
SSO configuration changed
Large export requested
```

---

# 67. Frontend observability

Collect:

* uncaught exceptions
* route failures
* API failures
* Web Vitals
* release version
* request identifiers

Avoid collecting sensitive customer payloads by default.

Telemetry should be deliberately classified.

---

# 68. Backend observability

At minimum:

```text
structured logs
metrics
distributed traces
health checks
dependency status
job metrics
queue depth
error rates
latency
```

Every request should propagate correlation context.

---

# 69. Customer telemetry separation

Product analytics and operational telemetry are different.

Product analytics:

> Which screens do customers use?

Operational telemetry:

> Why did request `req_28af` fail?

Security evidence:

> Who changed SSO configuration?

Do not dump all three into one analytics system and call it observability.

---

# 70. Analytics privacy

Do not automatically ship sensitive workspace data to third-party analytics systems.

Create explicit telemetry rules.

Potentially exclude:

* URLs
* customer-entered text
* reports
* findings
* tokens
* API request contents
* personal data

Use stable pseudonymous identifiers where sufficient.

---

# 71. Release identification

Expose application version somewhere unobtrusive.

For example:

```text
v2026.08.22.3
```

or build SHA.

Customer support should be able to determine which release produced a reported failure.

Server responses can similarly expose:

```text
X-App-Revision
```

where appropriate.

---

# 72. Deployment safety

Workspace deployments should support:

* zero/minimal downtime
* backwards-compatible migrations
* progressive rollout where warranted
* fast rollback
* revision observability

A frontend must tolerate reasonable API version skew during rolling deployments.

---

# 73. Database migrations

Never make customer availability depend on risky migrations executed blindly during application startup.

Use controlled migrations with:

* version tracking
* locking
* rollback/forward strategy
* preflight checks

Large schema changes require expand/migrate/contract patterns.

---

# 74. Availability

Define service objectives.

For example:

```text
App availability
API availability
Job-processing availability
```

Do not hide a badly degraded backend behind an HTTP 200 dashboard.

---

# 75. Backup / recovery

Customer workspace infrastructure requires:

* automated database backups
* point-in-time recovery where appropriate
* restoration testing
* recovery documentation

Define:

```text
RPO
RTO
```

A backup that has never been restored is an assumption, not a recovery capability.

---

# 76. Data durability

Particularly for:

* reports
* purchases
* findings
* audit records
* customer configurations

Define what must survive:

* application restart
* worker restart
* region failure
* partial database outage
* retry storms

---

# 77. Queue semantics

For asynchronous work, define:

```text
at-most-once
at-least-once
effectively-once
```

behavior.

Assume duplicate delivery can happen.

Jobs should therefore be idempotent where appropriate.

---

# 78. Billing reconciliation

Payment webhooks will:

* arrive late
* arrive more than once
* occasionally arrive out of order

Billing state transitions must tolerate this.

Maintain provider event IDs and reconcile periodically.

Do not make webhook receipt synonymous with truth.

---

# 79. External dependency failure

Define customer-visible behavior if:

* Stripe fails
* email provider fails
* crawler fails
* AI provider fails
* DNS fails
* storage fails
* analytics fails

Nonessential dependencies should generally not block the application.

For example, PostHog failure should not prevent an audit from completing.

---

# 80. AI-specific requirements

If AI contributes to customer-facing analysis, additional requirements apply.

Maintain:

```text
provider
model
model version where available
prompt/system configuration version
input provenance
generation timestamp
post-processing version
```

Do not make AI output indistinguishable from observed evidence.

Prefer UI distinctions such as:

```text
Observed
Calculated
Inferred
Recommended
```

That becomes important when customers rely on the output operationally.

---

# 81. Confidence and uncertainty

Where findings are heuristic, represent that internally and potentially externally.

Do not manufacture exact-looking certainty.

For example:

```text
Evidence: deterministic
Interpretation: heuristic
```

can be substantially more defensible than an arbitrary:

```text
Confidence: 97%
```

---

# 82. Feature flags

Use feature flags for controlled rollout.

Flags should support:

* global
* environment
* organization
* workspace
* cohort

But flags need lifecycle management.

Dead flags become technical debt and hidden execution paths.

---

# 83. Customer feature visibility

Avoid showing every unavailable feature as a constant upsell.

Differentiate:

```text
You lack permission
```

from:

```text
Not included in your plan
```

from:

```text
Feature unavailable
```

These are three different conditions.

---

# 84. Admin/customer boundary

The internal administrative application should ideally be separate from the customer application.

For example:

```text
app.domain.com
admin.internal.domain.com
```

At minimum, admin authority must not be exposed simply by hidden routes such as:

```text
/app/admin
```

Internal support impersonation, if ever implemented, must be:

* tightly permissioned
* time-bound
* auditable
* visibly indicated
* preferably approval-gated for sensitive customers

Do not build invisible god-mode impersonation.

---

# 85. Support access

If support personnel can access customer environments, establish explicit controls:

```text
Support access: Disabled
```

or:

```text
Allow support access until:
Aug 24 14:00 EDT
```

This is much stronger than permanent implicit vendor access.

---

# 86. Account lifecycle

Define complete lifecycle:

```text
signup
verification
organization creation
trial
conversion
active
past due
suspension
cancellation
retention
deletion
```

Each transition should have:

* trigger
* customer experience
* entitlement behavior
* communication
* audit evidence
* data consequence

---

# 87. Domain verification

For organization-level features, support verifying ownership of domains.

Potential mechanisms:

```text
DNS TXT
email challenge
```

Necessary for capabilities such as:

* SSO enforcement
* automatic organization discovery
* domain-based membership

Do not infer ownership merely because someone's email ends in that domain.

---

# 88. Enterprise identity

Eventually support:

### SAML

For enterprise federation.

### OIDC

For modern identity-provider integration.

### SCIM

For automated:

* provisioning
* deprovisioning
* group membership

Deprovisioning is the security-critical half.

Creating accounts is easy; reliably removing access when someone leaves is what enterprise buyers care about.

---

# 89. Legal / compliance surface

Workspace should make relevant governing documents accessible:

* Terms
* Privacy Policy
* DPA
* subprocessors
* security documentation

For enterprise contracts, potentially expose:

```text
Contract
DPA
Effective date
Renewal date
```

Do not overbuild this before customers require it.

---

# 90. Data residency

If residency becomes commercially relevant, model it explicitly.

For example:

```text
Data region: Canada
```

Do not claim residency if telemetry, backups, AI providers, email systems, or error trackers silently export the same data elsewhere.

Residency must be evaluated across the actual data path.

---

# 91. Accessibility of security posture

Enterprise customers should eventually be able to see basic organization security posture:

```text
MFA enforcement         Enabled
SSO                     Configured
Verified domains        2
Active API keys         4
Admins                   3
Users without MFA        0
```

That is operationally useful rather than merely publishing a security page.

---

# 92. Customer audit export

For enterprise users, audit events should be exportable.

Potential:

```text
CSV
JSON
API
SIEM webhook
```

Eventually integration with:

* Splunk
* Sentinel
* Datadog
* generic HTTPS endpoints

may become commercially valuable.

---

# 93. Performance targets

Set explicit budgets.

Reasonable initial targets for interactive pages:

```text
LCP                  < 2.5s p75
INP                  < 200ms p75
CLS                  < 0.1
Initial app shell     < 2s under normal conditions
Common API requests   < 500ms p95 where feasible
```

Actual requirements depend on workload.

More importantly, instrument the values and enforce regression budgets.

---

# 94. Frontend architecture

For a substantial authenticated product:

* typed API contracts
* central authentication state
* central authorization primitives
* query/cache layer
* predictable error handling
* routing
* code splitting
* component design system

Avoid hundreds of screens independently reinventing:

```text
fetch()
isLoading
isError
try/catch
```

---

# 95. Design system

Create reusable primitives:

```text
Button
Input
Select
Combobox
Dialog
Drawer
Table
Badge
Alert
Toast
Tooltip
Tabs
EmptyState
ErrorState
Skeleton
Pagination
Breadcrumb
```

And domain components:

```text
SeverityBadge
JobStatus
UsageMeter
FindingCard
MemberRole
IntegrationState
```

Consistency is operational quality, not merely aesthetic polish.

---

# 96. Visual hierarchy

Enterprise-grade should mean high information density without visual noise.

Use restraint with:

* gradients
* oversized cards
* decorative charts
* excessive borders
* gigantic whitespace
* animation

The UI should communicate state faster than it communicates brand personality.

---

# 97. Dark/light mode

Optional.

If offered, support properly.

Do not implement a dark mode that makes:

* charts unreadable
* status colors ambiguous
* code blocks illegible
* accessibility worse

Persist preference.

Respect system preference when no selection exists.

---

# 98. Confirmation patterns

Use confirmation proportional to consequence.

No confirmation needed:

```text
mark notification read
```

Simple confirmation:

```text
archive report
```

Strong confirmation:

```text
revoke production API key
remove administrator
cancel subscription
delete organization
```

Avoid confirmation-dialog fatigue.

---

# 99. Toasts

Toasts should supplement state change, not be the only proof it happened.

Bad:

> Saved!

then the UI still shows old data.

Better:

* update authoritative UI
* show confirmation
* handle rollback/error

---

# 100. URL-driven filters

For important table views:

```text
/findings?severity=critical&status=open
```

is preferable to entirely ephemeral client state.

It enables:

* bookmarking
* collaboration
* reproducibility
* support

---

# 101. Keyboard productivity

For power users:

```text
Cmd/Ctrl-K    Search
/             Search
Esc           Close modal
```

Potential shortcuts for frequently repeated product actions.

Never compromise accessibility to implement shortcuts.

---

# 102. Bulk operations

As customers scale, bulk actions become mandatory.

Examples:

```text
Resolve findings
Assign owner
Archive reports
Add tags
Export
```

Bulk destructive operations require careful confirmation and partial-failure handling.

---

# 103. Partial failure

Never assume bulk operations are all-or-nothing unless transactionally guaranteed.

Example:

```text
97 items updated
3 failed

[View failed items]
```

is more accurate than:

> Update complete.

---

# 104. Import workflows

If customers can import resources:

* validate before committing
* show errors per row/item
* make retry possible
* preserve provenance
* avoid partially corrupting workspace state

---

# 105. User-visible service history

For long-lived products, customers should be able to answer:

> What changed between last month and now?

Historical trend data is useful if materially connected to product outcomes.

This is especially relevant for monitoring-oriented Nebula products.

---

# 106. Search-engine controls

`app.domain.com` should normally not be publicly indexed.

Use:

```text
robots.txt
noindex
```

where appropriate.

But recognize robots directives are not security controls.

Authentication is the security boundary.

---

# 107. Cache policy

Sensitive authenticated responses should have appropriate cache semantics.

Usually:

```text
Cache-Control: no-store
```

for particularly sensitive content.

Avoid allowing shared/intermediary caches to persist tenant data.

Static application assets can be aggressively cached with content hashes.

---

# 108. CDN behavior

Verify that cache keys cannot leak responses across:

* users
* organizations
* authentication states

A tenant-data caching mistake is a catastrophic class of defect.

---

# 109. File handling

For uploads:

* enforce size limits
* enforce content/type validation
* malware scanning where warranted
* randomized object names
* signed upload/download URLs
* tenant isolation
* retention policy

Never trust filename extensions.

---

# 110. Auditability of configuration

Important workspace settings should show:

```text
Last changed
Changed by
```

Where useful:

```text
View history
```

Configuration without history becomes difficult to debug when customers ask:

> Why did this start happening yesterday?

---

# 111. Customer-visible system limits

Expose material limits before users encounter them.

For example:

```text
Maximum pages per audit: 500
Maximum file size: 25 MB
API rate limit: 600 requests/minute
```

Surprise limits create incidents.

---

# 112. Maintenance behavior

If maintenance materially affects the application:

* communicate beforehand
* preserve customer work
* disable dangerous actions when necessary
* expose current state

A read-only mode may be preferable to total outage for some maintenance classes.

---

# 113. Graceful degradation

The application should remain partially functional when secondary services fail.

Examples:

If:

```text
billing provider down
```

then existing customers should ideally still use the product.

If:

```text
analytics down
```

nothing customer-facing should break.

If:

```text
email provider down
```

the application should record pending notifications and retry.

---

# 114. Test requirements

Minimum automated coverage:

### Unit

* permissions
* entitlement decisions
* state machines
* billing reconciliation
* validation

### Integration

* database
* queue
* billing
* webhooks
* authentication

### E2E

Critical journeys:

```text
signup
login
MFA
create workspace
create primary resource
run core product operation
view result
invite member
change role
create API key
billing flow
cancel subscription
```

### Tenant isolation

Explicit negative tests:

```text
Tenant A cannot read Tenant B
Tenant A cannot mutate Tenant B
Tenant A cannot enumerate Tenant B
```

Those deserve first-class tests.

---

# 115. Authorization testing

Test permutations by:

```text
role × action × resource × tenant
```

especially for:

* IDOR
* cross-workspace access
* API access
* export URLs
* object storage
* background jobs

Do not assume middleware protects every new endpoint automatically.

---

# 116. Failure injection

Exercise:

* queue unavailable
* storage timeout
* duplicate webhook
* delayed webhook
* worker death mid-job
* database failover
* AI provider error
* network timeout
* email failure

The intended state transition should be known before production encounters it.

---

# 117. Data integrity

Use database constraints to enforce fundamental invariants.

Examples:

* foreign keys
* uniqueness
* non-null
* state constraints

Do not rely exclusively on frontend or ORM validation.

---

# 118. Soft deletion hazards

If using soft deletion, every query must correctly respect ownership and deletion state.

Soft deletion frequently creates:

* uniqueness bugs
* accidental resurrection
* hidden data retention
* authorization edge cases

Use deliberately.

---

# 119. Operational administrative tooling

Internal operators need capabilities for diagnosing customers without executing arbitrary SQL.

Provide safe tools for:

* account lookup
* subscription state
* job state
* entitlement state
* integration state
* request correlation

But keep customer and operator interfaces separate.

---

# 120. Runbooks

Critical workspace functions should have operational runbooks.

Examples:

```text
Customer cannot authenticate
Billing state inconsistent
Audit stuck running
Webhook backlog
Email verification failure
Tenant access incident
API credential exposure
Data export failure
```

A professional application includes the operational system behind the screen.

---

# 121. Security incident readiness

You should be capable of determining:

```text
who accessed what
from where
when
through which credential
using which session/API key
```

If that cannot be reconstructed, incident investigation will be largely speculative.

---

# 122. Data breach containment

Architect for revocation.

You should be capable of rapidly:

* revoke sessions
* revoke API keys
* disable integration
* disable user
* disable tenant
* invalidate tokens
* freeze destructive operations

without redeploying the application.

---

# 123. Organization suspension

Administrative suspension must be distinct from deletion.

Example:

```text
Organization state: suspended
Reason: billing / abuse / security / administrative
```

Define whether the customer gets:

* read access
* export access
* no access

per suspension class.

---

# 124. Customer-facing changelog

Useful once product velocity increases.

Expose:

* new functionality
* material changes
* deprecations

Do not turn it into marketing spam.

Operational changes should have effective dates.

---

# 125. API versioning/deprecation

If customer automation depends on APIs, define:

* versioning approach
* compatibility commitment
* deprecation period
* migration guidance

Breaking customers without warning because frontend and API deploy together is acceptable only while there are no external API consumers.

Once customer agents exist, that assumption disappears.

---

# 126. Documentation integration

Contextual docs should deep-link directly to relevant topics.

For example:

```text
API Keys → Managing API credentials
Webhooks → Verify webhook signatures
Monitoring → How baselines work
```

The customer should not have to search the entire documentation corpus from scratch.

---

# 127. Permissions explanation

When an action is unavailable, tell the user why.

Example:

> Only workspace owners and billing administrators can change this setting.

rather than simply hiding everything.

There are exceptions where hiding resources is appropriate for security, but basic role-based UI should be understandable.

---

# 128. Enterprise-grade acceptance gate

Before calling the workspace "enterprise-grade," I would require at minimum all of the following to be true:

* tenant isolation is explicitly modeled and tested
* authentication is production hardened
* MFA exists
* server-side RBAC exists
* user/member lifecycle exists
* session management exists
* customer operations expose durable state
* important actions are auditable
* API credentials are securely managed
* billing and entitlements are separate concepts
* asynchronous jobs tolerate retries
* errors carry correlation IDs
* customer data has documented retention/deletion semantics
* backups are automated and restoration has been tested
* security-sensitive changes generate evidence
* observability exists across frontend/API/workers
* customer-facing status/failure states are meaningful
* accessibility has been deliberately tested
* application deployments are version identifiable
* cross-tenant access tests exist
* critical user journeys have E2E tests
* destructive operations have explicit confirmation and authorization
* support can troubleshoot without direct database surgery
* customer data cannot leak through analytics, logs, caches, CDN configuration, or object storage

If several of those are absent, the application can still be **professional and production-grade**, but calling it enterprise-grade would be premature.

---

# What I would build for Nebula specifically

Given the direction of Nebula Components, I would structure `app.nebulacomponents.com` approximately like this:

```text
OVERVIEW

AUDITS
├── New Audit
├── Audit History
├── Findings
└── Reports

MONITORING
├── Overview
├── Pages
├── Regressions
├── Baselines
└── Alerts

WORKSPACE
├── Projects
├── Domains
└── Team

DEVELOPER
├── API Keys
├── API Usage
├── Webhooks
└── Documentation

ACTIVITY
├── Activity
└── Audit Log

ACCOUNT
├── Plan & Usage
├── Billing
├── Security
├── Notifications
└── Data & Privacy

SUPPORT
├── Documentation
├── Support
└── System Status
```

The important product decision is that I **would not make the dashboard primarily about a score**.

For Nebula's intended evolution, the stronger organizing model is:

```text
Baseline
   ↓
Observation
   ↓
Finding
   ↓
Explanation
   ↓
Customer action
   ↓
Verification
   ↓
Monitoring
   ↓
Regression detection
```

That makes the workspace a longitudinal operating system for improving the customer's property rather than a repository of audit PDFs.

That also connects directly to the larger product thesis you've been describing: the initial landing-page CRO audit is the entry point, but **the workspace is where the value compounds**. Historical findings, remediation state, learning material, verification, monitoring, regressions, and evidence of improvement can accumulate instead of every audit effectively starting from zero.

## The design mistake I would explicitly avoid

Do **not** begin by building:

```text
Dashboard
Projects
Billing
Settings
```

and then populate it with features.

Start with the customer state model and lifecycle:

```text
Organization
  ↓
Property / Project
  ↓
Audit / Observation
  ↓
Finding
  ↓
Action
  ↓
Verification
  ↓
Baseline
  ↓
Monitoring
  ↓
Regression
```

Then derive the interface from that.

That difference sounds architectural, but it becomes a major product distinction. One approach produces another SaaS dashboard. The other produces a **customer system of record for the work Nebula performs and what the customer learns and changes as a result**.
