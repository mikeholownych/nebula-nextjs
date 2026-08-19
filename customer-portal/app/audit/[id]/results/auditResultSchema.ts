export type EvidenceConfidence = 'definitive' | 'high' | 'contextual' | 'unavailable'

export interface FindingEvidence {
  measured: string
  required: string
  delta: string
  selector: string
  confidence: EvidenceConfidence
  timestamp: string
}

export interface Finding {
  key: string
  label: string
  impact: number
  effort: number
  quadrant: string
  issue: string
  fix: string
  evidence?: FindingEvidence
  /** Short conversion principle name — e.g. "message match", "proof proximity" */
  principle?: string
  /** One-sentence explanation of why this principle affects conversion */
  principle_explanation?: string
  /** Signal type: "conversion" | "acquisition" | "technical" */
  signal_type?: string
  /** Display label for signal type */
  signal_type_label?: string
  /** Provenance of the priority score (0-10) — source, basis, limitation */
  scoring_provenance?: {
    source?: string
    basis?: string
    limitation?: string
  }
}

export interface AuditResult {
  audit_id: string | null
  url: string
  status: string
  score: number
  grade: string
  composite?: number
  composite_anchor?: number
  findings: Finding[]
  error?: string
  /**
   * One sentence naming the dominant structural problem on this page —
   * synthesized from the full finding set, not just the top signal.
   */
  strategic_finding?: string
}

const MAX_FINDINGS = 50
const MAX_TEXT = 1_000
const MAX_EVIDENCE_TEXT = 500
const CONFIDENCE = new Set<EvidenceConfidence>(['definitive', 'high', 'contextual', 'unavailable'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown, fallback = '', limit = MAX_TEXT): string {
  const normalized = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : fallback
  return normalized.length <= limit ? normalized : `${normalized.slice(0, limit - 1)}…`
}

function score(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(10, Math.max(0, value))
    : fallback
}

function evidence(value: unknown): FindingEvidence | undefined {
  if (!isRecord(value)) return undefined
  const rawConfidence = text(value.confidence, 'unavailable', 20) as EvidenceConfidence
  return {
    measured: text(value.measured, 'Evidence unavailable for this finding', MAX_EVIDENCE_TEXT),
    required: text(value.required, 'Evidence extraction required', MAX_EVIDENCE_TEXT),
    delta: text(value.delta, 'No evidence claim emitted', MAX_EVIDENCE_TEXT),
    selector: text(value.selector, 'N/A', 240),
    confidence: CONFIDENCE.has(rawConfidence) ? rawConfidence : 'unavailable',
    timestamp: text(value.timestamp, '', 32),
  }
}

function finding(value: unknown, index: number): Finding | null {
  if (!isRecord(value)) return null
  return {
    key: text(value.key, `finding-${index}`, 100),
    label: text(value.label, 'Finding', 200),
    impact: score(value.impact),
    effort: score(value.effort),
    quadrant: text(value.quadrant, 'fill_in', 50),
    issue: text(value.issue, 'Issue unavailable'),
    fix: text(value.fix, 'Fix unavailable'),
    evidence: evidence(value.evidence),
    principle: typeof value.principle === 'string' ? text(value.principle, '', 60) : undefined,
    principle_explanation: typeof value.principle_explanation === 'string'
      ? text(value.principle_explanation, '', 400)
      : undefined,
  }
}

export function parseAuditResult(value: unknown): AuditResult {
  if (!isRecord(value)) throw new Error('Invalid audit response')
  const rawUrl = text(value.url, '', 2_048)
  let parsedUrl: URL
  try {
    parsedUrl = new URL(rawUrl)
  } catch {
    throw new Error('Invalid audit response')
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Invalid audit response')

  const rawFindings = Array.isArray(value.findings) ? value.findings.slice(0, MAX_FINDINGS) : []
  const findings = rawFindings
    .map((item, index) => finding(item, index))
    .filter((item): item is Finding => item !== null)

  return {
    audit_id: value.audit_id === null ? null : text(value.audit_id, '', 100) || null,
    url: parsedUrl.toString(),
    status: text(value.status, 'unknown', 50),
    score: score(value.score),
    grade: text(value.grade, 'N/A', 3),
    composite: typeof value.composite === 'number' && Number.isFinite(value.composite)
      ? Math.min(10, Math.max(0, value.composite))
      : undefined,
    composite_anchor: typeof value.composite_anchor === 'number' && Number.isFinite(value.composite_anchor)
      ? Math.min(10, Math.max(0, value.composite_anchor))
      : undefined,
    findings,
    error: typeof value.error === 'string' ? text(value.error, '', 300) : undefined,
    strategic_finding: typeof value.strategic_finding === 'string'
      ? text(value.strategic_finding, '', 600)
      : undefined,
  }
}
