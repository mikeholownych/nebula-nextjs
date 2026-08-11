'use client'

import posthog from '@/app/lib/posthog-browser'

export const CONSENT_KEY = 'nebula-cookie-consent'
export const ATTRIBUTION_KEY = 'nebula-attribution-v1'
export const AUDIT_ATTEMPT_KEY = 'nebula-audit-attempt-v1'
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'msclkid'] as const

export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const state = JSON.parse(window.localStorage.getItem(CONSENT_KEY) || 'null')
    if (state?.version >= 1) return state?.level === 'all'
    return document.documentElement.getAttribute('data-analytics-default') === 'accepted'
  } catch {
    return false
  }
}

export function persistAttribution(): Record<string, string> {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return {}
  try {
    const previous = JSON.parse(window.localStorage.getItem(ATTRIBUTION_KEY) || '{}') as Record<string, string>
    const params = new URLSearchParams(window.location.search)
    const current: Record<string, string> = {}
    for (const key of UTM_KEYS) {
      const value = params.get(key)
      if (value) current[key] = value.slice(0, 255)
    }
    const next = {
      landing_path: previous.landing_path || `${window.location.pathname}${window.location.search}`.slice(0, 500),
      first_referrer: previous.first_referrer || document.referrer.slice(0, 500),
      ...previous,
      ...current,
    }
    window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(next))
    return next
  } catch {
    return {}
  }
}

/**
 * Audit funnel correlation key.
 *
 * The audit chain is emitted from three places - the browser (`audit_submitted`,
 * `audit_email_submitted`), this app's route handlers (`audit_started`,
 * `audit_results_unlocked`) and the FastAPI service (`audit_completed`,
 * `audit_failed`). Person identity is not a usable join key across them: the
 * visitor is anonymous when the flow starts and only resolves to a stable
 * person at unlock, so a funnel built on person alone cannot connect the steps.
 *
 * `audit_attempt_id` is minted in the browser at form submit - before the audit
 * row (and therefore `audit_id`) exists - and threaded through every downstream
 * step, so the whole chain shares one key from the very first event.
 */
export function newAuditAttemptId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `aa_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
  }
}

/**
 * Bind an attempt id to the audit id the API assigned it, so the processing and
 * results pages - which only know `audit_id` from the URL - can recover it.
 */
export function rememberAuditAttemptId(auditId: string, attemptId: string): void {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return
  try {
    const map = JSON.parse(window.sessionStorage.getItem(AUDIT_ATTEMPT_KEY) || '{}') as Record<string, string>
    map[auditId] = attemptId
    window.sessionStorage.setItem(AUDIT_ATTEMPT_KEY, JSON.stringify(map))
  } catch {
    // Storage is best-effort; a missing key degrades the funnel, never the flow.
  }
}

export function auditAttemptIdFor(auditId: string): string | null {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return null
  try {
    const map = JSON.parse(window.sessionStorage.getItem(AUDIT_ATTEMPT_KEY) || '{}') as Record<string, string>
    const value = map[auditId]
    return typeof value === 'string' && value.length > 0 ? value : null
  } catch {
    return null
  }
}

export function analyticsHeaders(): Record<string, string> {
  if (!hasAnalyticsConsent()) return {}
  const attribution = persistAttribution()
  return {
    'X-NEBULA-ANALYTICS-CONSENT': 'all',
    'X-POSTHOG-DISTINCT-ID': posthog.get_distinct_id() ?? '',
    'X-POSTHOG-SESSION-ID': posthog.get_session_id() ?? '',
    'X-NEBULA-ATTRIBUTION': encodeURIComponent(JSON.stringify(attribution)).slice(0, 1900),
  }
}
