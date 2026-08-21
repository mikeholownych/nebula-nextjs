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

function startRequest(headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/audit/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({
      url: 'https://example.com',
      email: 'founder@example.com',
      audit_attempt_id: 'attempt-forward-1',
      journey_id: 'journey-forward-1',
    }),
  })
}

describe('POST /api/audit/start forwards visitor identity to FastAPI', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    recordFunnelEvent.mockClear()
  })

  it('forwards X-Request-ID and visitor X-Forwarded-For on /audit/accept', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({
        audit_id: '123e4567-e89b-12d3-a456-426614174000',
        url: 'https://example.com',
        status: 'completed',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    )

    const response = await POST(startRequest({
      'x-request-id': 'req-visitor-1',
      'x-forwarded-for': '203.0.113.10, 10.0.0.1',
    }))

    expect(response.status).toBe(200)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0]
    expect(String(url)).toContain('/audit/accept')
    const headers = new Headers(init?.headers)
    expect(headers.get('x-request-id')).toBe('req-visitor-1')
    expect(headers.get('x-forwarded-for')).toContain('203.0.113.10')
    expect(headers.get('x-forwarded-for')).not.toBe('127.0.0.1')
  })

  it('mints X-Request-ID when the incoming request has none', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({
        audit_id: '123e4567-e89b-12d3-a456-426614174000',
        url: 'https://example.com',
        status: 'completed',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    )

    await POST(startRequest())

    const headers = new Headers(fetchSpy.mock.calls[0][1]?.headers)
    expect(headers.get('x-request-id')).toEqual(expect.stringMatching(/\S+/))
  })

  it('includes request_id in funnel-ledger properties when the request has one', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({
        audit_id: '123e4567-e89b-12d3-a456-426614174000',
        url: 'https://example.com',
        status: 'completed',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    )

    await POST(startRequest({
      'x-request-id': 'req-visitor-1',
    }))

    expect(recordFunnelEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'audit_accepted',
        properties: expect.objectContaining({ request_id: 'req-visitor-1' }),
      }),
    )
  })
})

