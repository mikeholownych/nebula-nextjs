/** @jest-environment node */
/**
 * D10 regression guard: every protected route family returns the SAME JSON
 * error envelope on 401 - `{ error: string, code: string }`. Production QA
 * found four divergent shapes ({code}, {error,code}, {error,hint}, {error}).
 * `hint` remains allowed as an additive field for developer-facing APIs.
 */
import { NextRequest } from 'next/server'

import { GET as getAuditsByEmail } from '@/app/api/audits/by-email/route'
import { GET as getBilling } from '@/app/api/billing/summary/route'
import { GET as getTimeline } from '@/app/api/timeline/route'
import { POST as postEmailProcess } from '@/app/api/email/process/route'
import { POST as postRb2b } from '@/app/api/webhooks/rb2b/route'
import { GET as getV1Fixes } from '@/app/api/v1/fixes/route'
import { GET as getV1FixByAudit } from '@/app/api/v1/fixes/[auditId]/route'

function jsonRequest(url: string, init: RequestInit = {}): NextRequest {
  const headers = new Headers(init.headers)
  headers.set('content-type', 'application/json')
  return new NextRequest(`http://localhost:3000${url}`, {
    method: init.method,
    body: init.body,
    headers,
  })
}

async function expectEnvelope(
  response: Response,
  expectedCode = 'AUTH_REQUIRED',
): Promise<void> {
  expect(response.status).toBe(401)
  const body = await response.json()
  expect(typeof body.error).toBe('string')
  expect(body.error.length).toBeGreaterThan(0)
  expect(body.code).toBe(expectedCode)
}

describe('401 error envelope contract (D10)', () => {
  const originalEnv = process.env
  const originalFetch = global.fetch

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.INTERNAL_API_SECRET
    delete process.env.RB2B_WEBHOOK_SECRET
    // Any route that touched the network despite the gate would fail loudly.
    global.fetch = jest.fn().mockRejectedValue(new Error('network must not be reached pre-auth'))
  })

  afterAll(() => {
    process.env = originalEnv
    global.fetch = originalFetch
  })

  it('workspace audits-by-email returns the shared envelope', async () => {
    await expectEnvelope(await getAuditsByEmail(jsonRequest('/api/audits/by-email?email=victim@example.com')))
  })

  it('workspace billing summary returns the shared envelope', async () => {
    await expectEnvelope(await getBilling(jsonRequest('/api/billing/summary?email=victim@example.com')))
  })

  it('workspace timeline returns the shared envelope', async () => {
    await expectEnvelope(await getTimeline(jsonRequest('/api/timeline?email=victim@example.com')))
  })

  it('internal email processing returns the shared envelope', async () => {
    await expectEnvelope(
      await postEmailProcess(jsonRequest('/api/email/process', { method: 'POST' })),
    )
  })

  it('rb2b webhook keeps its specific signature code inside the shared envelope', async () => {
    await expectEnvelope(
      await postRb2b(jsonRequest('/api/webhooks/rb2b', { method: 'POST' })),
      'INVALID_RB2B_SIGNATURE',
    )
  })

  it('v1 fixes list keeps its hint and gains the shared code', async () => {
    const response = await getV1Fixes(jsonRequest('/api/v1/fixes?url=https://example.com'))
    expect(response.status).toBe(401)
    const body = await response.json()
    expect(typeof body.error).toBe('string')
    expect(body.code).toBe('AUTH_REQUIRED')
    expect(typeof body.hint).toBe('string')
  })

  it('v1 fix-by-audit keeps its hint and gains the shared code', async () => {
    const response = await getV1FixByAudit(
      jsonRequest('/api/v1/fixes/123e4567-e89b-12d3-a456-426614174000'),
      { params: Promise.resolve({ auditId: '123e4567-e89b-12d3-a456-426614174000' }) },
    )
    expect(response.status).toBe(401)
    const body = await response.json()
    expect(typeof body.error).toBe('string')
    expect(body.code).toBe('AUTH_REQUIRED')
    expect(typeof body.hint).toBe('string')
  })
})
