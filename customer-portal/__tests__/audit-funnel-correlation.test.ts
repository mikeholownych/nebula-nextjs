/** @jest-environment node */

// The audit funnel reported 0% conversion past `audit_completed`. Two defects in
// this route caused it, independently of any identity/merge behaviour:
//
//  1. `audit_started` was captured *after* the awaited /audit/run call. That call
//     runs the audit synchronously, so `audit_started` was stamped later than the
//     `audit_completed` it is supposed to precede - an ordered funnel can never
//     step through that.
//  2. The FastAPI service emitted its own `audit_started` for the same audit, so
//     every audit produced two, inflating step one and depressing every rate
//     measured against it.
//
// The chain also had no shared correlation key: `audit_submitted` fires at form
// submit, before an audit row exists, so no property tied it to the steps after
// it. `audit_attempt_id` is minted in the browser and threaded through.

import { NextRequest } from 'next/server'
import { POST as startAudit } from '@/app/api/audit/start/route'
import { POST as unlockAudit } from '@/app/api/audit/unlock/route'

type Captured = { distinctId: string; event: string; properties: Record<string, unknown> }

const captured: Captured[] = []
const calls: string[] = []

jest.mock('@/app/lib/ssrf-guard', () => ({
  assertPublicHttpUrl: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/app/lib/audit-quota', () => ({
  checkAuditQuota: jest.fn().mockResolvedValue({ allowed: true }),
}))

jest.mock('@/app/lib/posthog-server', () => ({
  getPostHogClient: () => ({
    capture: (payload: Captured) => {
      captured.push(payload)
      calls.push(`capture:${payload.event}`)
    },
    flush: jest.fn().mockResolvedValue(undefined),
  }),
  captureServerException: jest.fn(),
}))

const ATTEMPT_ID = 'attempt-abc-123'
const DISTINCT_ID = '019fdbe6-d3d1-7a59-99c4-8a8488a948f7'

const consentHeaders = {
  'Content-Type': 'application/json',
  'x-nebula-analytics-consent': 'all',
  'x-posthog-distinct-id': DISTINCT_ID,
}

function startRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/audit/start', {
    method: 'POST',
    headers: consentHeaders,
    body: JSON.stringify(body),
  })
}

describe('audit funnel correlation', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    captured.length = 0
    calls.length = 0
    process.env.AUDIT_UNLOCK_SECRET = 'test-secret'
  })

  afterEach(() => {
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  describe('POST /api/audit/start', () => {
    let auditRunBody: Record<string, unknown>

    beforeEach(async () => {
      jest.spyOn(global, 'fetch').mockImplementation(async (_url, init) => {
        calls.push('fetch:/audit/accept')
        auditRunBody = JSON.parse(String((init as RequestInit).body))
        return Response.json({ audit_id: 'audit-1', url: 'https://example.com', status: 'pending' })
      })

      await startAudit(
        startRequest({ url: 'https://example.com', audit_attempt_id: ATTEMPT_ID, referrer: 'teardowns' }),
      )
    })

    it('emits exactly one audit_started', () => {
      expect(captured.filter((c) => c.event === 'audit_started')).toHaveLength(1)
    })

    it('emits audit_started after persist so the event carries audit_id and still precedes completion', () => {
      expect(calls).toEqual(['fetch:/audit/accept', 'capture:audit_started'])
    })

    it('stamps the correlation key on audit_started', () => {
      const started = captured.find((c) => c.event === 'audit_started')
      expect(started?.distinctId).toBe(DISTINCT_ID)
      expect(started?.properties.audit_attempt_id).toBe(ATTEMPT_ID)
    })

    it('forwards the correlation key to the audit service for audit_completed/audit_failed', () => {
      expect(auditRunBody.analytics_attempt_id).toBe(ATTEMPT_ID)
      expect(auditRunBody.analytics_distinct_id).toBe(DISTINCT_ID)
    })
  })

  it('does not emit audit_started without analytics consent', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      Response.json({ audit_id: 'audit-1', url: 'https://example.com', status: 'completed' }),
    )

    const request = new NextRequest('http://localhost/api/audit/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com', audit_attempt_id: ATTEMPT_ID }),
    })
    await startAudit(request)

    expect(captured).toHaveLength(0)
  })

  it('stamps the correlation key on audit_results_unlocked', async () => {
    jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce(Response.json({ url: 'https://example.com', score: 7.5, grade: 'B', findings: [] }))
      .mockResolvedValueOnce(Response.json({ success: true }))
      .mockResolvedValueOnce(Response.json({ status: 'sent', message_id: 'msg-1' }))

    const response = await unlockAudit(
      new NextRequest('http://localhost/api/audit/unlock', {
        method: 'POST',
        headers: consentHeaders,
        body: JSON.stringify({ audit_id: 'audit-1', email: 'lead@example.com', audit_attempt_id: ATTEMPT_ID }),
      }),
    )

    expect(response.status).toBe(200)
    const unlocked = captured.find((c) => c.event === 'audit_results_unlocked')
    expect(unlocked?.properties.audit_attempt_id).toBe(ATTEMPT_ID)
    expect(unlocked?.properties.audit_id).toBe('audit-1')
  })
})
