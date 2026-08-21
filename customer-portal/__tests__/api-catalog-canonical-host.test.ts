import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

/**
 * D8 regression guard: every served discovery surface must be anchored at the
 * canonical host. The 2026-08 production QA found three .well-known files
 * (ucp, agent-skills/index.json, openid-configuration) still pointing at the
 * retired nebulacomponents.shop domain after the migration - only api-catalog
 * was guarded until now. This suite sweeps every file actually served under
 * public/.well-known plus the top-level discovery documents.
 */
function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) {
      out.push(...walk(full))
    } else {
      out.push(full)
    }
  }
  return out
}

const wellKnownDir = path.join(process.cwd(), 'public/.well-known')
const wellKnownFiles = walk(wellKnownDir)

describe('discovery surfaces anchor at the canonical host (D8)', () => {
  it.each(
    wellKnownFiles.map((f) => [
      path.relative(process.cwd(), f),
      f,
    ]),
  )('%s contains no retired .shop host', (_name, file) => {
    const body = readFileSync(file, 'utf8')
    expect(body).not.toContain('nebulacomponents.shop')
  })

  it.each([
    'public/openapi.json',
    'public/llms.txt',
  ])('%s contains no retired .shop host', (relative) => {
    const body = readFileSync(path.join(process.cwd(), relative), 'utf8')
    expect(body).not.toContain('nebulacomponents.shop')
  })

  it('keeps the RFC 9727 api-catalog anchored at nebulacomponents.com', () => {
    const catalog = readFileSync(
      path.join(process.cwd(), 'public/.well-known/api-catalog'),
      'utf8',
    )
    expect(catalog).toContain('https://nebulacomponents.com/')
  })

  it('serves at least one discovery document to sweep (guards against silent dir loss)', () => {
    expect(wellKnownFiles.length).toBeGreaterThanOrEqual(8)
  })
})
