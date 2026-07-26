/** @jest-environment node */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/audit/unlock/route'

const flush = jest.fn().mockResolvedValue(undefined)

jest.mock('@/app/lib/posthog-server', () => ({
  getPostHogClient: () => ({
    identify: jest.fn(),
    capture: jest.fn(),
    flush,
  }),
}))

const audit = {
  url: 'https://example.com',
  score: 7.5,
  grade: 'B',
  findings: [],
}

function request() {
  return new NextRequest('http://localhost:3000/api/audit/unlock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audit_id: 'audit-123',
      email: 'lead@example.com',
      name: 'Lead',
    }),
  })
}

describe('POST /api/audit/unlock delivery truthfulness', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    process.env.AUDIT_UNLOCK_SECRET = 'test-secret'
  })

  it('unlocks but reports email_sent=false when delivery is unconfirmed', async () => {
    jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce(Response.json(audit))
      .mockResolvedValueOnce(Response.json({ status: 'failed', error: 'release_blocked' }))

    const response = await POST(request())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status).toBe('unlocked')
    expect(body.email_sent).toBe(false)
  })

  it('reports email_sent=true only with explicit sent status and receipt', async () => {
    jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce(Response.json(audit))
      .mockResolvedValueOnce(Response.json({ status: 'sent', message_id: 'msg-123' }))

    const response = await POST(request())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.email_sent).toBe(true)
  })

  it('makes the signed audit identity available to checkout', async () => {
    jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce(Response.json(audit))
      .mockResolvedValueOnce(Response.json({ status: 'sent', message_id: 'msg-123' }))

    const response = await POST(request())
    const cookie = response.cookies.get('audit_unlock_audit-123')

    expect(cookie?.httpOnly).toBe(true)
    expect(cookie?.path).toBe('/')
    expect(cookie?.value).toBeTruthy()
  })
})
