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
import { GET as getApiKeys, POST as postApiKeys } from '@/app/api/workspace/api-keys/route'
import { GET as getShareToken } from '@/app/api/audit/[id]/share-token/route'
import { GET as getFixes } from '@/app/api/v1/fixes/route'
import { GET as getFixesById } from '@/app/api/v1/fixes/[auditId]/route'
import { POST as postAuditEmail } from '@/app/api/audit/email/route'
import { POST as postVerify } from '@/app/api/workspace/verify/route'
import { GET as getAudit } from '@/app/api/audit/[id]/route'
import { signAuditUnlock } from '@/app/lib/audit-unlock-token'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const AUDIT_ID = '123e4567-e89b-12d3-a456-426614174000'

describe('workspace auth enforcement', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    process.env.AUDIT_UNLOCK_SECRET = 'test-unlock-secret'
  })

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

    it('/api/workspace/api-keys GET returns 401 without session and does not fetch upstream', async () => {
      const response = await getApiKeys(
        new NextRequest('http://localhost/api/workspace/api-keys?email=victim@example.com'),
      )
      expect(response.status).toBe(401)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('/api/workspace/api-keys POST returns 401 without session and does not fetch upstream', async () => {
      const response = await postApiKeys(
        new NextRequest('http://localhost/api/workspace/api-keys', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email: 'victim@example.com', label: 'agent' }),
        }),
      )
      expect(response.status).toBe(401)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('/api/audit/[id]/share-token returns 401/403 without unlock cookie or session', async () => {
      const response = await getShareToken(
        new NextRequest(`http://localhost/api/audit/${AUDIT_ID}/share-token`),
        { params: Promise.resolve({ id: AUDIT_ID }) },
      )
      expect([401, 403]).toContain(response.status)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('/api/v1/fixes returns 401 without an API key', async () => {
      const response = await getFixes(
        new NextRequest('http://localhost/api/v1/fixes?url=https://example.com'),
      )
      expect(response.status).toBe(401)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('/api/v1/fixes/[auditId] returns 401 without an API key', async () => {
      const response = await getFixesById(
        new NextRequest(`http://localhost/api/v1/fixes/${AUDIT_ID}`),
        { params: Promise.resolve({ auditId: AUDIT_ID }) },
      )
      expect(response.status).toBe(401)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('/api/workspace/verify returns 401 without session', async () => {
      const response = await postVerify(
        new NextRequest('http://localhost/api/workspace/verify', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ recId: 'rec-1' }),
        }),
      )
      expect(response.status).toBe(401)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('/api/audit/email returns 401/403 without unlock cookie or session', async () => {
      const response = await postAuditEmail(
        new NextRequest('http://localhost/api/audit/email', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            auditId: AUDIT_ID,
            url: 'https://example.com',
            email: 'victim@example.com',
            score: 4,
            grade: 'D',
            findings: [],
          }),
        }),
      )
      expect([401, 403]).toContain(response.status)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('GET /api/audit/[id] returns 401 without unlock cookie or session', async () => {
      const response = await getAudit(
        new NextRequest(`http://localhost/api/audit/${AUDIT_ID}`),
        { params: Promise.resolve({ id: AUDIT_ID }) },
      )
      expect(response.status).toBe(401)
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })

  describe('v1/fixes tenant bind', () => {
    const ownerAudit = {
      audit_id: AUDIT_ID,
      url: 'https://example.com',
      status: 'completed',
      score: 7.5,
      grade: 'B',
      findings: [],
      email: 'owner@example.com',
    }

    it('GET /api/v1/fixes/[auditId] returns 200 for the key owner', async () => {
      fetchMock
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ valid: true, workspace_email: 'owner@example.com' }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(ownerAudit), { status: 200 }),
        )

      const response = await getFixesById(
        new NextRequest(`http://localhost/api/v1/fixes/${AUDIT_ID}`, {
          headers: { Authorization: 'Bearer nbk_owner_key' },
        }),
        { params: Promise.resolve({ auditId: AUDIT_ID }) },
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.audit_id).toBe(AUDIT_ID)
    })

    it('GET /api/v1/fixes/[auditId] returns 404 for another tenant audit', async () => {
      fetchMock
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ valid: true, workspace_email: 'other@example.com' }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(ownerAudit), { status: 200 }),
        )

      const response = await getFixesById(
        new NextRequest(`http://localhost/api/v1/fixes/${AUDIT_ID}`, {
          headers: { Authorization: 'Bearer nbk_other_key' },
        }),
        { params: Promise.resolve({ auditId: AUDIT_ID }) },
      )

      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.error).toMatch(/not found/i)
    })

    it('GET /api/v1/fixes?url= does not return another tenant audit', async () => {
      fetchMock
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ valid: true, workspace_email: 'other@example.com' }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ audits: [] }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ audit_id: 'new-pending-id' }), { status: 202 }),
        )

      const response = await getFixes(
        new NextRequest('http://localhost/api/v1/fixes?url=https://example.com', {
          headers: { Authorization: 'Bearer nbk_other_key' },
        }),
      )

      expect(response.status).toBe(202)
      const body = await response.json()
      expect(body.status).toBe('pending')
      expect(body.audit_id).toBe('new-pending-id')
      expect(body.findings).toBeUndefined()
      expect(body.leaks).toBeUndefined()
    })
  })

  describe('audit email owner bind', () => {
    it('loads findings from FastAPI and ignores client-supplied score', async () => {
      const token = signAuditUnlock(AUDIT_ID, 'owner@example.com')
      fetchMock
        .mockResolvedValueOnce(
          new Response(JSON.stringify({
            audit_id: AUDIT_ID,
            url: 'https://stored.example',
            email: 'owner@example.com',
            score: 7.5,
            grade: 'B',
            findings: [{ key: 'cta' }],
          }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ status: 'sent', message_id: 'msg_1' }), { status: 200 }),
        )

      const response = await postAuditEmail(
        new NextRequest('http://localhost/api/audit/email', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            cookie: `audit_unlock_${AUDIT_ID}=${token}`,
          },
          body: JSON.stringify({
            auditId: AUDIT_ID,
            url: 'https://attacker.example',
            email: 'victim@example.com',
            score: 1,
            grade: 'F',
            findings: [{ key: 'forged' }],
          }),
        }),
      )

      expect(response.status).toBe(200)
      const emailCall = fetchMock.mock.calls[1]
      expect(String(emailCall[0])).toContain('/audit/email')
      const sent = JSON.parse(emailCall[1].body as string)
      expect(sent.email).toBe('owner@example.com')
      expect(sent.url).toBe('https://stored.example')
      expect(sent.score).toBe(7.5)
      expect(sent.grade).toBe('B')
      expect(sent.findings).toEqual([{ key: 'cta' }])
    })

    it('returns 403 when a different workspace session tries to email the audit', async () => {
      fetchMock
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: 'u1', email: 'other@example.com' }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({
            audit_id: AUDIT_ID,
            email: 'owner@example.com',
          }), { status: 200 }),
        )

      const response = await postAuditEmail(
        new NextRequest('http://localhost/api/audit/email', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            cookie: 'access_token=session-token',
          },
          body: JSON.stringify({ auditId: AUDIT_ID, email: 'other@example.com' }),
        }),
      )

      expect(response.status).toBe(403)
    })
  })

  describe('GET /api/audit/[id] unlock cookie and owner bind', () => {
    it('returns 200 for a valid HMAC unlock cookie without a workspace session', async () => {
      const token = signAuditUnlock(AUDIT_ID, 'owner@example.com')
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({
          audit_id: AUDIT_ID,
          url: 'https://example.com',
          status: 'completed',
          score: 7.5,
          grade: 'B',
          findings: [],
          email: 'owner@example.com',
        }), { status: 200 }),
      )

      const response = await getAudit(
        new NextRequest(`http://localhost/api/audit/${AUDIT_ID}`, {
          headers: { cookie: `audit_unlock_${AUDIT_ID}=${token}` },
        }),
        { params: Promise.resolve({ id: AUDIT_ID }) },
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.audit_id).toBe(AUDIT_ID)
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(String(fetchMock.mock.calls[0][0])).toContain(`/audit/${AUDIT_ID}`)
    })

    it('returns 404 when a different workspace email is authenticated', async () => {
      fetchMock
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: 'u1', email: 'other@example.com' }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({
            audit_id: AUDIT_ID,
            url: 'https://example.com',
            status: 'completed',
            score: 7.5,
            grade: 'B',
            findings: [],
            email: 'owner@example.com',
          }), { status: 200 }),
        )

      const response = await getAudit(
        new NextRequest(`http://localhost/api/audit/${AUDIT_ID}`, {
          headers: { cookie: 'access_token=session-token' },
        }),
        { params: Promise.resolve({ id: AUDIT_ID }) },
      )

      expect(response.status).toBe(404)
    })
  })

  describe('results page session unlock', () => {
    it('does not treat any logged-in user as the audit owner', () => {
      const src = readFileSync(
        path.join(process.cwd(), 'app/audit/[id]/results/page.tsx'),
        'utf8',
      )
      expect(src).not.toMatch(/if \(user\.email\) sessionUnlocked = true/)
    })

    it('uses audit_unlock_${id} rather than nebula_audit_unlock on the PDF route', () => {
      const src = readFileSync(
        path.join(process.cwd(), 'app/api/audit/[id]/pdf/route.ts'),
        'utf8',
      )
      expect(src).not.toMatch(/nebula_audit_unlock/)
      expect(src).toMatch(/audit_unlock_\$\{/)
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
