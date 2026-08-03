/**
 * Tests for workspace auth enforcement across all workspace API routes.
 * Verifies that every protected route independently rejects unauthenticated requests.
 */

import { NextRequest } from 'next/server'

const fetchMock = jest.fn()
global.fetch = fetchMock as typeof fetch

import { GET as getAudits } from '@/app/api/audits/by-email/route'
import { GET as getTimeline } from '@/app/api/timeline/route'
import { GET as getBilling } from '@/app/api/billing/summary/route'
import { GET as getDispatch } from '@/app/api/workspace/dispatch/route'

describe('workspace auth enforcement', () => {
  beforeEach(() => fetchMock.mockReset())

  describe('unauthenticated access blocked', () => {
    it('/api/audits/by-email returns 401 without session', async () => {
      const response = await getAudits(new NextRequest('http://localhost/api/audits/by-email?email=victim@example.com'))
      expect(response.status).toBe(401)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('/api/billing/summary returns 401 without session', async () => {
      const response = await getBilling(new NextRequest('http://localhost/api/billing/summary'))
      expect(response.status).toBe(401)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('/api/workspace/dispatch returns 401 without session', async () => {
      const response = await getDispatch(new NextRequest('http://localhost/api/workspace/dispatch'))
      expect(response.status).toBe(401)
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })

  describe('authenticated user gets own data (not forged email)', () => {
    it('uses authenticated email instead of query-string email', async () => {
      fetchMock
        .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'u1', email: 'owner@example.com' }), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ email: 'owner@example.com', audits: [] }), { status: 200 }))

      const response = await getAudits(new NextRequest('http://localhost/api/audits/by-email?email=victim@example.com', {
        headers: { cookie: 'access_token=session-token' },
      }))

      expect(response.status).toBe(200)
      // Verify the upstream call used the authenticated email, not the forged one
      expect(fetchMock.mock.calls[1][0]).toContain('email=owner%40example.com')
      expect(fetchMock.mock.calls[1][0]).not.toContain('victim')
    })
  })

  describe('auth service failure handling', () => {
    it('returns 503 when platform API is unreachable', async () => {
      fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'))

      const response = await getDispatch(new NextRequest('http://localhost/api/workspace/dispatch', {
        headers: { cookie: 'access_token=valid-token' },
      }))
      expect(response.status).toBe(503)
    })

    it('returns 401 when platform API rejects token', async () => {
      fetchMock.mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }))

      const response = await getAudits(new NextRequest('http://localhost/api/audits/by-email', {
        headers: { cookie: 'access_token=expired-token' },
      }))
      expect(response.status).toBe(401)
    })

    it('returns graceful degradation for timeline when upstream is down', async () => {
      fetchMock
        .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'u1', email: 'owner@example.com' }), { status: 200 }))
        .mockRejectedValueOnce(new Error('connection refused'))

      const response = await getTimeline(new NextRequest('http://localhost/api/timeline', {
        headers: { cookie: 'access_token=session-token' },
      }))

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ email: 'owner@example.com', events: [] })
    })
  })
})
