/** @jest-environment node */

import {
  CANONICAL_REGISTRY,
  EVENT_MAP,
  VALID_FAILURE_REASONS,
  PROHIBITED_PROPERTIES,
  validateEventPayload,
  sanitizeForGA4,
  getEventDefinition,
  isCanonicalEvent,
} from '@/app/lib/analytics-registry'

describe('Analytics Governance & Canonical Event Registry', () => {
  it('loads canonical registry with required structure and non-empty events', () => {
    expect(CANONICAL_REGISTRY.version).toBeDefined()
    expect(CANONICAL_REGISTRY.events.length).toBeGreaterThan(10)
    expect(VALID_FAILURE_REASONS.size).toBeGreaterThan(5)
    expect(PROHIBITED_PROPERTIES.size).toBeGreaterThan(5)
  })

  it('contains all core funnel events', () => {
    const requiredEvents = [
      'landing_page_view',
      'audit_cta_exposed',
      'audit_cta_clicked',
      'audit_url_submitted',
      'audit_accepted',
      'audit_started',
      'audit_completed',
      'audit_failed',
      'audit_result_viewed',
      'finding_expanded',
      'repair_sprint_exposed',
      'repair_sprint_clicked',
      'checkout_started',
      'checkout_creation_failed',
      'purchase_completed',
    ]

    for (const evt of requiredEvents) {
      expect(isCanonicalEvent(evt)).toBe(true)
      const def = getEventDefinition(evt)
      expect(def).toBeDefined()
      expect(def?.stage).toBeDefined()
      expect(def?.source_of_truth).toBeDefined()
      expect(def?.privacy_classification).toBeDefined()
    }
  })

  it('rejects unknown events during validation', () => {
    const res = validateEventPayload('fake_event_name', {})
    expect(res.valid).toBe(false)
    expect(res.errors[0]).toContain('Unknown canonical event')
  })

  it('rejects prohibited properties (e.g. password, card_number)', () => {
    const res = validateEventPayload('landing_page_view', {
      landing_path: '/',
      password: 'secretPassword123',
    })
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.includes('Prohibited property'))).toBe(true)
  })

  it('flags missing required properties', () => {
    const res = validateEventPayload('audit_completed', {
      // missing score_bucket, grade, audit_id
    })
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.includes('Missing required property'))).toBe(true)
  })

  it('validates normalized failure reasons', () => {
    const validRes = validateEventPayload('audit_failed', {
      reason_code: 'crawl_failure',
    })
    expect(validRes.valid).toBe(true)

    const invalidRes = validateEventPayload('audit_failed', {
      reason_code: 'random_unregistered_reason',
    })
    expect(invalidRes.valid).toBe(false)
    expect(invalidRes.errors.some((e) => e.includes('Invalid normalized failure reason'))).toBe(true)
  })

  it('sanitizes GA4 properties to prevent PII and unbounded cardinality', () => {
    const raw = {
      page_url: 'https://example.com/pricing?token=secret123&utm_source=google',
      score: 85,
      valid_flag: true,
      email: 'user@example.com', // prohibited
      custom_val: 'a'.repeat(200), // should be truncated
    }

    const sanitized = sanitizeForGA4('landing_page_view', raw)
    expect(sanitized.email).toBeUndefined()
    expect(sanitized.score).toBe(85)
    expect(sanitized.valid_flag).toBe(true)
    expect(sanitized.page_url).toBe('https://example.com/pricing')
    expect(String(sanitized.custom_val).length).toBeLessThanOrEqual(100)
  })
})
