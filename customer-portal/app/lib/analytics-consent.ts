import { createHmac } from 'node:crypto'
import type { NextRequest } from 'next/server'

export function hasServerAnalyticsConsent(request: NextRequest): boolean {
  return request.headers.get('x-nebula-analytics-consent') === 'all'
}

export function clientAnalyticsDistinctId(request: NextRequest): string | null {
  if (!hasServerAnalyticsConsent(request)) return null
  const value = request.headers.get('x-posthog-distinct-id')?.trim() ?? ''
  return value.length > 0 && value.length <= 200 ? value : null
}

export function analyticsPersonId(email: string): string {
  const secret = process.env.ANALYTICS_ID_SECRET || process.env.AUDIT_UNLOCK_SECRET
  if (!secret) throw new Error('ANALYTICS_ID_SECRET or AUDIT_UNLOCK_SECRET is required')
  return `person_${createHmac('sha256', secret).update(email.trim().toLowerCase()).digest('hex').slice(0, 32)}`
}

export function readAttributionHeader(request: NextRequest): Record<string, string> {
  if (!hasServerAnalyticsConsent(request)) return {}
  try {
    const raw = request.headers.get('x-nebula-attribution')
    if (!raw) return {}
    const parsed = JSON.parse(decodeURIComponent(raw)) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const allowed = new Set(['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','fbclid','msclkid','landing_path','first_referrer'])
    return Object.fromEntries(Object.entries(parsed as Record<string, unknown>)
      .filter(([key, value]) => allowed.has(key) && typeof value === 'string')
      .map(([key, value]) => [key, String(value).slice(0, 500)]))
  } catch {
    return {}
  }
}
