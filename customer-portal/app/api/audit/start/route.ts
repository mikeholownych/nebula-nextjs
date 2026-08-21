import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { getPostHogClient, captureServerException } from '@/app/lib/posthog-server'
import { assertPublicHttpUrl } from '@/app/lib/ssrf-guard'
import { clientAnalyticsDistinctId, hasServerAnalyticsConsent, readAttributionHeader } from '@/app/lib/analytics-consent'
import { checkAuditQuota } from '@/app/lib/audit-quota'
import { recordFunnelEvent } from '@/app/lib/funnel-ledger'
import { logApiError } from '@/app/lib/ops-log'
import { readCappedJson } from '@/app/lib/request-limits'
import { signAuditUnlock } from '@/app/lib/audit-unlock-token'
import { unlockCookieName } from '@/app/lib/audit-access'
import { requireWorkspaceUser } from '@/app/lib/workspace-auth'

/**
 * Start an audit by calling FastAPI directly
 * POST /api/audit/start
 */

function isTimeoutError(error: unknown): boolean {
  const name = error instanceof Error ? error.name : ''
  const message = error instanceof Error ? error.message : String(error)
  return name === 'TimeoutError' || name === 'AbortError' || /timeout|aborted/i.test(message)
}

function platformApiUrl(): string {
  return (process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001').replace(/\/$/, '')
}

function visitorForwardedFor(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for')?.trim()
  if (forwarded) return forwarded
  const realIp = request.headers.get('x-real-ip')?.trim()
  return realIp || null
}

function auditRunHeaders(request: NextRequest, email: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-ID': request.headers.get('x-request-id')?.trim() || randomUUID(),
  }
  const forwardedFor = visitorForwardedFor(request)
  if (forwardedFor) headers['X-Forwarded-For'] = forwardedFor
  if (email) headers['X-Audit-Email'] = email
  return headers
}

export async function POST(request: NextRequest) {
  const attribution = readAttributionHeader(request)
  const analyticsConsent = hasServerAnalyticsConsent(request)
  const distinctId = clientAnalyticsDistinctId(request)
  const requestId = request.headers.get('x-request-id')?.trim() || null
  let auditAttemptId: string | null = null
  let journeyId: string | null = null

  const withRequestId = (properties: Record<string, unknown>): Record<string, unknown> => (
    requestId ? { ...properties, request_id: requestId } : properties
  )

  try {
    const parsed = await readCappedJson<{ url?: string; email?: string; name?: string; referrer?: string; audit_reason?: string; audit_attempt_id?: string; journey_id?: string; monthly_ad_spend?: number }>(request)
    if (!parsed.ok) {
      if (parsed.response.status !== 413) {
        await recordFunnelEvent({
          eventName: 'audit_submission_rejected',
          sourceSystem: 'server_api',
          failureReason: 'invalid_payload',
          properties: withRequestId({ reason_code: 'invalid_payload' }),
        })
      }
      return parsed.response
    }
    const body = parsed.body
    const { url, referrer, audit_reason, monthly_ad_spend } = body
    auditAttemptId =
      typeof body.audit_attempt_id === 'string' && body.audit_attempt_id.trim().length > 0
        ? body.audit_attempt_id.trim().slice(0, 100)
        : null
    journeyId =
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
        properties: withRequestId({ reason_code: 'invalid_url' }),
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
        properties: withRequestId({ reason_code: 'invalid_url' }),
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
        properties: withRequestId({ reason_code: 'unsupported_scheme' }),
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
        properties: withRequestId({ reason_code: 'blocked_target' }),
      })
      return NextResponse.json(
        { error: 'URL is not a public address' },
        { status: 400 }
      )
    }

    // Quota gate: check if the submitting email is within the free-tier limit.
    let submittedEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : null
    if (!submittedEmail) {
      const authHeader = request.headers.get('authorization')
      const cookieHeader = request.headers.get('cookie')
      const tokenCookie = request.cookies.get('access_token')?.value
      if (tokenCookie || authHeader || (cookieHeader && cookieHeader.includes('access_token'))) {
        try {
          const auth = await requireWorkspaceUser(request)
          if (!('response' in auth) && auth.user?.email) {
            submittedEmail = auth.user.email.trim().toLowerCase()
          }
        } catch {
          // Non-fatal if not authenticated in workspace
        }
      }
    }

    if (submittedEmail) {
      const quota = await checkAuditQuota(submittedEmail)
      if (!quota.allowed) {
        await recordFunnelEvent({
          eventName: 'audit_submission_rejected',
          sourceSystem: 'server_api',
          auditAttemptId,
          failureReason: 'quota_exceeded',
          properties: withRequestId({ reason_code: 'quota_exceeded' }),
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

    const apiResponse = await fetch(`${platformApiUrl()}/audit/accept`, {
      method: 'POST',
      headers: auditRunHeaders(request, anonymousEmail),
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
      signal: AbortSignal.timeout(10_000),
    })

    if (!apiResponse.ok) {
      const failureReason = apiResponse.status === 504 ? 'fetch_timeout' : 'internal_error'
      await recordFunnelEvent({
        eventName: 'audit_failed',
        stage: 'audit_execution',
        sourceSystem: 'server_api',
        auditAttemptId,
        journeyId,
        failureReason,
        properties: withRequestId({ reason_code: failureReason, status_code: apiResponse.status }),
      })
      return NextResponse.json(
        { error: 'Audit service unavailable' },
        { status: apiResponse.status === 504 ? 504 : 503 }
      )
    }

    let data: { audit_id?: string; url?: string; status?: string; score?: number; grade?: string; findings?: unknown }
    try {
      data = await apiResponse.json()
    } catch {
      logApiError('Audit start error: FastAPI returned a 2xx with a non-JSON/empty body', {
        request_id: requestId,
        journey_id: journeyId,
      })
      await recordFunnelEvent({
        eventName: 'audit_failed',
        stage: 'audit_execution',
        sourceSystem: 'server_api',
        auditAttemptId,
        failureReason: 'invalid_payload',
        properties: withRequestId({ reason_code: 'invalid_payload' }),
      })
      return NextResponse.json(
        { error: 'Audit service returned an invalid response' },
        { status: 502 }
      )
    }

    if (data.status === 'error' || data.status === 'failed') {
      await recordFunnelEvent({
        eventName: 'audit_failed',
        stage: 'audit_execution',
        sourceSystem: 'server_api',
        auditAttemptId,
        journeyId,
        failureReason: 'internal_error',
        properties: withRequestId({ reason_code: 'internal_error', engine_status: data.status }),
      })
      return NextResponse.json(
        { error: 'Audit failed' },
        { status: 502 }
      )
    }

    const auditId = typeof data.audit_id === 'string' ? data.audit_id : null

    await recordFunnelEvent({
      eventName: 'audit_accepted',
      stage: 'audit_intake',
      sourceSystem: 'server_api',
      auditAttemptId,
      auditId,
      journeyId,
      properties: withRequestId({
        audit_attempt_id: auditAttemptId,
        audit_id: auditId,
        journey_id: journeyId,
        page_domain: parsedUrl.hostname,
        referrer_class: referrer || null,
      }),
    })

    await recordFunnelEvent({
      eventName: 'audit_started',
      stage: 'audit_execution',
      sourceSystem: 'server_api',
      auditAttemptId,
      auditId,
      journeyId,
      properties: withRequestId({
        audit_attempt_id: auditAttemptId,
        audit_id: auditId,
        journey_id: journeyId,
        page_domain: parsedUrl.hostname,
        referrer_class: referrer || null,
      }),
    })

    if (analyticsConsent && distinctId) try {
      const ph = getPostHogClient()
      ph.capture({
        distinctId,
        event: 'audit_started',
        properties: {
          audit_id: auditId,
          audit_attempt_id: auditAttemptId,
          journey_id: journeyId,
          page_url: processedUrl,
          page_domain: parsedUrl.hostname,
          referrer: referrer || null,
          audit_reason: audit_reason || null,
          ...attribution,
        },
      })
    } catch {
      // Non-fatal - never let analytics block the response
    }

    const response = NextResponse.json({
      audit_id: auditId,
      audit_attempt_id: auditAttemptId,
      url: data.url,
      status: data.status || 'pending',
      message: 'Audit accepted',
    })

    if (auditId) {
      try {
        const token = signAuditUnlock(auditId, anonymousEmail)
        response.cookies.set(unlockCookieName(auditId), token, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        })
      } catch {
        // Non-fatal if AUDIT_UNLOCK_SECRET is not set
      }
    }

    return response
  } catch (error) {
    logApiError('Audit start error', { request_id: requestId, journey_id: journeyId, error })
    if (hasServerAnalyticsConsent(request)) {
      captureServerException(error, { route: 'POST /api/audit/start' })
    }
    const timeout = isTimeoutError(error)
    const failureReason = timeout ? 'fetch_timeout' : 'network_error'
    await recordFunnelEvent({
      eventName: 'audit_failed',
      stage: 'audit_execution',
      sourceSystem: 'server_api',
      auditAttemptId,
      journeyId,
      failureReason,
      properties: withRequestId({ reason_code: failureReason }),
    })
    return NextResponse.json(
      { error: timeout ? 'Audit timed out' : 'Internal server error' },
      { status: timeout ? 504 : 500 }
    )
  }
}
