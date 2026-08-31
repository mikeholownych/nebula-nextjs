import { isExactArtifact, conditionIdFor, rankFirstReason } from '../app/audit/[id]/results/conditionLineage'
import type { Finding } from '../app/audit/[id]/results/auditResultSchema'

function finding(partial: Partial<Finding>): Finding {
  return {
    key: 'social_proof',
    label: 'Social proof',
    impact: 8,
    effort: 3,
    quadrant: 'quick_win',
    issue: 'No qualifying proof before the CTA',
    fix: 'Improve social proof based on audit findings',
    ...partial,
  }
}

describe('condition lineage helpers', () => {
  it('rejects generic advice as an exact artifact', () => {
    expect(isExactArtifact('Improve social proof based on audit findings')).toBe(false)
    expect(isExactArtifact('[Recurring Issue] Improve social proof')).toBe(false)
  })

  it('accepts paste-ready html or quoted replacement copy', () => {
    expect(isExactArtifact('Replace the CTA with <a href="/audit">Run the free audit</a>')).toBe(true)
  })

  it('maps known keys to versioned condition ids', () => {
    expect(conditionIdFor(finding({}))).toBe('TRUST_PROOF_PROXIMITY')
  })

  it('explains first rank without conversion causality', () => {
    const text = rankFirstReason(finding({}))
    expect(text).toMatch(/failed critical condition/)
    expect(text).toMatch(/not predicted conversion loss/)
  })
})
