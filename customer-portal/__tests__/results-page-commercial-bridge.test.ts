/** @jest-environment node */

import { readFileSync } from 'node:fs'
import path from 'node:path'

const source = readFileSync(
  path.join(process.cwd(), 'app/audit/[id]/results/ResultsClient.tsx'),
  'utf8',
)

describe('results page commercial bridge', () => {
  it('presents the repair as observed condition, scoped artifact, and re-audit', () => {
    expect(source).toContain('What you receive')
    expect(source).toContain('Observed on your page')
    expect(source).toContain('One scoped repair artifact')
    expect(source).toContain('Same-condition re-audit')
    expect(source).toContain('Get the repair: $${REPAIR_SPRINT_OFFER.priceUsd}')
  })

  it('keeps generic remediation labeled as a recommended change', () => {
    expect(source).toContain("'Exact artifact' : 'Recommended change'")
    expect(source).not.toContain('Your Exact Fix')
    expect(source).not.toContain('ready to paste')
  })

  it('does not use unsupported causal or scarcity language in the bridge', () => {
    expect(source).not.toContain('Stop the leak')
    expect(source).not.toContain('fix held')
    expect(source).not.toContain('conversion lift guaranteed')
  })
})
