/** @jest-environment node */

import { NextRequest } from 'next/server'
import { readFileSync } from 'node:fs'
import path from 'node:path'

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

const AUDIT_ID = '123e4567-e89b-12d3-a456-426614174000'

function startRequest() {
  return new NextRequest('http://localhost/api/audit/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: 'https://example.com',
      audit_attempt_id: 'attempt-accept-1',
      journey_id: 'journey-accept-1',
    }),
  })
}

describe('POST /api/audit/start fast accept', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    recordFunnelEvent.mockClear()
  })

  it('calls FastAPI /audit/accept and returns pending with audit_id', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({
        audit_id: AUDIT_ID,
        url: 'https://example.com',
        status: 'pending',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    )

    const response = await POST(startRequest())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(String(fetchSpy.mock.calls[0][0])).toContain('/audit/accept')
    expect(body.audit_id).toBe(AUDIT_ID)
    expect(body.status).toBe('pending')
    const init = fetchSpy.mock.calls[0][1] as RequestInit
    expect(String(init.signal)).toBeTruthy()
  })

  it('records audit_started with audit_id after persist so dedup_key can bind', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({
        audit_id: AUDIT_ID,
        url: 'https://example.com',
        status: 'pending',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    )

    await POST(startRequest())

    const started = recordFunnelEvent.mock.calls
      .map((call) => call[0])
      .find((payload: { eventName?: string }) => payload.eventName === 'audit_started')
    expect(started).toEqual(expect.objectContaining({
      eventName: 'audit_started',
      auditId: AUDIT_ID,
    }))
  })

  it('does not wait 120s on the start fetch', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'app/api/audit/start/route.ts'),
      'utf8',
    )
    expect(source).not.toMatch(/timeout\(120000\)/)
    expect(source).toMatch(/\/audit\/accept/)
  })
})
