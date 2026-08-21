import { readFileSync } from 'node:fs'
import path from 'node:path'

function readCustomerPortalFile(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

function readRepoRootFile(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), '..', relativePath), 'utf8')
}

describe('GitHub health-check.yml', () => {
  it('probes .com /api/healthz and does not grep rb2b body "ok"', () => {
    const source = readCustomerPortalFile('.github/workflows/health-check.yml')

    expect(source).not.toMatch(/webhooks\/rb2b/)
    expect(source).not.toMatch(/grep -q ["']ok["']/)
    expect(source).toMatch(/https:\/\/nebulacomponents\.com\/api\/healthz/)
  })
})

describe('root GitHub CI', () => {
  it('contains check:claims and check:analytics-governance', () => {
    const source = readRepoRootFile('.github/workflows/ci.yml')

    expect(source).toMatch(/check:claims/)
    expect(source).toMatch(/check:analytics-governance/)
  })
})

describe('GET /api/build-info', () => {
  it('remains Cache-Control no-store', () => {
    const source = readCustomerPortalFile('app/api/build-info/route.ts')
    expect(source).toMatch(/Cache-Control['"]:\s*['"]no-store/)
  })
})
