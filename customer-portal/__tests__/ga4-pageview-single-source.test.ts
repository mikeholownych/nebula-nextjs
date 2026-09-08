/**
 * GA4 page_view single-source test.
 *
 * Mimetic's audit flagged that GA4 (G-KJ9S3450LH) fires page_view twice per
 * load, inflating sessions ~2x and understating conversion rate ~2x. The
 * double-count came from two parallel paths:
 *
 *   1. AnalyticsRuntime.gaPageView() -> gtag('event', 'page_view', ...)
 *   2. trackClientFunnelEvent('landing_page_view') -> gtag('event', 'page_view', ...)
 *
 * The fix consolidates on the canonical landing_page_view funnel event (which
 * carries attribution and persists to the internal ledger) and removes the
 * redundant raw gaPageView(). These tests lock that invariant.
 */

import fs from 'fs'
import path from 'path'
import { getEventDefinition } from '@/app/lib/analytics-registry'

const APP_DIR = path.join(process.cwd(), 'app')

function readSource(rel: string): string {
  return fs.readFileSync(path.join(APP_DIR, rel), 'utf8')
}

describe('GA4 page_view single-source invariant', () => {
  it('landing_page_view is the single canonical GA4 page_view projection', () => {
    const def = getEventDefinition('landing_page_view')
    expect(def).toBeDefined()
    expect(def?.ga4_projectable).toBe(true)
    expect(def?.ga4_event_name).toBe('page_view')
  })

  it('landing_page_view carries page_location and page_title so GA4 loses nothing', () => {
    const def = getEventDefinition('landing_page_view')
    expect(def?.allowed_properties).toContain('page_location')
    expect(def?.allowed_properties).toContain('page_title')
  })

  it('AnalyticsRuntime no longer fires a raw gtag page_view (the double-count source)', () => {
    const src = readSource('components/AnalyticsRuntime.tsx')
    // The redundant direct call must be gone. The funnel path is the only
    // page_view source now (it lives in client-funnel.ts, not here).
    expect(src).not.toMatch(/window\.gtag\??\.?\(['"]event['"],\s*['"]page_view['"]/)
  })

  it('AnalyticsRuntime still fires the funnel landing_page_view (single source)', () => {
    const src = readSource('components/AnalyticsRuntime.tsx')
    expect(src).toContain("trackClientFunnelEvent('landing_page_view'")
  })
})
