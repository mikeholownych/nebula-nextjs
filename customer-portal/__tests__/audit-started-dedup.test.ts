/** @jest-environment node */

import { recordFunnelEvent } from '@/app/lib/funnel-ledger'
import { pool } from '@/app/lib/db'

jest.mock('@/app/lib/db', () => ({
  pool: { query: jest.fn() },
}))

describe('audit_started dedup once audit_id exists', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(pool.query as jest.Mock).mockResolvedValue({
      rowCount: 1,
      rows: [{ id: 'evt-1' }],
    })
  })

  it('uses audit_{id}_started as the dedup key', async () => {
    await recordFunnelEvent({
      eventName: 'audit_started',
      sourceSystem: 'server_api',
      auditId: '123e4567-e89b-12d3-a456-426614174000',
      auditAttemptId: 'attempt-1',
      properties: { page_domain: 'example.com', audit_attempt_id: 'attempt-1' },
    })

    const params = (pool.query as jest.Mock).mock.calls[0][1] as unknown[]
    expect(params).toContain('audit_123e4567-e89b-12d3-a456-426614174000_started')
  })
})
