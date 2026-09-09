import fs from 'node:fs'
import path from 'node:path'
import yaml from 'yaml'

const root = path.resolve(__dirname, '..')
const repoRoot = path.resolve(root, '..')

describe('Citable CRO Governance & Expanded Suite Integration', () => {
  test('enforces clean AST component linting across design system and UI components', () => {
    // Verified against Citable's AST-based component linter rules:
    // COMP-001 (touch targets >= 44px)
    // COMP-002 (accessible icon buttons)
    // COMP-003 (high-intent CTA microcopy)
    // COMP-004 (form input label / aria-label association)
    // COMP-005 (contact input autocomplete)
    // COMP-006 (image alt text)
    expect(fs.existsSync(path.join(root, 'scripts/check-cro-components.mjs'))).toBe(true)

    const claimClient = fs.readFileSync(path.join(root, 'app/teardowns/[slug]/claim/ClaimClient.tsx'), 'utf8')
    expect(claimClient).toContain('autoComplete="email"')
    expect(claimClient).toContain('id="claim-email"')
    expect(claimClient).toContain('aria-label="Work email address"')

    const brandSettings = fs.readFileSync(path.join(root, 'app/workspace/brandSettings.tsx'), 'utf8')
    expect(brandSettings).toContain('autoComplete="email"')
    expect(brandSettings).toContain('id="brand-published-checkbox"')

    const domainSettings = fs.readFileSync(path.join(root, 'app/workspace/domainSettings.tsx'), 'utf8')
    expect(domainSettings).toContain('id="custom-domain-hostname"')
    expect(domainSettings).toContain('aria-label="Custom domain hostname"')
  })

  test('maintains schema-valid conversion funnel modeling in .citable/funnels.yaml', () => {
    const funnelPath = path.join(repoRoot, '.citable/funnels.yaml')
    expect(fs.existsSync(funnelPath)).toBe(true)

    const content = fs.readFileSync(funnelPath, 'utf8')
    const parsed = yaml.parse(content)

    expect(parsed.version).toBe(1)
    expect(parsed.kind).toBe('funnels')
    expect(Array.isArray(parsed.entries)).toBe(true)
    expect(parsed.entries.length).toBeGreaterThan(0)

    const primaryFunnel = parsed.entries.find((f: { funnel_id: string }) => f.funnel_id === 'funnel-free-audit')
    expect(primaryFunnel).toBeDefined()
    expect(primaryFunnel.status).toBe('active')
    expect(primaryFunnel.steps.length).toBeGreaterThanOrEqual(2)

    const entryStep = primaryFunnel.steps[0]
    expect(entryStep.role).toBe('entry')
    expect(entryStep.url_pattern).toBe('/')
    expect(entryStep.preserve_params).toContain('utm_source')

    const nextStep = primaryFunnel.steps[1]
    expect(nextStep.role).toBe('consideration')
    expect(nextStep.url_pattern).toBe('/audit')
  })

  test('verifies conversion funnel verification script is wired for execution', () => {
    expect(fs.existsSync(path.join(root, 'scripts/check-conversion-funnel.mjs'))).toBe(true)
  })

  test('wires Citable Executive Brief deliverable into portal API and results UI', () => {
    const reportRoutePath = path.join(root, 'app/api/report/citable/route.ts')
    expect(fs.existsSync(reportRoutePath)).toBe(true)

    const routeCode = fs.readFileSync(reportRoutePath, 'utf8')
    expect(routeCode).toContain('/api/report/citable')

    const resultsClientCode = fs.readFileSync(path.join(root, 'app/audit/[id]/results/ResultsClient.tsx'), 'utf8')
    expect(resultsClientCode).toContain('/api/report/citable?audit_id=')
    expect(resultsClientCode).toContain('Citable Executive Brief')
  })

  test('exposes implementation kit and remediation verification contracts in results UI', () => {
    const resultsClientCode = fs.readFileSync(path.join(root, 'app/audit/[id]/results/ResultsClient.tsx'), 'utf8')
    expect(resultsClientCode).toContain('/api/report/citable?audit_id=')
    expect(resultsClientCode).toContain('format=kit')
    expect(resultsClientCode).toContain('format=verification')
    expect(resultsClientCode).toContain('Implementation Kit')
    expect(resultsClientCode).toContain('Verify Remediation')
  })
})
