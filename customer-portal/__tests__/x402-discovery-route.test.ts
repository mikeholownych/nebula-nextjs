/** @jest-environment node */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/v1/route'
import { POST as auditRunPost } from '@/app/api/audit/run/route'
import { FACILITATOR_URL, NETWORK } from '@/lib/x402'

const decodeChallenge = (response: Response) => {
  const header = response.headers.get('payment-required')
  expect(header).toBeTruthy()
  return JSON.parse(Buffer.from(header!, 'base64').toString('utf8'))
}

const expectBazaarSchemas = (challenge: Record<string, any>) => {
  const schema = challenge.extensions?.bazaar?.schema
  expect(schema?.properties?.input).toEqual(expect.any(Object))
  expect(schema?.properties?.output).toEqual(expect.any(Object))
}

describe('GET /api/v1 x402 discovery route', () => {
  it('returns a valid x402 payment challenge for the public audit resource', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1')

    const response = await GET(request)

    expect(response.status).toBe(402)
    expect(response.headers.get('content-type')).toContain('application/json')

    const challenge = decodeChallenge(response)

    expect(challenge.x402Version).toBe(2)
    expect(challenge.resource.url).toBe('https://nebulacomponents.shop/api/v1')
    expect(NETWORK).toBe('eip155:8453')
    expect(FACILITATOR_URL).toBe('https://facilitator.payai.network')
    expect(challenge.accepts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          scheme: 'exact',
          network: 'eip155:8453',
          amount: '100000',
          asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          payTo: '0x03ce3d56E497ECCFE7Fe1a7f666b9e2307541202',
        }),
      ]),
    )
    expectBazaarSchemas(challenge)
  })

  it('publishes body input and output schemas on POST /api/audit/run', async () => {
    const response = await auditRunPost(
      new NextRequest('http://localhost:3000/api/audit/run', {
        method: 'POST',
      }),
    )

    expect(response.status).toBe(402)
    expectBazaarSchemas(decodeChallenge(response))
  })
})
