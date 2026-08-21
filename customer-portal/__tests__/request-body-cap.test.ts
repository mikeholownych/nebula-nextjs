/** @jest-environment node */

import { NextRequest } from 'next/server'

const recordFunnelEvent = jest.fn().mockResolvedValue({ success: true, id: 'evt-1' })

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

import { POST as analyticsPost } from '@/app/api/analytics/route'
import { POST as funnelPost } from '@/app/api/analytics/funnel/route'
import { POST as auditStartPost } from '@/app/api/audit/start/route'

const OVERSIZE = 16 * 1024 + 1

function oversizedRequest(url: string, body: Record<string, unknown>) {
  const raw = JSON.stringify({ ...body, pad: 'x'.repeat(OVERSIZE) })
  return new NextRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': String(Buffer.byteLength(raw)),
    },
    body: raw,
  })
}

describe('Next JSON body caps (16KB)', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    recordFunnelEvent.mockClear()
    global.fetch = originalFetch
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('POST /api/analytics returns 413 when Content-Length exceeds 16KB', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch')
    const response = await analyticsPost(
      oversizedRequest('http://localhost/api/analytics', { events: [{ name: 'purchase' }] }),
    )

    expect(response.status).toBe(413)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('POST /api/analytics/funnel returns 413 when Content-Length exceeds 16KB', async () => {
    const response = await funnelPost(
      oversizedRequest('http://localhost/api/analytics/funnel', { eventName: 'landing_page_view', landingPath: '/' }),
    )

    expect(response.status).toBe(413)
    expect(recordFunnelEvent).not.toHaveBeenCalled()
  })

  it('POST /api/audit/start returns 413 when Content-Length exceeds 16KB', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch')
    const response = await auditStartPost(
      oversizedRequest('http://localhost/api/audit/start', { url: 'https://example.com' }),
    )

    expect(response.status).toBe(413)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(recordFunnelEvent).not.toHaveBeenCalled()
  })
})
