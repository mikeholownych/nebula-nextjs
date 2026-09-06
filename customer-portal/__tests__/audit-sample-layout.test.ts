/** @jest-environment node */

import { readFileSync } from 'node:fs'
import path from 'node:path'

const source = readFileSync(path.join(process.cwd(), 'app/audit/page.tsx'), 'utf8')

describe('audit sample findings layout', () => {
  it('gives the finding text the flexible column instead of an empty track', () => {
    expect(source).toContain('md:grid-cols-[minmax(0,220px)_minmax(0,1fr)]')
    expect(source).toContain('min-w-0 text-xs leading-5 text-fg-muted')
    expect(source).not.toContain('md:grid-cols-[140px_60px_1fr]')
  })
})
