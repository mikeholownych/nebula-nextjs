'use client'

/**
 * Nebula Client Funnel Telemetry & Attribution Module
 *
 * Implements rigorous client-side tracking, exposure detection,
 * dual-layer attribution persistence, identity management, and dual projection
 * (GA4 + PostHog + Internal Event Ledger).
 */

import posthog from '@/app/lib/posthog-browser'
import {
  getEventDefinition,
  sanitizeForGA4,
  validateEventPayload,
} from './analytics-registry'
import { hasAnalyticsConsent } from './client-analytics'

export const ANONYMOUS_ID_KEY = 'nebula_anon_id_v1'
export const SESSION_ID_KEY = 'nebula_session_id_v1'
export const JOURNEY_ID_KEY = 'nebula_journey_id_v1'
export const FIRST_TOUCH_KEY = 'nebula_first_touch_v1'
export const CURRENT_TOUCH_KEY = 'nebula_current_touch_v1'
export const SEEN_EXPOSURES_KEY = 'nebula_seen_exposures_v1'

export function getOrCreateJourneyId(): string {
  if (typeof window === 'undefined') return 'server_journey'
  try {
    let journeyId = sessionStorage.getItem(JOURNEY_ID_KEY)
    if (!journeyId) {
      journeyId = `j_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
      sessionStorage.setItem(JOURNEY_ID_KEY, journeyId)
    }
    return journeyId
  } catch {
    return 'j_fallback'
  }
}

const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
  'msclkid',
] as const

export function getDeviceClass(): 'desktop' | 'mobile' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop'
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

export function getOrCreateAnonymousId(): string {
  if (typeof window === 'undefined') return 'server_anon'
  try {
    let anonId = localStorage.getItem(ANONYMOUS_ID_KEY)
    if (!anonId) {
      anonId = crypto.randomUUID ? crypto.randomUUID() : `anon_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      localStorage.setItem(ANONYMOUS_ID_KEY, anonId)
    }
    return anonId
  } catch {
    return 'anon_fallback'
  }
}

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server_session'
  try {
    let sessId = sessionStorage.getItem(SESSION_ID_KEY)
    if (!sessId) {
      sessId = crypto.randomUUID ? crypto.randomUUID() : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      sessionStorage.setItem(SESSION_ID_KEY, sessId)
    }
    return sessId
  } catch {
    return 'sess_fallback'
  }
}

export function syncAttribution(): { firstTouch: Record<string, string>; currentTouch: Record<string, string> } {
  if (typeof window === 'undefined') return { firstTouch: {}, currentTouch: {} }

  try {
    const params = new URLSearchParams(window.location.search)
    const currentParams: Record<string, string> = {}
    for (const key of UTM_KEYS) {
      const val = params.get(key)
      if (val) currentParams[key] = val.slice(0, 255)
    }

    const currentLanding = `${window.location.pathname}${window.location.search}`.slice(0, 500)
    const currentReferrer = document.referrer ? document.referrer.slice(0, 500) : 'direct'

    // First touch persistence (never overwrite once set)
    let firstTouch = JSON.parse(localStorage.getItem(FIRST_TOUCH_KEY) || '{}')
    if (!firstTouch.landing_path) {
      firstTouch = {
        first_touch_source: currentParams.utm_source || (currentReferrer.includes('google') ? 'google' : currentReferrer.includes('bing') ? 'bing' : 'organic/direct'),
        first_touch_medium: currentParams.utm_medium || 'none',
        first_touch_campaign: currentParams.utm_campaign || 'none',
        first_touch_term: currentParams.utm_term || '',
        first_touch_content: currentParams.utm_content || '',
        first_landing_path: currentLanding,
        first_referrer: currentReferrer,
        first_seen_at: new Date().toISOString(),
        ...currentParams,
      }
      localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(firstTouch))
    }

    // Current touch persistence
    const currentTouch = {
      current_source: currentParams.utm_source || 'direct',
      current_medium: currentParams.utm_medium || 'none',
      current_campaign: currentParams.utm_campaign || 'none',
      current_landing_path: currentLanding,
      current_referrer: currentReferrer,
      updated_at: new Date().toISOString(),
      ...currentParams,
    }
    sessionStorage.setItem(CURRENT_TOUCH_KEY, JSON.stringify(currentTouch))

    return { firstTouch, currentTouch }
  } catch {
    return { firstTouch: {}, currentTouch: {} }
  }
}

/**
 * Universal Funnel Event Dispatcher
 */
export function trackClientFunnelEvent(
  eventName: string,
  properties: Record<string, unknown> = {},
  options: {
    auditAttemptId?: string | null
    auditId?: string | null
    checkoutSessionId?: string | null
    transactionId?: string | null
    dedupKey?: string | null
  } = {}
): void {
  if (typeof window === 'undefined') return

  const def = getEventDefinition(eventName)
  const validation = validateEventPayload(eventName, properties)
  if (!validation.valid) {
    console.warn(`[ClientFunnel] Validation warning for ${eventName}:`, validation.errors)
  }

  const anonId = getOrCreateAnonymousId()
  const sessionId = getOrCreateSessionId()
  const journeyId = getOrCreateJourneyId()
  const deviceClass = getDeviceClass()
  const { firstTouch, currentTouch } = syncAttribution()

  const enrichedProperties: Record<string, unknown> = {
    ...firstTouch,
    ...currentTouch,
    ...properties,
    device_class: deviceClass,
    anonymous_user_id: anonId,
    session_id: sessionId,
    journey_id: journeyId,
    audit_attempt_id: options.auditAttemptId || properties.audit_attempt_id || null,
    audit_id: options.auditId || properties.audit_id || null,
    checkout_session_id: options.checkoutSessionId || properties.checkout_session_id || null,
  }

  const consent = hasAnalyticsConsent()

  // 1. PostHog Client Projection
  if (consent) {
    try {
      posthog.capture(eventName, enrichedProperties)
    } catch {
      // Non-blocking
    }
  }

  // 2. GA4 Client Projection (Consent-guarded & sanitized)
  if (consent && window.gtag && def?.ga4_projectable) {
    try {
      const ga4EventName = def.ga4_event_name || eventName
      const ga4Params = sanitizeForGA4(eventName, enrichedProperties)
      window.gtag('event', ga4EventName, ga4Params)
    } catch {
      // Non-blocking
    }
  }

  // 3. Internal Event Ledger API Endpoint (Resilient backend persistence)
  try {
    const payload = {
      eventName,
      eventVersion: def?.version || 1,
      stage: def?.stage || 'acquisition',
      sourceSystem: 'client_browser',
      occurredAt: new Date().toISOString(),
      anonymousUserId: anonId,
      sessionId,
      journeyId,
      auditAttemptId: options.auditAttemptId || (properties.audit_attempt_id as string) || null,
      auditId: options.auditId || (properties.audit_id as string) || null,
      checkoutSessionId: options.checkoutSessionId || (properties.checkout_session_id as string) || null,
      transactionId: options.transactionId || (properties.transaction_id as string) || null,
      landingPath: window.location.pathname.slice(0, 500),
      referrerClass: document.referrer ? (document.referrer.includes('google') ? 'search_engine' : 'referral') : 'direct',
      utmSource: (currentTouch.utm_source || firstTouch.utm_source || null) as string | null,
      utmMedium: (currentTouch.utm_medium || firstTouch.utm_medium || null) as string | null,
      utmCampaign: (currentTouch.utm_campaign || firstTouch.utm_campaign || null) as string | null,
      utmContent: (currentTouch.utm_content || firstTouch.utm_content || null) as string | null,
      utmTerm: (currentTouch.utm_term || firstTouch.utm_term || null) as string | null,
      deviceClass,
      dedupKey: options.dedupKey || null,
      properties: enrichedProperties,
    }

    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
      navigator.sendBeacon('/api/analytics/funnel', blob)
    } else {
      fetch('/api/analytics/funnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => undefined)
    }
  } catch {
    // Non-blocking
  }
}

/**
 * Deduplicated Exposure Tracking (fires once per session for a given beacon ID)
 */
export function trackVisibilityExposure(
  beaconKey: string,
  eventName: 'audit_cta_exposed' | 'repair_sprint_exposed',
  properties: Record<string, unknown> = {}
): boolean {
  if (typeof window === 'undefined') return false

  try {
    const raw = sessionStorage.getItem(SEEN_EXPOSURES_KEY)
    const seen = new Set<string>(raw ? JSON.parse(raw) : [])

    if (seen.has(beaconKey)) {
      return false
    }

    seen.add(beaconKey)
    sessionStorage.setItem(SEEN_EXPOSURES_KEY, JSON.stringify(Array.from(seen)))

    trackClientFunnelEvent(eventName, properties, {
      dedupKey: `exposure_${beaconKey}_${getOrCreateSessionId()}`,
    })
    return true
  } catch {
    return false
  }
}
