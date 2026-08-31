import type { Finding } from './auditResultSchema'
import { findingSeverity } from './reportArchitecture'

const CONDITION_IDS: Record<string, string> = {
  cta: 'PRIMARY_CTA_CLARITY',
  above_fold: 'ABOVE_FOLD_CLARITY',
  headline: 'HEADLINE_MESSAGE_MATCH',
  social_proof: 'TRUST_PROOF_PROXIMITY',
  load_speed: 'LOAD_SPEED',
  mobile: 'MOBILE_VIEWPORT',
  ad_signals: 'AD_TRACKING',
  seo_foundations: 'SEO_FOUNDATIONS',
  ai_readiness: 'AI_READINESS',
}

export function conditionIdFor(finding: Finding): string {
  if (finding.condition_id) return finding.condition_id
  return CONDITION_IDS[finding.key] || finding.key.toUpperCase()
}

export function conditionVersionFor(finding: Finding): number {
  return finding.condition_version ?? 1
}

export function isExactArtifact(fix: string): boolean {
  const text = fix.trim()
  if (text.length < 24) return false
  if (/^improve\b/i.test(text)) return false
  if (/based on audit findings/i.test(text)) return false
  if (/\[recurring issue\]/i.test(text)) return false
  if (/not meeting threshold/i.test(text)) return false
  return /<|>|`|selector|replace |add this|paste |href=|class=/i.test(text) || text.includes('\n')
}

export function rankFirstReason(finding: Finding): string {
  const severity = findingSeverity(finding)
  const effort =
    finding.effort <= 4
      ? 'lower estimated implementation effort'
      : 'higher estimated implementation effort'
  return `Ranked first because it is a failed ${severity} condition with ${effort}. Rank uses condition severity and effort, not predicted conversion loss.`
}

export const QUADRANT_DEFINITIONS: Record<string, string> = {
  quick_win: 'Failed high-severity condition, lower implementation effort',
  major_project: 'Failed high-severity condition, higher implementation effort',
  fill_in: 'Lower-severity condition, lower implementation effort',
  strategic: 'Foundational or cross-condition work',
}
