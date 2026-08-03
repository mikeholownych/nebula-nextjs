/** @jest-environment node */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/checkout/route'
import { signAuditUnlock } from '@/app/lib/audit-unlock-token'
import fs from 'node:fs'
import path from 'node:path'

const auditId = '123e4567-e89b-12d3-a456-426614174000'

function request(body: unknown, token?: string) {
  return new NextRequest('http://localhost:3000/api/checkout', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { cookie: `audit_unlock_${auditId}=${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/checkout audit binding', () => {
  const originalFetch = global.fetch
  const originalEnv = process.env

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      AUDIT_UNLOCK_SECRET: 'checkout-test-secret',
      NEXT_PUBLIC_URL: 'https://nebulacomponents.com',
      PLATFORM_API_URL: 'http://127.0.0.1:8001',
      STRIPE_SECRET_KEY: 'sk_test_configured',
    }
    global.fetch = jest.fn()
  })

  afterAll(() => {
    global.fetch = originalFetch
    process.env = originalEnv
  })

  it('refuses to create a paid session without a signed eligible audit', async () => {
    const response = await POST(request({ offerKey: 'fix-pack', auditId }))

    expect(response.status).toBe(403)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('refuses checkout before charging when the selected audit cannot be resolved', async () => {
    const token = signAuditUnlock(auditId, 'buyer@example.com')
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response(null, { status: 404 }),
    )

    const response = await POST(request({ offerKey: 'fix-pack', auditId }, token))

    expect(response.status).toBe(404)
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledWith(
      `http://127.0.0.1:8001/audit/${auditId}`,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })

  it('binds Stripe metadata and delivery email to the exact unlocked audit', async () => {
    const token = signAuditUnlock(auditId, 'buyer@example.com')
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(Response.json({
        audit_id: auditId,
        url: 'https://example.com/landing',
        status: 'completed',
      }))
      .mockResolvedValueOnce(Response.json({
        id: 'cs_test_bound',
        url: 'https://checkout.stripe.com/c/pay/cs_test_bound',
      }))

    const response = await POST(request({ offerKey: 'fix-pack', auditId }, token))

    expect(response.status).toBe(200)
    expect(global.fetch).toHaveBeenCalledTimes(2)
    const stripeInit = (global.fetch as jest.Mock).mock.calls[1][1] as RequestInit
    const stripeBody = new URLSearchParams(String(stripeInit.body))
    expect(stripeBody.get('metadata[audit_id]')).toBe(auditId)
    expect(stripeBody.get('customer_email')).toBe('buyer@example.com')
  })

  it('routes the public checkout page through the audit-bound API rather than a static payment link', () => {
    const checkoutPage = fs.readFileSync(
      path.join(process.cwd(), 'app/checkout/page.tsx'),
      'utf8',
    )
    expect(checkoutPage).toContain('CheckoutCTAButton')
    expect(checkoutPage).not.toContain('REPAIR_SPRINT_OFFER.checkoutUrl')
  })
})
