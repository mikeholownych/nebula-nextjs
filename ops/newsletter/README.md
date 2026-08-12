# Newsletter Autopilot

`newsletter_autopilot.py` runs the autonomous weekly newsletter pipeline:

```text
research -> draft -> validate -> edit -> publish
```

## Autonomous boundary

Validated issues publish automatically to confirmed, currently subscribed newsletter recipients through `hello@nebulacomponents.com` and the centralized AgentMail release gate.

The pipeline blocks publication when:

- no timestamped research artifact exists;
- research is stale beyond the configured freshness window;
- the finding has no evidence source;
- unsupported customer, revenue, percentage, or outcome claims appear;
- an em dash appears in the issue;
- the issue was already processed;
- the recipient is unsubscribed or unconfirmed;
- delivery fails for a recipient.

## Artifact

Each issue is stored at:

`ops/newsletter/YYYY-MM-DD-weekly-finding.json`

The Postgres `newsletter_issues` table records issue status, research, recipients, sends, and failures.

## Run

Dry run:

```bash
cd /home/mike/nebula
.venv/bin/python newsletter_autopilot.py --dry-run
```

Live weekly publish:

```bash
cd /home/mike/nebula
.venv/bin/python newsletter_autopilot.py
```

## Content contract

Every issue contains:

1. Recognition of a concrete post-click problem.
2. The structural reason it matters.
3. A bounded repair.
4. A verification step.
5. A free audit CTA with UTM attribution.
6. An unsubscribe URL.

No issue may present internal hypotheses as customer outcomes.

## Compliance controls

- Signup uses double opt-in. Only confirmed subscribers are eligible.
- The send query excludes unsubscribed, bounced, and complained addresses.
- Every message identifies Nebula Components, explains why it was received,
  includes a valid postal address, and includes a visible unsubscribe link.
- AgentMail messages include RFC 8058 `List-Unsubscribe` and
  `List-Unsubscribe-Post` headers.
- The unsubscribe endpoint is idempotent and does not reveal subscriber
  existence.
- Delivery uses the centralized AgentMail release gate and deterministic
  client IDs.

Live SPF, DKIM, DMARC, TLS, sender reputation, and mailbox-provider status
remain operational checks in AgentMail and DNS. They cannot be proven by a
local dry run.
