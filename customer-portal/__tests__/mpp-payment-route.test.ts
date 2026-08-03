/** @jest-environment node */

import { NextRequest } from 'next/server'

jest.mock('mppx/nextjs', () => ({
  tempo: { charge: jest.fn((config) => config) },
  Mppx: {
    create: jest.fn(() => ({
      charge: jest.fn(() => () => async () =>
        new Response(null, {
          status: 402,
          headers: {
            'WWW-Authenticate': 'Payment test-challenge',
          },
        })),
    })),
  },
}))

describe('GET /api/mpp/audit', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = {
      ...originalEnv,
      MPP_SECRET_KEY: 'mpp-test-secret-key-with-at-least-32-bytes',
    }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('returns a native MPP challenge before running an audit', async () => {
    const { GET } = await import('@/app/api/mpp/audit/route')
    const request = new NextRequest(
      'https://nebulacomponents.com/api/mpp/audit?url=https%3A%2F%2Fexample.com',
    )

    const response = await GET(request)

    expect(response.status).toBe(402)
    expect(response.headers.get('www-authenticate')).toMatch(/^Payment /)
    expect(response.headers.get('payment-required')).toBeNull()
  })
})
