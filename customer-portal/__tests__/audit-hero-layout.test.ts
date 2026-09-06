/** @jest-environment node */

import { readFileSync } from 'node:fs'
import path from 'node:path'

const source = readFileSync(path.join(process.cwd(), 'app/audit/page.tsx'), 'utf8')
const hero = source.slice(source.indexOf('/* ── 1. Hero'), source.indexOf('/* ── 2. Sample output'))

describe('audit hero layout', () => {
  test('keeps benchmark proof inside the form card, not as a third grid item', () => {
    const gridStart = hero.indexOf('className="grid grid-cols-1')
    const formStart = hero.indexOf('id="run-audit"')
    const formEnd = hero.indexOf('\n            </div>', formStart)
    const statsStart = hero.indexOf('Quantity proof')

    expect(gridStart).toBeGreaterThanOrEqual(0)
    expect(formStart).toBeGreaterThan(gridStart)
    expect(statsStart).toBeGreaterThan(formStart)
    expect(statsStart).toBeLessThan(formEnd)
  })
})
