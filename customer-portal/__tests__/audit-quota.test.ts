/**
 * Audit quota contract:
 * - free plan = 1/mo, blocked after first
 * - pro/growth/agency = unlimited
 * - unknown/null plan defaults to free
 * - completed-audit count comes from nebula_audit via FastAPI
 * - never counts platform `audits` rows
 * - DB / FastAPI unavailable = fail open (don't block audits)
 */
jest.mock('@/app/lib/db', () => ({
  pool: { query: jest.fn() },
}))
import { pool } from '@/app/lib/db'

const mockQuery = pool.query as jest.Mock

function mockQuotaCount(completedThisMonth: number) {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce(
    Response.json({ completed_this_month: completedThisMonth }),
  )
}

describe('checkAuditQuota', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    mockQuery.mockReset()
    global.fetch = jest.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('allows a free-tier email that has used 0 audits this month', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })
    mockQuotaCount(0)
    const { checkAuditQuota } = await import('@/app/lib/audit-quota')
    const result = await checkAuditQuota('founder@example.com')
    expect(result.allowed).toBe(true)
    expect(result.plan).toBe('free')
    expect(result.quota).toBe(1)
  })

  it('blocks a free-tier email that has already used 1 audit this month', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })
    mockQuotaCount(1)
    const { checkAuditQuota } = await import('@/app/lib/audit-quota')
    const result = await checkAuditQuota('founder@example.com')
    expect(result.allowed).toBe(false)
    expect(result.plan).toBe('free')
    expect(result.reason).toContain('Upgrade to Pro')
    expect(result.resetAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('counts completed audits via FastAPI, not platform audits rows', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })
    mockQuotaCount(1)
    const { checkAuditQuota } = await import('@/app/lib/audit-quota')
    await checkAuditQuota('founder@example.com')

    for (const call of mockQuery.mock.calls) {
      expect(String(call[0])).not.toMatch(/FROM\s+audits/i)
    }
    expect(global.fetch).toHaveBeenCalledTimes(1)
    const [url] = (global.fetch as jest.Mock).mock.calls[0]
    expect(String(url)).toContain('/audit/quota')
    expect(String(url)).toContain('founder%40example.com')
  })

  it('allows a Pro subscriber regardless of monthly usage (quota=20)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ plan: 'pro' }] })
    mockQuotaCount(5)
    const { checkAuditQuota } = await import('@/app/lib/audit-quota')
    const result = await checkAuditQuota('pro@example.com')
    expect(result.allowed).toBe(true)
    expect(result.plan).toBe('pro')
    expect(result.quota).toBe(20)
  })

  it('blocks a Pro subscriber who has hit their 20/mo limit', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ plan: 'pro' }] })
    mockQuotaCount(20)
    const { checkAuditQuota } = await import('@/app/lib/audit-quota')
    const result = await checkAuditQuota('pro@example.com')
    expect(result.allowed).toBe(false)
    expect(result.plan).toBe('pro')
    expect(result.reason).toContain('pro plan')
  })

  it('allows Agency and Growth subscribers without a usage check', async () => {
    for (const plan of ['growth', 'agency']) {
      mockQuery.mockReset().mockResolvedValueOnce({ rows: [{ plan }] })
      ;(global.fetch as jest.Mock).mockReset()
      const { checkAuditQuota } = await import('@/app/lib/audit-quota')
      const r = await checkAuditQuota(`${plan}@example.com`)
      expect(r.allowed).toBe(true)
      expect(r.quota).toBe('unlimited')
      expect(mockQuery).toHaveBeenCalledTimes(1)
      expect(global.fetch).not.toHaveBeenCalled()
    }
  })

  it('fails open when the database is unavailable', async () => {
    mockQuery.mockRejectedValue(new Error('connection refused'))
    const { checkAuditQuota } = await import('@/app/lib/audit-quota')
    const result = await checkAuditQuota('founder@example.com')
    expect(result.allowed).toBe(true)
  })

  it('fails open when FastAPI quota lookup is unavailable', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('ECONNREFUSED'))
    const { checkAuditQuota } = await import('@/app/lib/audit-quota')
    const result = await checkAuditQuota('founder@example.com')
    expect(result.allowed).toBe(true)
  })
})
