/** @jest-environment node */
import { GET } from '@/app/api/referral/summary/[code]/route'

describe('public endpoint integrity containment', () => {
  it('withdraws fabricated referral metrics rather than replacing them', async () => {
    const response = await GET(new Request('https://nebulacomponents.com/api/referral/summary/test'), { params: Promise.resolve({ code: 'test' }) })
    expect(response.status).toBe(410)
    expect(await response.json()).toEqual({ error: 'Endpoint unavailable', code: 'ENDPOINT_RETIRED' })
    expect(response.headers.get('cache-control')).toBe('no-store')
  })
})
