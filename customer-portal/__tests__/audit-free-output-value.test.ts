import { classifyFreePreview } from '../app/audit/[id]/results/freePreview'
import type { Finding } from '../app/audit/[id]/results/auditResultSchema'

const finding = (overrides: Partial<Finding>): Finding => ({
  key: 'headline', label: 'Headline', impact: 8, effort: 3, quadrant: 'quick_win',
  issue: 'The headline does not match the visitor intent.',
  fix: 'Replace the headline with the exact offer language from the ad. Keep the promise specific.',
  ...overrides,
})

describe('free audit output value', () => {
  it('classifies an exact artifact as a bounded safe preview with the observed condition', () => {
    const decision = classifyFreePreview(finding({}))
    expect(decision).toEqual({
      kind: 'safe_preview',
      observed: 'The headline does not match the visitor intent.',
      change: 'Replace the headline with the exact offer language from the ad.',
    })
    expect(JSON.stringify(decision)).not.toMatch(/increase|conversion lift|revenue/i)
  })

  it('keeps generic recommendations behind the paid artifact boundary', () => {
    expect(classifyFreePreview(finding({ fix: 'Improve the page messaging based on audit findings.' }))).toEqual({
      kind: 'paid_artifact',
    })
  })

  it('does not create a preview when the finding has no fix', () => {
    expect(classifyFreePreview(finding({ fix: 'Fix unavailable' }))).toEqual({ kind: 'no_preview' })
  })
})
