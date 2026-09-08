/** @jest-environment node */

import { readFileSync } from 'node:fs'
import path from 'node:path'

const repairPage = readFileSync(path.join(process.cwd(), 'app/repair-sprint/page.tsx'), 'utf8')
const evidencePanel = readFileSync(path.join(process.cwd(), 'components/RepairEvidencePanel.tsx'), 'utf8')
const resultsPage = readFileSync(path.join(process.cwd(), 'app/audit/[id]/results/ResultsClient.tsx'), 'utf8')

describe('Mimetic-derived conversion improvements', () => {
  it('places an evidence-of-process panel beside the repair decision', () => {
    expect(repairPage).toContain('RepairEvidencePanel')
    expect(evidencePanel).toContain('Demonstration artifact')
    expect(evidencePanel).toContain('Observed condition')
    expect(evidencePanel).toContain('Exact repair artifact')
    expect(evidencePanel).toContain('Same-condition re-audit')
    expect(evidencePanel).toContain('not a customer outcome')
  })

  it('adds monitoring as a secondary path after the repair offer', () => {
    expect(resultsPage).toContain('Keep watching after the fix ships')
    expect(resultsPage).toContain('href="/pricing"')
    expect(resultsPage).toContain('The $97 repair fixes one condition')
    // Monitoring is secondary, not a replacement for the focused repair.
    expect(resultsPage).toContain('Get the repair: $${REPAIR_SPRINT_OFFER.priceUsd}')
  })

  it('does not introduce unsupported outcome or lift claims', () => {
    expect(evidencePanel).not.toContain('conversion lift')
    expect(evidencePanel).not.toContain('increased revenue')
    expect(resultsPage).not.toContain('10-20%')
    expect(resultsPage).not.toContain('10–20%')
  })
})
