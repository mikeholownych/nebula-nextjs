import { readFileSync } from 'node:fs'
import path from 'node:path'

import {
  CROSS_INDUSTRY_PAID_TRAFFIC_STUDY,
} from '../app/lib/brand-evidence'
import * as brandEvidence from '../app/lib/brand-evidence'
import {
  DATASET_REGISTRY,
  CROSS_INDUSTRY_JULY_2026_STUDY,
  STATE_Q3_2026_REPORT,
  LIVE_LEAK_INDEX,
} from '../app/lib/datasets'

/**
 * P0-1 regression guard (LLM_AUTHORITY_90DAY_PLAN.md): published cohort
 * surfaces reported three different sample sizes (86 / 131 / live) with
 * nothing reconciling them. Frozen editions are allowed to keep a fixed n;
 * what is banned is (a) constants claiming to describe the *current* dataset
 * and (b) surfaces whose declared denominator drifts from the registry.
 */
describe('dataset registry (P0-1 single-sourcing)', () => {
  it('declares every published cohort surface', () => {
    const ids = DATASET_REGISTRY.map((d) => d.id)
    expect(ids).toEqual([
      'cross-industry-paid-traffic-july-2026',
      'state-of-landing-page-performance-q3-2026',
      'landing-page-leak-index-live',
    ])
  })

  it('gives every record a scope, window, provenance, and source path', () => {
    for (const ds of DATASET_REGISTRY) {
      expect(ds.name.trim()).not.toBe('')
      expect(ds.scope.trim()).not.toBe('')
      expect(ds.collectionWindow.trim()).not.toBe('')
      expect(ds.asOf.trim()).not.toBe('')
      expect(ds.sourcePath.startsWith('/')).toBe(true)
      expect(ds.relationship.trim()).not.toBe('')
    }
  })

  it('keeps frozen editions pinned and the live aggregate unpinned', () => {
    expect(CROSS_INDUSTRY_JULY_2026_STUDY.kind).toBe('frozen-study')
    expect(CROSS_INDUSTRY_JULY_2026_STUDY.sampleSize).toBe(86)
    expect(STATE_Q3_2026_REPORT.kind).toBe('frozen-study')
    expect(STATE_Q3_2026_REPORT.sampleSize).toBe(131)
    expect(LIVE_LEAK_INDEX.kind).toBe('live-aggregate')
    expect(LIVE_LEAK_INDEX.sampleSize).toBeNull()
  })

  it('keeps the press-kit study record in agreement with the registry', () => {
    expect(CROSS_INDUSTRY_PAID_TRAFFIC_STUDY.sampleSize).toBe(
      CROSS_INDUSTRY_JULY_2026_STUDY.sampleSize,
    )
    expect(CROSS_INDUSTRY_PAID_TRAFFIC_STUDY.averageScore).toBe(
      CROSS_INDUSTRY_JULY_2026_STUDY.averageScore,
    )
    expect(CROSS_INDUSTRY_PAID_TRAFFIC_STUDY.date).toContain('July 2026')
  })

  it('does not resurrect hardcoded "current dataset" benchmarks', () => {
    expect('ALL_AUDITS_BENCHMARK' in brandEvidence).toBe(false)
  })

  it('keeps the Q3 research page denominator in sync with the registry', () => {
    const page = readFileSync(
      path.join(
        process.cwd(),
        'app/research/landing-page-performance-q3-2026/page.tsx',
      ),
      'utf8',
    )
    const declared = STATE_Q3_2026_REPORT.sampleSize
    expect(page).toContain(`n = ${declared} audits`)
    expect(page).toContain('frozen edition')
  })
})
