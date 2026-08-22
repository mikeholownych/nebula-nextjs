import { readFileSync } from 'node:fs'
import path from 'node:path'

function readCustomerPortalFile(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

function readRepoRootFile(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), '..', relativePath), 'utf8')
}

describe('GitHub production-smoke.yml (single source of truth)', () => {
  it('probes .com /api/healthz and does not grep rb2b body "ok"', () => {
    // TD-14: the dead customer-portal/.github copy was removed; the root
    // workflow is now the sole owner of this invariant.
    const source = readRepoRootFile('.github/workflows/production-smoke.yml')

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

describe('deploy_customer_portal.sh', () => {
  const source = readRepoRootFile('scripts/deploy_customer_portal.sh')
  const uncommented = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('#'))
    .join('\n')

  it('builds into an alternate distDir so a live next-server never reads a half-written .next', () => {
    expect(uncommented).toMatch(/NEXT_DIST_DIR=/)
    expect(uncommented).toMatch(/\.next-incoming/)
    const nextConfig = readCustomerPortalFile('next.config.ts')
    expect(nextConfig).toMatch(/distDir:\s*process\.env\.NEXT_DIST_DIR/)
  })

  it('stamps FastAPI NEBULA_BUILD_REVISION to the same SHA that Next just built', () => {
    expect(uncommented).toMatch(/NEBULA_BUILD_REVISION=/)
    expect(uncommented).toMatch(/nebula-platform-api\.service/)
    expect(uncommented).toMatch(/revision\.conf/)
  })
})
