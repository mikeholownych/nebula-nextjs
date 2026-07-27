import { readFileSync } from 'fs'
import path from 'path'

const source = (relative: string) => readFileSync(path.join(process.cwd(), relative), 'utf8')

describe('audit route content ownership', () => {
  it('keeps page-specific supporting copy out of the shared audit layout', () => {
    const layout = source('app/audit/layout.tsx')
    const page = source('app/audit/page.tsx')

    expect(layout).not.toContain('What the audit checks')
    expect(layout).not.toContain('How it works')
    expect(page).toContain('What the audit checks')
    expect(page).toContain('How It Works')
  })
})
