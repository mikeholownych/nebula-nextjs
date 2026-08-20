import { NextRequest } from 'next/server'
import { POST } from '@/app/api/audit/compare/route'

describe('Competitor Comparison Audit API', () => {
  it('rejects requests missing urlA or urlB', async () => {
    const req = new NextRequest('http://localhost:3000/api/audit/compare', {
      method: 'POST',
      body: JSON.stringify({ urlA: 'https://example.com' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('Both urlA')
  })

  it('rejects SSRF attempts / non-public URLs', async () => {
    const req = new NextRequest('http://localhost:3000/api/audit/compare', {
      method: 'POST',
      body: JSON.stringify({
        urlA: 'http://127.0.0.1:8000',
        urlB: 'https://example.com',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns valid 9-signal comparison for public URLs', async () => {
    const req = new NextRequest('http://localhost:3000/api/audit/compare', {
      method: 'POST',
      body: JSON.stringify({
        urlA: 'https://mybrand.com/landing',
        urlB: 'https://competitor.com/lander',
        query: 'best conversion audit tool',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()

    expect(json.urlA).toBe('https://mybrand.com/landing')
    expect(json.urlB).toBe('https://competitor.com/lander')
    expect(json.query).toBe('best conversion audit tool')
    expect(typeof json.scoreA).toBe('number')
    expect(typeof json.scoreB).toBe('number')
    expect(Array.isArray(json.comparisons)).toBe(true)
    expect(json.comparisons.length).toBe(9) // all 9 canonical signals
    expect(Array.isArray(json.advantagesA)).toBe(true)
    expect(Array.isArray(json.advantagesB)).toBe(true)
  })
})
