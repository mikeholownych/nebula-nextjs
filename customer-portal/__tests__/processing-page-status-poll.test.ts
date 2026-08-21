/** @jest-environment node */

import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('audit processing page', () => {
  const source = readFileSync(
    path.join(process.cwd(), 'app/audit/[id]/processing/page.tsx'),
    'utf8',
  )

  it('polls real audit status instead of a fake-only timer', () => {
    expect(source).toMatch(/\/api\/audit\/\$\{auditId\}\/status/)
    expect(source).toMatch(/completed/)
    expect(source).toMatch(/failed/)
  })

  it('does not mark ready solely from the progress interval hitting 100', () => {
    expect(source).not.toMatch(/setStatus\('ready'\)[\s\S]{0,80}return 100/)
  })
})
