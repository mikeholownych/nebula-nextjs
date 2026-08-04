# Receipt Template

Copy this template for each engagement. Fill every field or mark it explicitly null/unknown.
Append the result as ONE JSON line to `ops/outcomes/receipts/receipts.jsonl`.

```json
{
  "receipt_id": "R-2026-0001",
  "status": "draft",
  "created_at": "2026-08-04T20:40:00Z",
  "engagement": {
    "type": "fix_pack | retainer | agency_partner",
    "offer_key": null,
    "purchase_id": null,
    "price": null
  },
  "client": {
    "industry": null,
    "consented_to_publish": false,
    "consent_note": null
  },
  "property": {
    "url": "https://example.com",
    "vertical": null,
    "label": null
  },
  "audit": {
    "before_audit_id": null,
    "after_audit_id": null,
    "before_score": null,
    "after_score": null,
    "score_delta": null
  },
  "fix": {
    "description": "Describe exactly what was changed",
    "scope": "single_leak | multi_leak | full_kit",
    "deployed_at": null,
    "audit_finding_key": "above_fold | cta | ..."
  },
  "measurement": {
    "method": "score | analytics",
    "monitor_id": null,
    "monitored_page_id": null,
    "baseline_window": null,
    "measurement_window": null,
    "sessions_per_period": null
  },
  "conclusion": "insufficient_data | improvement_suggested | improvement_confirmed | no_change | decline",
  "confounders": [],
  "customer_confirmed": false,
  "confirmed_at": null,
  "case_study_eligible": false,
  "evidence": [
    {
      "type": "audit_snapshot | analytics_screenshot | monitor_event | reaudit_url",
      "ref": null,
      "captured_at": null
    }
  ]
}
```

## Field rules

- `conclusion` must follow the ladder in README.md (score-based) or SOP-005 (analytics-based).
- `customer_confirmed` is set ONLY by a human (Mike / engagement owner) after customer confirmation.
- `consented_to_publish` is set ONLY by a human after separate publication consent.
- Never delete a ledger row — update `status` and add evidence instead (audit trail).
- `before_score`/`after_score` are on the 0–10 scale as reported by the audit engine.
