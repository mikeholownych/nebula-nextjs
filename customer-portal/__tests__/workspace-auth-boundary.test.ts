import { NextRequest } from 'next/server'

const fetchMock = jest.fn()
global.fetch = fetchMock as typeof fetch

import { GET as getAudits } from '@/app/api/audits/by-email/route'
import { GET as getTimeline } from '@/app/api/timeline/route'
import { GET as getBilling } from '@/app/api/billing/summary/route'

describe('authenticated workspace boundary', () => {
  beforeEach(() => fetchMock.mockReset())

  it('returns 401 before touching workspace data when no session exists', async () => {
    const response = await getAudits(new NextRequest('http://localhost/api/audits/by-email?email=victim@example.com'))
    expect(response.status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('protects billing summaries before any email lookup or portal-session creation', async () => {
    const response = await getBilling(new NextRequest('http://localhost/api/billing/summary?email=victim@example.com'))
    expect(response.status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('uses authenticated email instead of a forged query-string email', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'u1', email: 'owner@example.com' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ email: 'owner@example.com', audits: [] }), { status: 200 }))

    const response = await getAudits(new NextRequest('http://localhost/api/audits/by-email?email=victim@example.com', {
      headers: { cookie: 'access_token=session-token' },
    }))

    expect(response.status).toBe(200)
    expect(fetchMock.mock.calls[1][0]).toContain('email=owner%40example.com')
    expect(fetchMock.mock.calls[1][0]).not.toContain('victim')
  })

  it('returns a truthful empty timeline when upstream is unavailable', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ id: 'u1', email: 'owner@example.com' }), { status: 200 }))
    fetchMock.mockRejectedValueOnce(new Error('connection refused'))

    const response = await getTimeline(new NextRequest('http://localhost/api/timeline?email=victim@example.com', {
      headers: { cookie: 'access_token=session-token' },
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ email: 'owner@example.com', events: [] })
  })
})
