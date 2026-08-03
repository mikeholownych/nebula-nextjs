import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { getPostHogClient, captureServerException } from '@/app/lib/posthog-server'
import { assertPublicHttpUrl } from '@/app/lib/ssrf-guard'
import { clientAnalyticsDistinctId, hasServerAnalyticsConsent, readAttributionHeader } from '@/app/lib/analytics-consent'

/**
 * Start an audit by calling FastAPI directly
 * POST /api/audit/start
 */

export async function POST(request: NextRequest) {
  try {
    let body: { url?: string; email?: string; name?: string; referrer?: string; audit_reason?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
    const { url, referrer, audit_reason } = body

    // Validate URL
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Process URL
    let processedUrl = url.trim()
    if (!processedUrl.match(/^https?:\/\//i)) {
      processedUrl = 'https://' + processedUrl
    }

    // Validate URL format
    let parsedUrl: URL
    try {
      parsedUrl = new URL(processedUrl)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Ensure public HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: 'URL must be HTTP or HTTPS' },
        { status: 400 }
      )
    }

    // Block loopback/link-local/private/cloud-metadata targets (SSRF guard)
    try {
      await assertPublicHttpUrl(parsedUrl)
    } catch {
      return NextResponse.json(
        { error: 'URL is not a public address' },
        { status: 400 }
      )
    }

    const analyticsConsent = hasServerAnalyticsConsent(request)
    const distinctId = clientAnalyticsDistinctId(request)
    const attribution = readAttributionHeader(request)
    const anonymousEmail = `anonymous+${randomUUID()}@invalid.nebulacomponents.com`

    // Public audit start never trusts a client-supplied email; ownership is
    // established later through the signed unlock flow.
    const apiResponse = await fetch('http://127.0.0.1:8001/audit/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: processedUrl,
        email: anonymousEmail,
        name: null,
        analytics_consent: analyticsConsent,
        analytics_distinct_id: distinctId,
      }),
      signal: AbortSignal.timeout(120000) // 2 minute timeout
    })
    
    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: 'Audit service unavailable' },
        { status: 503 }
      )
    }

    let data: { audit_id?: string; url?: string; status?: string; score?: number; grade?: string; findings?: unknown }
    try {
      data = await apiResponse.json()
    } catch {
      console.error('Audit start error: FastAPI returned a 2xx with a non-JSON/empty body')
      return NextResponse.json(
        { error: 'Audit service returned an invalid response' },
        { status: 502 }
      )
    }

    if (analyticsConsent && distinctId) try {
      const ph = getPostHogClient()
      ph.capture({
        distinctId,
        event: 'audit_started',
        properties: {
          audit_id: data.audit_id,
          page_url: processedUrl,
          page_domain: parsedUrl.hostname,
          score: data.score,
          grade: data.grade,
          referrer: referrer || null,
          audit_reason: audit_reason || null,
          ...attribution,
        },
      })
      await ph.flush()
    } catch {
      // Non-fatal — never let analytics block the response
    }

    return NextResponse.json({
      audit_id: data.audit_id,
      url: data.url,
      status: data.status,
      score: data.score,
      grade: data.grade,
      findings: data.findings,
      message: 'Audit completed'
    })
  } catch (error) {
    console.error('Audit start error:', error)
    captureServerException(error, { route: 'POST /api/audit/start' })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
