import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { getPostHogClient, captureServerException } from '@/app/lib/posthog-server'
import { assertPublicHttpUrl } from '@/app/lib/ssrf-guard'
import { clientAnalyticsDistinctId, hasServerAnalyticsConsent, readAttributionHeader } from '@/app/lib/analytics-consent'
import { checkAuditQuota } from '@/app/lib/audit-quota'

/**
 * Start an audit by calling FastAPI directly
 * POST /api/audit/start
 */

export async function POST(request: NextRequest) {
  try {
    let body: { url?: string; email?: string; name?: string; referrer?: string; audit_reason?: string; audit_attempt_id?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
    const { url, referrer, audit_reason } = body
    const auditAttemptId =
      typeof body.audit_attempt_id === 'string' && body.audit_attempt_id.trim().length > 0
        ? body.audit_attempt_id.trim().slice(0, 100)
        : null

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

    // Quota gate: check if the submitting email (from the body, if provided) is
    // within the free-tier limit. Anonymous audits (no email) always pass — quota
    // is enforced at claim/unlock time when the email is first captured.
    const submittedEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : null
    if (submittedEmail) {
      const quota = await checkAuditQuota(submittedEmail)
      if (!quota.allowed) {
        return NextResponse.json(
          {
            error: quota.reason,
            code: 'QUOTA_EXCEEDED',
            plan: quota.plan,
            resetAt: quota.resetAt,
            upgradeUrl: 'https://nebulacomponents.com/pricing',
          },
          { status: 429 },
        )
      }
    }

    const anonymousEmail = submittedEmail ?? `anonymous+${randomUUID()}@invalid.nebulacomponents.com`

    // `audit_started` must be emitted before the blocking /audit/run call, not
    // after it. /audit/run runs the audit synchronously, so capturing on the way
    // out stamped `audit_started` *later* than the `audit_completed` it precedes,
    // which no ordered funnel can step through.
    if (analyticsConsent && distinctId) try {
      const ph = getPostHogClient()
      ph.capture({
        distinctId,
        event: 'audit_started',
        properties: {
          audit_attempt_id: auditAttemptId,
          page_url: processedUrl,
          page_domain: parsedUrl.hostname,
          referrer: referrer || null,
          audit_reason: audit_reason || null,
          ...attribution,
        },
      })
      await ph.flush()
    } catch {
      // Non-fatal — never let analytics block the response
    }

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
        analytics_attempt_id: auditAttemptId,
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

    return NextResponse.json({
      audit_id: data.audit_id,
      audit_attempt_id: auditAttemptId,
      url: data.url,
      status: data.status,
      score: data.score,
      grade: data.grade,
      findings: data.findings,
      message: 'Audit completed'
    })
  } catch (error) {
    console.error('Audit start error:', error)
    if (hasServerAnalyticsConsent(request)) {
      captureServerException(error, { route: 'POST /api/audit/start' })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
