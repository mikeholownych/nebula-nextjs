/** @jest-environment node */
import fs from 'node:fs'
import path from 'node:path'
const routes = [{"file": "app/api/referral/[code]/route.ts", "methods": ["GET", "POST"]}, {"file": "app/api/referral/route.ts", "methods": ["GET", "POST"]}, {"file": "app/api/referral/summary/[code]/route.ts", "methods": ["GET"]}, {"file": "app/api/referral/validate/[code]/route.ts", "methods": ["GET"]}, {"file": "app/api/benchmarks/compare/route.ts", "methods": ["POST"]}, {"file": "app/api/benchmarks/industries/[industry]/route.ts", "methods": ["GET"]}, {"file": "app/api/benchmarks/industries/route.ts", "methods": ["GET"]}, {"file": "app/api/benchmarks/summary/route.ts", "methods": ["GET"]}, {"file": "app/api/share/audit/[auditId]/route.ts", "methods": ["GET"]}, {"file": "app/api/share/iframe/[auditId]/route.ts", "methods": ["GET"]}, {"file": "app/api/share/widget/[auditId]/route.ts", "methods": ["GET"]}, {"file": "app/api/shared/route.ts", "methods": ["GET"]}, {"file": "app/api/whitelabel/route.ts", "methods": ["POST"]}]

describe('retired endpoint dependency isolation', () => {
  it.each(routes)('$file cannot import database or legacy business handlers', ({ file }) => {
    const source = fs.readFileSync(path.join(process.cwd(), file), 'utf8')
    expect(source).not.toMatch(/audit-db|referral-program|lib\/whitelabel|await createReferralTables|PLATFORM_API_URL/)
    expect(source).toContain('retiredPublicEndpoint')
  })
})
