import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('skip-link targets', () => {
  it('gives /brand and /press a #main-content landmark for the sitewide skip link', () => {
    const brand = readFileSync(path.join(process.cwd(), 'app/brand/page.tsx'), 'utf8')
    const press = readFileSync(path.join(process.cwd(), 'app/press/page.tsx'), 'utf8')
    expect(brand).toMatch(/<main id="main-content"/)
    expect(press).toMatch(/<main id="main-content"/)
  })
})
