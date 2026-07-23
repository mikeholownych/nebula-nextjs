import { parseAuditResult } from '../app/audit/[id]/results/auditResultSchema'

describe('parseAuditResult', () => {
  it('bounds untrusted fields and clamps the response shape', () => {
    const huge = 'x'.repeat(20_000)
    const parsed = parseAuditResult({
      audit_id: huge,
      url: 'https://example.com/path',
      status: huge,
      score: 999,
      grade: huge,
      findings: Array.from({ length: 100 }, (_, index) => ({
        key: `finding-${index}`,
        label: huge,
        impact: 99,
        effort: -5,
        quadrant: huge,
        issue: huge,
        fix: huge,
        evidence: {
          measured: huge,
          required: huge,
          delta: huge,
          selector: huge,
          confidence: 'attacker-controlled',
          timestamp: huge,
        },
      })),
    })

    expect(parsed.findings).toHaveLength(50)
    expect(parsed.score).toBe(10)
    expect(parsed.audit_id).toHaveLength(100)
    expect(parsed.findings[0].issue.length).toBeLessThanOrEqual(1_000)
    expect(parsed.findings[0].evidence?.measured.length).toBeLessThanOrEqual(500)
    expect(parsed.findings[0].evidence?.selector.length).toBeLessThanOrEqual(240)
    expect(parsed.findings[0].evidence?.confidence).toBe('unavailable')
    expect(parsed.findings[0].impact).toBe(10)
    expect(parsed.findings[0].effort).toBe(0)
  })

  it.each(['javascript:alert(1)', 'file:///etc/passwd', 'not a url'])('rejects unsafe or invalid URL %s', (url) => {
    expect(() => parseAuditResult({ url, findings: [] })).toThrow('Invalid audit response')
  })
})
