import { SEO_FOUNDATIONS_FIXTURE } from './fixtures/remediation/seo-foundations'
import { CTA_CLARITY_FIXTURE } from './fixtures/remediation/cta-clarity'
import { MESSAGE_MATCH_FIXTURE } from './fixtures/remediation/message-match'
import { ABOVE_FOLD_FIXTURE } from './fixtures/remediation/above-fold'
import { TRUST_SIGNALS_FIXTURE } from './fixtures/remediation/trust-signals'
import { LOAD_SPEED_FIXTURE } from './fixtures/remediation/load-speed'
import { MOBILE_VIEWPORT_FIXTURE } from './fixtures/remediation/mobile-viewport'
import { AD_TRACKING_FIXTURE } from './fixtures/remediation/ad-tracking'
import { AI_READINESS_FIXTURE } from './fixtures/remediation/ai-readiness'

/**
 * Validates that remediation fixtures are structurally sound:
 * - FAIL fixture has expected fail state
 * - PASS fixture has expected pass state
 * - Remediation changes are defined and non-empty
 * - Applying remediation to FAIL fixture produces PASS fixture (structural check)
 */

const fixtures = [
  { name: 'SEO Foundations', fixture: SEO_FOUNDATIONS_FIXTURE },
  { name: 'CTA Clarity', fixture: CTA_CLARITY_FIXTURE },
  { name: 'Message Match', fixture: MESSAGE_MATCH_FIXTURE },
  { name: 'Above Fold', fixture: ABOVE_FOLD_FIXTURE },
  { name: 'Trust Signals', fixture: TRUST_SIGNALS_FIXTURE },
  { name: 'Load Speed', fixture: LOAD_SPEED_FIXTURE },
  { name: 'Mobile Viewport', fixture: MOBILE_VIEWPORT_FIXTURE },
  { name: 'Ad Tracking', fixture: AD_TRACKING_FIXTURE },
  { name: 'AI Readiness', fixture: AI_READINESS_FIXTURE },
]

describe('Remediation Fixtures', () => {
  it.each(fixtures)('$name: FAIL fixture has expected result', ({ fixture }) => {
    expect(fixture.failCase.expectedResult).toBe('FAIL')
    expect(fixture.failCase.html).toBeTruthy()
    expect(fixture.failCase.description).toBeTruthy()
  })

  it.each(fixtures)('$name: PASS fixture has expected result', ({ fixture }) => {
    expect(fixture.passCase.expectedResult).toBe('PASS')
    expect(fixture.passCase.html).toBeTruthy()
    expect(fixture.passCase.description).toBeTruthy()
  })

  it.each(fixtures)('$name: remediation defines concrete changes', ({ fixture }) => {
    expect(fixture.remediation.changes.length).toBeGreaterThan(0)
    for (const change of fixture.remediation.changes) {
      expect(change.target).toBeTruthy()
      expect(change.before).toBeTruthy()
      expect(change.after).toBeTruthy()
      expect(change.before).not.toBe(change.after)
    }
  })

  it.each(fixtures)('$name: FAIL fixture contains the before values', ({ fixture }) => {
    for (const change of fixture.remediation.changes) {
      expect(fixture.failCase.html).toContain(change.before)
    }
  })

  it.each(fixtures)('$name: applying remediation to FAIL replaces all before with after', ({ fixture }) => {
    let repaired = fixture.failCase.html
    for (const change of fixture.remediation.changes) {
      repaired = repaired.replace(change.before, change.after)
    }
    for (const change of fixture.remediation.changes) {
      expect(repaired).toContain(change.after)
      expect(repaired).not.toContain(change.before)
    }
  })
})
