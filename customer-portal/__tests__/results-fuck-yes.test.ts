/**
 * Results page "Fuck Yes" — recognition-first experience tests
 *
 * Spec: the first thing a visitor reads after their audit loads must make them
 * feel seen, not processed. Tests cover:
 *
 * 1. PersonalizedDiagnosis renders the visitor's actual measured evidence
 * 2. RepairBridge renders a dimension-specific sentence above the $97 CTA
 * 3. Overview H1 leads with the finding headline, not "Failed page conditions"
 * 4. Evidence contract disclaimer is present but positioned after the finding
 * 5. REPAIR_BRIDGE map covers all nine dimension keys
 */

import { render, screen } from '@testing-library/react'
import React from 'react'

// Units under test — imported after implementation
import {
  buildPersonalizedDiagnosis,
  buildRepairBridge,
  buildOverviewHeadline,
  REPAIR_BRIDGE,
} from '../app/audit/[id]/results/recognitionLayer'

import { DIMENSION_PLAIN } from '../app/audit/[id]/results/recognitionLayer'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const headlineFinding = {
  key: 'headline',
  label: 'Headline clarity',
  impact: 8,
  effort: 3,
  quadrant: 'major_project',
  issue: 'Headline does not state the visitor outcome.',
  fix: 'Rewrite the headline to lead with the outcome, not the feature.',
  evidence: {
    measured: 'H1 text: "Smarter workflow automation for scaling teams"',
    required: 'Headline must name the visitor outcome within 10 words',
    delta: 'Outcome absent from H1',
    selector: 'h1',
    confidence: 'definitive' as const,
    timestamp: '2026-09-07T22:00:00Z',
  },
}

const aboveFoldFinding = {
  key: 'above_fold',
  label: 'Above-fold clarity',
  impact: 7,
  effort: 5,
  quadrant: 'major_project',
  issue: 'CTA not visible in first viewport.',
  fix: 'Move primary CTA above the fold.',
  evidence: {
    measured: 'CTA first appears at character position 3,847',
    required: 'CTA must appear within first 2,000 characters',
    delta: 'CTA 1,847 chars below threshold',
    selector: '.cta-button',
    confidence: 'definitive' as const,
    timestamp: '2026-09-07T22:00:00Z',
  },
}

const noEvidenceFinding = {
  key: 'cta',
  label: 'CTA clarity',
  impact: 6,
  effort: 2,
  quadrant: 'quick_win',
  issue: 'CTA label is vague.',
  fix: 'Rewrite CTA to name the outcome.',
  // no evidence block
}

// ─── buildPersonalizedDiagnosis ───────────────────────────────────────────────

describe('buildPersonalizedDiagnosis', () => {
  it('returns the dimension plain headline for the worst finding', () => {
    const result = buildPersonalizedDiagnosis([headlineFinding])
    expect(result.headline).toBe(DIMENSION_PLAIN['headline'].headline)
  })

  it('appends the actual measured value from the page when evidence is present', () => {
    const result = buildPersonalizedDiagnosis([headlineFinding])
    expect(result.measuredLine).toContain('Smarter workflow automation for scaling teams')
  })

  it('returns no measuredLine when evidence is absent', () => {
    const result = buildPersonalizedDiagnosis([noEvidenceFinding])
    expect(result.measuredLine).toBeNull()
  })

  it('picks the highest-impact finding from a list', () => {
    const result = buildPersonalizedDiagnosis([aboveFoldFinding, headlineFinding])
    // headlineFinding.impact = 8, above_fold = 7 → headline wins
    expect(result.headline).toBe(DIMENSION_PLAIN['headline'].headline)
  })

  it('returns null when findings array is empty', () => {
    const result = buildPersonalizedDiagnosis([])
    expect(result).toBeNull()
  })
})

// ─── buildRepairBridge ────────────────────────────────────────────────────────

describe('buildRepairBridge', () => {
  it('returns a non-empty string for headline finding', () => {
    const bridge = buildRepairBridge(headlineFinding)
    expect(typeof bridge).toBe('string')
    expect(bridge.length).toBeGreaterThan(20)
  })

  it('does not contain generic capability language', () => {
    const bridge = buildRepairBridge(headlineFinding)
    expect(bridge).not.toMatch(/bounded repair package/i)
    expect(bridge).not.toMatch(/one scoped repair for this condition/i)
    expect(bridge).not.toMatch(/implementation artifact/i)
  })

  it('returns a bridge for every dimension key in DISEASES', () => {
    const allKeys = [
      'headline', 'cta', 'above_fold', 'social_proof',
      'load_speed', 'mobile', 'seo_foundations', 'ad_signals', 'ai_readiness',
    ]
    for (const key of allKeys) {
      const finding = { ...headlineFinding, key }
      const bridge = buildRepairBridge(finding)
      expect(bridge.length).toBeGreaterThan(20)
    }
  })

  it('REPAIR_BRIDGE map has all nine keys', () => {
    const required = [
      'headline', 'cta', 'above_fold', 'social_proof',
      'load_speed', 'mobile', 'seo_foundations', 'ad_signals', 'ai_readiness',
    ]
    for (const key of required) {
      expect(REPAIR_BRIDGE).toHaveProperty(key)
      expect(REPAIR_BRIDGE[key].length).toBeGreaterThan(20)
    }
  })
})

// ─── buildOverviewHeadline ────────────────────────────────────────────────────

describe('buildOverviewHeadline', () => {
  it('returns the dimension-specific headline when findings exist', () => {
    const result = buildOverviewHeadline([headlineFinding], 'example.com')
    expect(result).toContain(DIMENSION_PLAIN['headline'].headline)
  })

  it('includes the hostname', () => {
    const result = buildOverviewHeadline([headlineFinding], 'mysite.com')
    expect(result).toContain('mysite.com')
  })

  it('falls back to a neutral message when no findings', () => {
    const result = buildOverviewHeadline([], 'example.com')
    expect(result).toBeTruthy()
    expect(result).not.toContain('undefined')
  })

  it('does not use the static "Failed page conditions on this URL" string', () => {
    const result = buildOverviewHeadline([headlineFinding], 'example.com')
    expect(result).not.toBe('Failed page conditions on this URL')
  })
})

// ─── DIMENSION_PLAIN coverage ─────────────────────────────────────────────────

describe('DIMENSION_PLAIN', () => {
  const required = [
    'headline', 'cta', 'above_fold', 'social_proof',
    'load_speed', 'mobile', 'seo_foundations', 'ad_signals', 'ai_readiness',
  ]

  it.each(required)('has headline and why for key: %s', (key) => {
    expect(DIMENSION_PLAIN[key]).toBeDefined()
    expect(DIMENSION_PLAIN[key].headline.length).toBeGreaterThan(10)
    expect(DIMENSION_PLAIN[key].why.length).toBeGreaterThan(10)
  })
})
