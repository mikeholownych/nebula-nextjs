import type { Finding } from './auditResultSchema'
import { isExactArtifact } from './conditionLineage'

export type FreePreviewDecision =
  | { kind: 'safe_preview'; observed: string; change: string }
  | { kind: 'paid_artifact' }
  | { kind: 'no_preview' }

export function classifyFreePreview(finding: Finding): FreePreviewDecision {
  const fix = finding.fix.trim()
  if (!fix || fix === 'Fix unavailable') return { kind: 'no_preview' }
  if (!isExactArtifact(fix)) return { kind: 'paid_artifact' }

  const observed = finding.issue.trim()
  if (!observed) return { kind: 'no_preview' }

  const firstSentence = fix.search(/\.\s/)
  const change = (firstSentence > 20 ? fix.slice(0, firstSentence + 1) : fix.slice(0, 180)).trim()
  if (!change) return { kind: 'no_preview' }

  return { kind: 'safe_preview', observed, change }
}
