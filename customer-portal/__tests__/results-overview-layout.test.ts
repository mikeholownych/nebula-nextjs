/** @jest-environment node */

import { readFileSync } from 'node:fs'
import path from 'node:path'

const source = readFileSync(
  path.join(process.cwd(), 'app/audit/[id]/results/ResultsClient.tsx'),
  'utf8',
)

describe('results overview layout', () => {
  test('ReportOverview contains only two grid children (overview copy + score card)', () => {
    const reportOverviewFn = source.slice(
      source.indexOf('function ReportOverview('),
      source.indexOf('function FixFirstQueue('),
    )

    // Ensure the 2-column grid in ReportOverview does NOT contain ImmediateRepairOffer
    const gridMatch = reportOverviewFn.match(/className="grid gap-8 lg:grid-cols-\[minmax\(0,0\.85fr\)_minmax\(0,1\.15fr\)\][^"]*"/)
    expect(gridMatch).not.toBeNull()

    expect(reportOverviewFn).not.toContain('<ImmediateRepairOffer')
  })

  test('ImmediateRepairOffer is rendered as an independent section on the overview tab', () => {
    const overviewTabSection = source.slice(
      source.indexOf("activeTab === 'overview' &&"),
      source.indexOf("activeTab === 'fix-first' &&"),
    )

    const overviewIdx = overviewTabSection.indexOf('<ReportOverview')
    const immediateIdx = overviewTabSection.indexOf('<ImmediateRepairOffer')
    const fixFirstIdx = overviewTabSection.indexOf('<FixFirstQueue')

    expect(overviewIdx).toBeGreaterThanOrEqual(0)
    expect(immediateIdx).toBeGreaterThan(overviewIdx)
    expect(fixFirstIdx).toBeGreaterThan(immediateIdx)
  })

  test('ImmediateRepairOffer has centered subhead and guards against empty findings', () => {
    const immediateFn = source.slice(
      source.indexOf('function ImmediateRepairOffer('),
      source.indexOf('function ReportTabs('),
    )

    expect(immediateFn).toContain('if (!results.findings.length) return null')
    expect(immediateFn).toContain('mx-auto max-w-[65ch]')
  })
})
