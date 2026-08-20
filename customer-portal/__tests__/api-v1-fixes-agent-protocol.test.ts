import { NextRequest } from 'next/server'
import { GET as getFixes } from '@/app/api/v1/fixes/route'
import { GET as getFixById } from '@/app/api/v1/fixes/[auditId]/route'

describe('Direct AI Agent Fix API Protocol (/api/v1/fixes)', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('returns usage documentation when no URL or audit ID is provided', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/fixes')
    const res = await getFixes(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.protocol).toBe('nebula-agent-fix/v1')
    expect(data.usage).toBeDefined()
  })

  it('rejects requests with invalid API keys', async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/workspace/api-keys/validate')) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ valid: false, error: 'Invalid key' }),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    const req = new NextRequest('http://localhost:3000/api/v1/fixes?url=https://example.com', {
      headers: { Authorization: 'Bearer nbk_invalid_key_123' },
    })
    const res = await getFixes(req)
    expect(res.status).toBe(401)

    const data = await res.json()
    expect(data.error).toContain('Invalid or expired')
  })

  it('returns structured agent directives for a target URL', async () => {
    const mockAuditData = {
      audit_id: 'test_audit_456',
      url: 'https://example.com',
      score: 62,
      grade: 'C',
      composite: 62,
      findings: [
        {
          key: 'above_fold_cta_contrast',
          label: 'Primary CTA Contrast Below WCAG Standard',
          impact: 9,
          effort: 2,
          quadrant: 'conversion_urgency',
          issue: 'Low contrast ratio on dark hero background.',
          fix: 'Increase background luminance or use brand neon accent #c7ff2f with dark text #09090b.',
          evidence: {
            selector: '.hero-cta-btn',
            measured: '2.8:1',
            required: '4.5:1',
          },
        },
      ],
    }

    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/audit/run')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockAuditData,
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    const req = new NextRequest('http://localhost:3000/api/v1/fixes?url=https://example.com')
    const res = await getFixes(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.protocol).toBe('nebula-agent-fix/v1')
    expect(data.status).toBe('success')
    expect(data.url).toBe('https://example.com')
    expect(data.overall_score).toBe(62)
    expect(data.leaks).toHaveLength(1)
    expect(data.leaks[0].severity).toBe('CRITICAL')
    expect(data.leaks[0].target_dom_selector).toBe('.hero-cta-btn')
    expect(data.leaks[0].suggested_snippet).toContain('#c7ff2f')
  })

  it('returns markdown formatted directives when format=md is requested', async () => {
    const mockAuditData = {
      audit_id: 'test_audit_789',
      url: 'https://example.com',
      score: 55,
      grade: 'D',
      findings: [
        {
          key: 'mobile_viewport_overflow',
          label: 'Mobile Viewport Overflow and Horizontal Scroll',
          impact: 8,
          effort: 3,
          quadrant: 'technical_stability',
          issue: 'Content exceeds 375px mobile viewport width.',
          fix: 'Add box-sizing border-box and constrain width to 100vw.',
          evidence: { selector: '.main-container' },
        },
      ],
    }

    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/audit/run')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockAuditData,
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    const req = new NextRequest('http://localhost:3000/api/v1/fixes?url=https://example.com&format=md')
    const res = await getFixes(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/markdown')

    const md = await res.text()
    expect(md).toContain('# Nebula Conversion Remediation Directives')
    expect(md).toContain('Target DOM Selector')
    expect(md).toContain('.main-container')
  })

  it('fetches agent fix directives by auditId', async () => {
    const mockAuditData = {
      audit_id: 'audit_abc_xyz',
      url: 'https://mysite.com',
      score: 75,
      grade: 'B',
      findings: [],
    }

    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/audit/audit_abc_xyz')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockAuditData,
        })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })

    const req = new NextRequest('http://localhost:3000/api/v1/fixes/audit_abc_xyz')
    const res = await getFixById(req, { params: Promise.resolve({ auditId: 'audit_abc_xyz' }) })
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.audit_id).toBe('audit_abc_xyz')
    expect(data.url).toBe('https://mysite.com')
  })
})
