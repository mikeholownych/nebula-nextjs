/**
 * Audit quota contract:
 * - free plan = 1/mo, blocked after first
 * - pro/growth/agency = unlimited
 * - unknown/null plan defaults to free
 * - DB unavailable = fail open (don't block audits)
 */
jest.mock('@/app/lib/db', () => ({
  pool: { query: jest.fn() },
}))
import { pool } from '@/app/lib/db'

const mockQuery = pool.query as jest.Mock

describe('checkAuditQuota', () => {
  beforeEach(() => mockQuery.mockReset())

  it('allows a free-tier email that has used 0 audits this month', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })          // no active subscription
      .mockResolvedValueOnce({ rows: [{ cnt: '0' }] })  // 0 audits this month
    const { checkAuditQuota } = await import('@/app/lib/audit-quota')
    const result = await checkAuditQuota('founder@example.com')
    expect(result.allowed).toBe(true)
    expect(result.plan).toBe('free')
    expect(result.quota).toBe(1)
  })

  it('blocks a free-tier email that has already used 1 audit this month', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ cnt: '1' }] })
    const { checkAuditQuota } = await import('@/app/lib/audit-quota')
    const result = await checkAuditQuota('founder@example.com')
    expect(result.allowed).toBe(false)
    expect(result.plan).toBe('free')
    expect(result.reason).toContain('Upgrade to Pro')
    expect(result.resetAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('allows a Pro subscriber regardless of monthly usage (quota=20)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ plan: 'pro' }] })
      .mockResolvedValueOnce({ rows: [{ cnt: '5' }] })  // 5 used this month
    const { checkAuditQuota } = await import('@/app/lib/audit-quota')
    const result = await checkAuditQuota('pro@example.com')
    expect(result.allowed).toBe(true)
    expect(result.plan).toBe('pro')
    expect(result.quota).toBe(20)
  })

  it('blocks a Pro subscriber who has hit their 20/mo limit', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ plan: 'pro' }] })
      .mockResolvedValueOnce({ rows: [{ cnt: '20' }] })
    const { checkAuditQuota } = await import('@/app/lib/audit-quota')
    const result = await checkAuditQuota('pro@example.com')
    expect(result.allowed).toBe(false)
    expect(result.plan).toBe('pro')
    expect(result.reason).toContain('pro plan')
  })

  it('allows Agency and Growth subscribers without a usage check', async () => {
    for (const plan of ['growth', 'agency']) {
      mockQuery.mockReset().mockResolvedValueOnce({ rows: [{ plan }] })
      const { checkAuditQuota } = await import('@/app/lib/audit-quota')
      const r = await checkAuditQuota(`${plan}@example.com`)
      expect(r.allowed).toBe(true)
      expect(r.quota).toBe('unlimited')
      expect(mockQuery).toHaveBeenCalledTimes(1)
    }
  })

  it('fails open when the database is unavailable', async () => {
    mockQuery.mockRejectedValue(new Error('connection refused'))
    const { checkAuditQuota } = await import('@/app/lib/audit-quota')
    const result = await checkAuditQuota('founder@example.com')
    expect(result.allowed).toBe(true)
  })
})
