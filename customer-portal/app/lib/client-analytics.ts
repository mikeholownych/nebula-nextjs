'use client'

import posthog from '@/app/lib/posthog-browser'

export const CONSENT_KEY = 'nebula-cookie-consent'
export const ATTRIBUTION_KEY = 'nebula-attribution-v1'
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
