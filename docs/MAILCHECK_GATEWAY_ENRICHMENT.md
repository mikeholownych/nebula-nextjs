# MailCheck gateway enrichment

## Purpose

Add non-authorizing enrichment to persisted MailCheck evidence so Nebula can distinguish:

- `receiving_provider`: the hosted mail platform inferred from MX/SMTP fingerprints;
- `security_gateway_vendor`: an explicit gateway fingerprint when the hostname identifies one;
- `gateway_confidence`: `medium`, `low`, or `unknown`;
- `evidence_basis`: the evidence paths used for the inference.

This is enrichment data only. It never changes `release_decision`, `contact_admissible`, suppression, or the Nebula send gate.

## Current fingerprints

Supported explicit gateway fingerprints include:

- Proofpoint: `proofpoint`, `pphosted`
- Mimecast: `mimecast`
- Barracuda: `barracuda`, `barracudanetworks`
- Microsoft Exchange Online Protection: `protection.outlook.com`, with medium confidence

Hosted mailbox providers are separated from security gateways:

- Google Workspace: `google.com`, `googlemail.com`
- Microsoft 365: `outlook.com`, `protection.outlook.com`
- Zoho: `zoho.*`
- iCloud: `icloud.com`
- Proton: `protonmail`

A direct Zoho or Google MX does **not** prove that no upstream gateway exists. It returns `security_gateway_vendor=unknown` unless an explicit gateway fingerprint is present.

## Evidence flow

```text
MailCheck evidence API
→ gateway_fingerprint.enrich_gateway_evidence()
→ persisted evidence.gateway_enrichment
→ account/action-card enrichment
```

The adapter adds `gateway_enrichment` whenever evidence is fetched. Existing rows were backfilled with:

```bash
venv/bin/python3 scripts/enrich_existing_mailcheck_evidence.py
```

The backfill is idempotent and local-only.

## Proof boundary

MX and SMTP banners identify receiving infrastructure, not guaranteed inbox placement, filtering policy, quarantine behavior, or effective security controls. Do not use gateway enrichment as send authorization or as proof of delivery.
