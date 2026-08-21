import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

function repoRoot(): string {
  return path.join(process.cwd(), '..')
}

function listFiles(dir: string, suffix: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...listFiles(full, suffix))
    else if (entry.name.endsWith(suffix)) out.push(full)
  }
  return out
}

describe('PLATFORM_API_URL default', () => {
  it('does not default portal BFF calls to :8769', () => {
    const files = [
      'app/api/workspace/dispatch/route.ts',
      'app/api/workspace/verify/route.ts',
      'app/lib/workspace-auth.ts',
      'app/lib/audit-quota.ts',
      'app/api/audit/start/route.ts',
      'app/api/webhooks/stripe/route.ts',
      'app/api/webhooks/stripe/fulfillment.ts',
      'app/lib/email-service.ts',
      'README.md',
    ]
    for (const relativePath of files) {
      const source = readRepoFile(relativePath)
      expect(source).not.toMatch(/127\.0\.0\.1:8769|localhost:8769/)
    }
  })

  it('uses a single http://127.0.0.1:8001 default in quota and start', () => {
    expect(readRepoFile('app/lib/audit-quota.ts')).toMatch(/127\.0\.0\.1:8001/)
    expect(readRepoFile('app/api/audit/start/route.ts')).toMatch(/127\.0\.0\.1:8001/)
  })

  it('listens on 127.0.0.1:8001 and does not leave :8769 in scripts', () => {
    const startApi = readFileSync(path.join(repoRoot(), 'scripts/start_api.sh'), 'utf8')
    expect(startApi).toMatch(/--host\s+127\.0\.0\.1/)
    expect(startApi).toMatch(/--port\s+8001/)
    expect(startApi).not.toMatch(/8769/)

    for (const scriptPath of listFiles(path.join(repoRoot(), 'scripts'), '.sh')) {
      const source = readFileSync(scriptPath, 'utf8')
      expect(source).not.toMatch(/:8769\b|--port\s+8769\b/)
    }
  })

  it('does not construct a second pg Pool in email-service', () => {
    const source = readRepoFile('app/lib/email-service.ts')
    expect(source).not.toMatch(/new Pool\s*\(/)
    expect(source).toMatch(/from ['"]@\/app\/lib\/db['"]/)
  })
})
