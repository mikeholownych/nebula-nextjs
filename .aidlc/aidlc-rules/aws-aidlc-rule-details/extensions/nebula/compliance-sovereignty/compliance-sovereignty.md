# MANDATORY: Compliance & Sovereignty Rules

## Model Selection
- Multi-provider: Claude, OpenAI, Gemini, Mistral
- Default cost tiers:
  | Stage | Model | Cost Tier |
  |-------|-------|-----------|
  | Cold scraping/dedup | DeepSeek Flash / Gemma | ~1% premium |
  | Initial scoring | GPT-4o-mini / Claude Haiku | ~5% premium |
  | Deep conversion analysis | Claude Sonnet 4 | 100% |
  | Pitch composition | Claude Sonnet 4 | 100% |

## Sovereignty Architecture
- Immutable audit log: every inference call logged with model, timestamp, input_hash, output_hash
- On-prem or private cloud option available
- Client can switch models without pipeline rebuild
- Audit trail is tamper-evident (append-only)

## Compliance Documentation Pack
- GDPR Data Processing Agreement
- SOC 2 Controls Mapping
- HIPAA Business Associate Agreement (BAA) template
- EU AI Act Risk Documentation (high-risk system doc + data lineage logs)
- DORA Audit Letters

## Positioning Do's and Don'ts
| ✅ Do | ❌ Don't |
|------|----------|
| "SOC 2 practices" | "SOC 2 certified" |
| "HIPAA-ready" | "HIPAA compliant" |
| "GDPR-ready" | "GDPR certified" |
| "Built for auditability" | "We passed X audit" |
| "Your data, your model, your rules" | "Enterprise-grade security" |
