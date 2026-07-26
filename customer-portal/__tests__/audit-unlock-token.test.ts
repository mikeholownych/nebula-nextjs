/** @jest-environment node */

import {
  readAuditUnlock,
  signAuditUnlock,
  verifyAuditUnlock,
} from '@/app/lib/audit-unlock-token'

describe('audit unlock token signing', () => {
  beforeEach(() => {
    process.env.AUDIT_UNLOCK_SECRET = 'test-secret'
  })

  it('verifies a token signed for the same audit_id', () => {
    const token = signAuditUnlock('audit-123', 'lead@example.com')
    expect(verifyAuditUnlock('audit-123', token)).toBe(true)
    expect(readAuditUnlock('audit-123', token)).toEqual({
      email: 'lead@example.com',
    })
  })

  it('rejects a token presented for a different audit_id', () => {
    const token = signAuditUnlock('audit-123', 'lead@example.com')
    expect(verifyAuditUnlock('audit-999', token)).toBe(false)
  })

  it('rejects a hand-crafted unsigned token (the old base64-only format)', () => {
    const forged = Buffer.from('audit-123:attacker@example.com').toString('base64url')
    expect(verifyAuditUnlock('audit-123', forged)).toBe(false)
  })

  it('rejects a token signed with a different secret', () => {
    const token = signAuditUnlock('audit-123', 'lead@example.com')
    process.env.AUDIT_UNLOCK_SECRET = 'a-different-secret'
    expect(verifyAuditUnlock('audit-123', token)).toBe(false)
  })

  it('rejects missing tokens', () => {
    expect(verifyAuditUnlock('audit-123', undefined)).toBe(false)
    expect(readAuditUnlock('audit-123', undefined)).toBeNull()
  })
})
