/**
 * Repair Sprint Telemetry Schema — data model for tracking repair outcomes.
 *
 * This schema is implemented from day one so future customer proof
 * emerges from actual operations rather than being fabricated retroactively.
 *
 * IMPORTANT: Commercial outcome data (customer_supplied_*) is OPTIONAL
 * and explicitly customer-supplied. Never infer conversion improvement
 * from a PASS re-audit alone.
 */

export interface RepairTelemetryRecord {
  repair_sprint_id: string
  purchase_timestamp: string // ISO 8601
  audit_id: string
  finding_id: string
  rule_id: string
  rule_version: string
  priority_score: number
  delivery_timestamp: string | null // ISO 8601, null if not yet delivered
  repair_type: 'copy' | 'code' | 'configuration' | 'structured_data' | 'mixed'
  platform: string // e.g. 'wordpress', 'shopify', 'nextjs', 'static'
  customer_implemented: boolean | null // null = unknown
  implementation_timestamp: string | null
  reaudit_requested: boolean
  reaudit_timestamp: string | null
  pre_state: 'FAIL' | 'PASS' | 'INCONCLUSIVE'
  post_state: 'FAIL' | 'PASS' | 'INCONCLUSIVE' | null // null = not yet re-audited
  pass_fail: boolean | null // null = not yet determined
  revision_required: boolean
  refund_requested: boolean
  refund_issued: boolean
  // Optional customer-supplied business metrics — never inferred by Nebula
  customer_supplied_business_metric: string | null // e.g. "conversion_rate", "revenue"
  customer_supplied_metric_window: string | null // e.g. "7_days_pre_vs_7_days_post"
  customer_supplied_metric_notes: string | null
}

export const REPAIR_TELEMETRY_TABLE = 'repair_sprint_telemetry'

export const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS ${REPAIR_TELEMETRY_TABLE} (
  repair_sprint_id TEXT PRIMARY KEY,
  purchase_timestamp TIMESTAMPTZ NOT NULL,
  audit_id TEXT NOT NULL,
  finding_id TEXT NOT NULL,
  rule_id TEXT NOT NULL,
  rule_version TEXT NOT NULL,
  priority_score NUMERIC(3,1) NOT NULL,
  delivery_timestamp TIMESTAMPTZ,
  repair_type TEXT NOT NULL CHECK (repair_type IN ('copy', 'code', 'configuration', 'structured_data', 'mixed')),
  platform TEXT NOT NULL,
  customer_implemented BOOLEAN,
  implementation_timestamp TIMESTAMPTZ,
  reaudit_requested BOOLEAN NOT NULL DEFAULT FALSE,
  reaudit_timestamp TIMESTAMPTZ,
  pre_state TEXT NOT NULL CHECK (pre_state IN ('FAIL', 'PASS', 'INCONCLUSIVE')),
  post_state TEXT CHECK (post_state IN ('FAIL', 'PASS', 'INCONCLUSIVE')),
  pass_fail BOOLEAN,
  revision_required BOOLEAN NOT NULL DEFAULT FALSE,
  refund_requested BOOLEAN NOT NULL DEFAULT FALSE,
  refund_issued BOOLEAN NOT NULL DEFAULT FALSE,
  customer_supplied_business_metric TEXT,
  customer_supplied_metric_window TEXT,
  customer_supplied_metric_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repair_telemetry_audit ON ${REPAIR_TELEMETRY_TABLE}(audit_id);
CREATE INDEX IF NOT EXISTS idx_repair_telemetry_rule ON ${REPAIR_TELEMETRY_TABLE}(rule_id);
`
