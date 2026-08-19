import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { getPostHogClient, captureServerException } from '@/app/lib/posthog-server'
import { assertPublicHttpUrl } from '@/app/lib/ssrf-guard'
import { clientAnalyticsDistinctId, hasServerAnalyticsConsent, readAttributionHeader } from '@/app/lib/analytics-consent'
import { checkAuditQuota } from '@/app/lib/audit-quota'
import { recordFunnelEvent } from '@/app/lib/funnel-ledger'

/**
 * Start an audit by calling FastAPI directly
 * POST /api/audit/start
 */

export async function POST(request: NextRequest) {
  const attribution = readAttributionHeader(request)
  const analyticsConsent = hasServerAnalyticsConsent(request)
  const distinctId = clientAnalyticsDistinctId(request)

  try {
    let body: { url?: string; email?: string; name?: string; referrer?: string; audit_reason?: string; audit_attempt_id?: string; journey_id?: string; monthly_ad_spend?: number }
    try {
      body = await request.json()
    } catch {
      await recordFunnelEvent({
        eventName: 'audit_submission_rejected',
        sourceSystem: 'server_api',
        failureReason: 'invalid_payload',
        properties: { reason_code: 'invalid_payload' },
      })
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
    const { url, referrer, audit_reason, monthly_ad_spend } = body
    const auditAttemptId =
      typeof body.audit_attempt_id === 'string' && body.audit_attempt_id.trim().length > 0
        ? body.audit_attempt_id.trim().slice(0, 100)
        : null
    const journeyId =
      typeof body.journey_id === 'string' && body.journey_id.trim().length > 0
        ? body.journey_id.trim().slice(0, 100)
        : null

    // Validate URL
    if (!url) {
      await recordFunnelEvent({
        eventName: 'audit_submission_rejected',
        sourceSystem: 'server_api',
        auditAttemptId,
        failureReason: 'invalid_url',
        properties: { reason_code: 'invalid_url' },
      })
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
      await recordFunnelEvent({
        eventName: 'audit_submission_rejected',
        sourceSystem: 'server_api',
        auditAttemptId,
        failureReason: 'invalid_url',
        properties: { reason_code: 'invalid_url' },
      })
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Ensure public HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      await recordFunnelEvent({
        eventName: 'audit_submission_rejected',
        sourceSystem: 'server_api',
        auditAttemptId,
        failureReason: 'unsupported_scheme',
        properties: { reason_code: 'unsupported_scheme' },
      })
      return NextResponse.json(
        { error: 'URL must be HTTP or HTTPS' },
        { status: 400 }
      )
    }

    // Block loopback/link-local/private/cloud-metadata targets (SSRF guard)
    try {
      await assertPublicHttpUrl(parsedUrl)
    } catch {
      await recordFunnelEvent({
        eventName: 'audit_submission_rejected',
        sourceSystem: 'server_api',
        auditAttemptId,
        failureReason: 'blocked_target',
        properties: { reason_code: 'blocked_target' },
      })
      return NextResponse.json(
        { error: 'URL is not a public address' },
        { status: 400 }
      )
    }

    // Quota gate: check if the submitting email is within the free-tier limit.
    const submittedEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : null
    if (submittedEmail) {
      const quota = await checkAuditQuota(submittedEmail)
      if (!quota.allowed) {
        await recordFunnelEvent({
          eventName: 'audit_submission_rejected',
          sourceSystem: 'server_api',
          auditAttemptId,
          failureReason: 'quota_exceeded',
          properties: { reason_code: 'quota_exceeded' },
        })
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

    // Audit accepted & started event records in internal ledger
    await recordFunnelEvent({
      eventName: 'audit_accepted',
      stage: 'audit_intake',
      sourceSystem: 'server_api',
      auditAttemptId,
      journeyId,
      properties: {
        audit_attempt_id: auditAttemptId,
        journey_id: journeyId,
        page_domain: parsedUrl.hostname,
        referrer_class: referrer || null,
      },
    })

    await recordFunnelEvent({
      eventName: 'audit_started',
      stage: 'audit_execution',
      sourceSystem: 'server_api',
      auditAttemptId,
      journeyId,
      properties: {
        audit_attempt_id: auditAttemptId,
        journey_id: journeyId,
        page_domain: parsedUrl.hostname,
        referrer_class: referrer || null,
      },
    })

    if (analyticsConsent && distinctId) try {
      const ph = getPostHogClient()
      ph.capture({
        distinctId,
        event: 'audit_started',
        properties: {
          audit_attempt_id: auditAttemptId,
          journey_id: journeyId,
          page_url: processedUrl,
          page_domain: parsedUrl.hostname,
          referrer: referrer || null,
          audit_reason: audit_reason || null,
          ...attribution,
        },
      })
      await ph.flush()
    } catch {
      // Non-fatal - never let analytics block the response
    }

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
        analytics_journey_id: journeyId,
        monthly_ad_spend: monthly_ad_spend,
      }),
      signal: AbortSignal.timeout(120000) // 2 minute timeout
    })

    if (!apiResponse.ok) {
      await recordFunnelEvent({
        eventName: 'audit_failed',
        stage: 'audit_execution',
        sourceSystem: 'server_api',
        auditAttemptId,
        journeyId,
        failureReason: 'internal_error',
        properties: { reason_code: 'internal_error', status_code: apiResponse.status },
      })
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
      await recordFunnelEvent({
        eventName: 'audit_failed',
        stage: 'audit_execution',
        sourceSystem: 'server_api',
        auditAttemptId,
        failureReason: 'invalid_payload',
        properties: { reason_code: 'invalid_payload' },
      })
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
