/** @jest-environment node */

import { NextRequest } from 'next/server'

const recordFunnelEvent = jest.fn().mockResolvedValue({ success: true })

jest.mock('@/app/lib/funnel-ledger', () => ({
  recordFunnelEvent: (...args: unknown[]) => recordFunnelEvent(...args),
}))

jest.mock('@/app/lib/posthog-server', () => ({
  getPostHogClient: () => ({ capture: jest.fn(), flush: jest.fn().mockResolvedValue(undefined) }),
  captureServerException: jest.fn(),
}))

jest.mock('@/app/lib/ssrf-guard', () => ({
  assertPublicHttpUrl: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/app/lib/audit-quota', () => ({
  checkAuditQuota: jest.fn().mockResolvedValue({ allowed: true }),
}))

import { POST } from '@/app/api/audit/start/route'

function startRequest() {
  return new NextRequest('http://localhost/api/audit/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: 'https://example.com',
      audit_attempt_id: 'attempt-timeout-1',
      journey_id: 'journey-timeout-1',
    }),
  })
}

describe('POST /api/audit/start timeout ledger', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    recordFunnelEvent.mockClear()
  })

  it('records audit_failed with fetch_timeout when the FastAPI fetch is aborted', async () => {
    const timeout = Object.assign(new Error('The operation was aborted due to timeout'), {
      name: 'TimeoutError',
    })
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(timeout)

    const response = await POST(startRequest())

    expect(response.status).toBeGreaterThanOrEqual(500)
    expect(recordFunnelEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'audit_failed',
        failureReason: 'fetch_timeout',
      }),
    )
  })

  it('records audit_failed with network_error when the FastAPI fetch fails to connect', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('ECONNREFUSED'))

    const response = await POST(startRequest())

    expect(response.status).toBeGreaterThanOrEqual(500)
    expect(recordFunnelEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'audit_failed',
        failureReason: 'network_error',
      }),
    )
  })

  it('emits one JSON error line with request_id, journey_id, and revision', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('ECONNREFUSED'))

    const response = await POST(new NextRequest('http://localhost/api/audit/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': 'req-err-1',
      },
      body: JSON.stringify({
        url: 'https://example.com',
        audit_attempt_id: 'attempt-timeout-1',
        journey_id: 'journey-timeout-1',
      }),
    }))

    expect(response.status).toBeGreaterThanOrEqual(500)
    const jsonLine = errSpy.mock.calls
      .map((args) => args[0])
      .find((line) => typeof line === 'string' && line.startsWith('{'))
    expect(jsonLine).toEqual(expect.any(String))
    const parsed = JSON.parse(jsonLine as string)
    expect(parsed.request_id).toBe('req-err-1')
    expect(parsed.journey_id).toBe('journey-timeout-1')
    expect(parsed).toHaveProperty('revision')
    expect(parsed.error).toEqual(expect.objectContaining({
      name: 'Error',
      message: 'ECONNREFUSED',
    }))
    expect(parsed.stack).toBeUndefined()
    expect(jsonLine).not.toMatch(/at Object\.<anonymous>/)
    errSpy.mockRestore()
  })



  it('does not treat FastAPI HTTP 200 status:error as a successful audit', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({
        audit_id: '123e4567-e89b-12d3-a456-426614174000',
        url: 'https://example.com',
        status: 'error',
        error: 'Audit timed out (120s limit)',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    )

    const response = await POST(startRequest())

    expect(response.status).toBeGreaterThanOrEqual(500)
    expect(recordFunnelEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: 'audit_failed' }),
    )
  })
})
