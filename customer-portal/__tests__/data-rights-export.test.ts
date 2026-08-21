/** @jest-environment node */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/data-rights/export/route'
import { signAuditUnlock } from '@/app/lib/audit-unlock-token'

const AUDIT_ID = '00000000-0000-4000-8000-000000000001'

describe('GET /api/data-rights/export', () => {
  beforeEach(() => {
    process.env.AUDIT_UNLOCK_SECRET = 'test-unlock-secret'
  })

  it('returns 401 before mentioning auditId when unauthenticated', async () => {
    const req = new NextRequest('http://localhost:3000/api/data-rights/export')
    const res = await GET(req)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toMatch(/Authentication required/i)
    expect(json.error).not.toMatch(/auditId/i)
  })

  it('returns 401 when auditId is present but there is no unlock cookie or session', async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/data-rights/export?auditId=${AUDIT_ID}`,
    )
    const res = await GET(req)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toMatch(/Authentication required/i)
  })

  it('returns the portable evidence package when a valid unlock cookie is present', async () => {
    const token = signAuditUnlock(AUDIT_ID, 'owner@example.com')
    const req = new NextRequest(
      `http://localhost:3000/api/data-rights/export?auditId=${AUDIT_ID}`,
      { headers: { cookie: `audit_unlock_${AUDIT_ID}=${token}` } },
    )
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/json')
    const data = await res.json()
    expect(data.metadata.auditId).toBe(AUDIT_ID)
    expect(data.metadata.unlocked).toBe(true)
    expect(data.metadata.portabilityContract).toContain('Nebula Zero Hostage-Taking')
    expect(Array.isArray(data.evidenceAtoms)).toBe(true)
  })
})
