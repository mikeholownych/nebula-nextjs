import {
  REPORT_NAVIGATION,
  SIGNAL_GROUPS,
  buildPriorityQueue,
  groupFindingsBySignal,
  summarizeFindings,
} from '@/app/audit/[id]/results/reportArchitecture'
import type { Finding } from '@/app/audit/[id]/results/auditResultSchema'

const finding = (overrides: Partial<Finding>): Finding => ({
  key: 'headline',
  label: 'Headline clarity',
  impact: 8,
  effort: 3,
  quadrant: 'quick_win',
  issue: 'Headline is unclear',
  fix: 'Rewrite the headline',
  ...overrides,
})

describe('audit report information architecture', () => {
  it('exposes the diagnostic journey in a stable order', () => {
    expect(REPORT_NAVIGATION.map((item) => item.id)).toEqual([
      'overview',
      'fix-first',
      'signals',
      'evidence',
      'remediation',
    ])
  })

  it('defines exactly seven conversion signal groups', () => {
    expect(SIGNAL_GROUPS).toHaveLength(7)
    expect(new Set(SIGNAL_GROUPS.map((group) => group.id)).size).toBe(7)
  })

  it('sorts the priority queue by impact descending, then effort ascending', () => {
    const findings = [
      finding({ key: 'mobile', impact: 7, effort: 2 }),
      finding({ key: 'cta', impact: 9, effort: 5 }),
      finding({ key: 'headline', impact: 9, effort: 2 }),
    ]

    expect(buildPriorityQueue(findings).map((item) => item.key)).toEqual([
      'headline',
      'cta',
      'mobile',
    ])
  })

  it('groups every known finding into one signal section', () => {
    const findings = [
      finding({ key: 'headline' }),
      finding({ key: 'cta' }),
      finding({ key: 'social_proof' }),
      finding({ key: 'mobile' }),
      finding({ key: 'load_speed' }),
      finding({ key: 'ad_signals' }),
      finding({ key: 'seo_foundations' }),
    ]

    const grouped = groupFindingsBySignal(findings)
    expect(grouped.flatMap((group) => group.findings)).toHaveLength(findings.length)
  })

  it('summarizes severity without inventing passed checks', () => {
    const summary = summarizeFindings([
      finding({ impact: 9 }),
      finding({ impact: 7 }),
      finding({ impact: 4 }),
    ])

    expect(summary).toEqual({ critical: 1, warning: 1, advisory: 1, total: 3 })
  })
})
