import { GET } from '@/app/api/data-rights/export/route'

describe('GET /api/data-rights/export', () => {
  it('returns 400 when auditId query parameter is missing', async () => {
    const req = new Request('http://localhost:3000/api/data-rights/export')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('Missing required query parameter')
  })

  it('returns structured portable evidence package when auditId is provided', async () => {
    const req = new Request('http://localhost:3000/api/data-rights/export?auditId=00000000-0000-4000-8000-000000000001')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/json')
    const data = await res.json()
    expect(data.metadata.auditId).toBe('00000000-0000-4000-8000-000000000001')
    expect(data.metadata.portabilityContract).toContain('Nebula Zero Hostage-Taking')
    expect(Array.isArray(data.evidenceAtoms)).toBe(true)
  })
})
