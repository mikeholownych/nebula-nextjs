/** @jest-environment node */

import { NextRequest } from 'next/server'

const recordFunnelEvent = jest.fn()

jest.mock('@/app/lib/funnel-ledger', () => ({
  recordFunnelEvent: (...args: unknown[]) => recordFunnelEvent(...args),
}))

import { POST } from '@/app/api/analytics/funnel/route'

function funnelRequest(body: unknown, extra?: { raw?: string }) {
  return new NextRequest('http://localhost/api/analytics/funnel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: extra?.raw ?? JSON.stringify(body),
  })
}

describe('POST /api/analytics/funnel ingest allowlist', () => {
  beforeEach(() => {
    recordFunnelEvent.mockReset()
    recordFunnelEvent.mockResolvedValue({ success: true, id: 'evt-1' })
  })

  it('rejects unknown event names with 400 and does not insert', async () => {
    const response = await POST(funnelRequest({ eventName: 'not_a_canonical_event' }))
    expect(response.status).toBe(400)
    expect(recordFunnelEvent).not.toHaveBeenCalled()
  })

  it('rejects purchase_completed with 400 and does not insert', async () => {
    const response = await POST(funnelRequest({
      eventName: 'purchase_completed',
      transactionId: 'tx_1',
    }))
    expect(response.status).toBe(400)
    expect(recordFunnelEvent).not.toHaveBeenCalled()
  })

  it('rejects server-owned events with 400 and does not insert', async () => {
    const response = await POST(funnelRequest({
      eventName: 'audit_started',
      audit_attempt_id: 'attempt-1',
      page_domain: 'example.com',
    }))
    expect(response.status).toBe(400)
    expect(recordFunnelEvent).not.toHaveBeenCalled()
  })

  it('rejects bodies larger than 16 KB with 413 and does not insert', async () => {
    const oversized = JSON.stringify({
      eventName: 'landing_page_view',
      landingPath: `/${'x'.repeat(16 * 1024)}`,
    })
    expect(Buffer.byteLength(oversized)).toBeGreaterThan(16 * 1024)
    const response = await POST(funnelRequest({}, { raw: oversized }))
    expect(response.status).toBe(413)
    expect(recordFunnelEvent).not.toHaveBeenCalled()
  })


  it('accepts a canonical client event', async () => {
    const response = await POST(funnelRequest({
      eventName: 'landing_page_view',
      landingPath: '/audit',
    }))
    expect(response.status).toBe(200)
    expect(recordFunnelEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: 'landing_page_view' }),
    )
  })
})
