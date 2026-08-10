# Nebula Offer–Trigger Test Matrix

**Purpose:** Find the highest-converting pairing of a verified buying trigger and an existing Nebula offer. This is a routing and measurement artifact, not permission to broaden the ICP.

## Operating rule

Test one trigger against one offer at a time. Keep the founder ICP trigger-first:

> Actively spending on paid traffic while receiving zero or weak conversions.

A demographic or industry segment is not sufficient evidence. The lead must show a buying trigger and have a public page we can audit.

## Pairings

| ID | Verified trigger | Offer route | Message angle | Primary success event |
|---|---|---|---|---|
| T1-O1 | Paid traffic + clicks/no sales + live landing page | Free 9-signal audit → One-Leak Kit ($97) | “Your ad may be paying for a message-match leak.” | Qualified audit completion |
| T2-O1 | Paid traffic + explicit ad/page mismatch | One-Leak Kit ($97) | “The first viewport is breaking the promise your ad made.” | Kit checkout initiated |
| T3-O2 | Repeated traffic or multiple pages + recurring conversion concern | Pro ($29/mo) | “Monitor the leak after you fix it; regressions are invisible between audits.” | Pro checkout initiated |
| T4-O3 | Multiple client/product pages + agency or growth-team context | Growth/Agency ($79/$199) | “Run the same evidence-based audit across every page without rebuilding the process.” | Growth/Agency qualification or checkout |

## Test protocol

1. Collect only leads with a public evidence trail: ad spend/traffic symptom, conversion failure, and URL.
2. Assign exactly one pairing before outreach.
3. Use the existing personalized message rules: quote the symptom, state the diagnosis, offer the free audit where appropriate, and use one CTA.
4. Do not compare raw reply rates across different trigger strengths. Compare within pairing and record sample size.
5. A qualified reply means the person confirms the problem, asks for the audit/fix, provides a URL, or asks a buying question. “Interesting” and generic compliments do not count.
6. Stop a pairing after 20 eligible contacts with no qualified reply, or revise the message once if the evidence shows the trigger was real but the diagnosis was unclear.
7. Concentrate the next batch on the best pairing only after at least 10 eligible contacts and one qualified reply. Do not declare a winner from one response.

## Decision fields

Record per contact:

- `pairing_id`
- `trigger_evidence`
- `source_url`
- `offer_route`
- `message_variant`
- `sent_at`
- `reply_class`
- `qualified_reply`
- `audit_started`
- `audit_completed`
- `checkout_started`
- `paid`
- `disqualification_reason`

## Guardrails

- Do not sell generic “AI automation” to Nebula leads; that is a different offer and ICP.
- Do not infer ad spend or conversion failure from industry alone.
- Do not count impressions, likes, or unqualified replies as pipeline success.
- Do not send a paid offer before the lead has a verified trigger and the appropriate route.
- Do not automate LinkedIn DMs or bypass bounce/opt-out/rate-limit gates.
- Do not use unsupported performance claims or fabricate case-study results.

## Initial decision gate

After the first 20 eligible contacts across the matrix, choose one action:

- **Scale:** pairing has the highest qualified-reply rate with at least one downstream audit or checkout signal.
- **Improve:** trigger evidence is strong but qualified replies are weak; revise the diagnosis/message once.
- **Retire:** no qualified replies after 20 eligible contacts or the trigger cannot be independently verified.

The only valid output is a measured decision, not a claim that a niche “feels promising.”
