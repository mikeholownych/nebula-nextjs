import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from '@jest/globals'

const repo = path.resolve(__dirname, '..')
const tailwind = readFileSync(path.join(repo, 'tailwind.config.ts'), 'utf8')
const styles = readFileSync(path.join(repo, 'app/styles.css'), 'utf8')
const design = readFileSync(path.join(repo, 'DESIGN.md'), 'utf8')

describe('brand token regression guard', () => {
  it('does not reintroduce retired chromatic tokens', () => {
    const retired = /#4a7fa5|#34d399|#10b981|#059669|Signal Emerald/gi
    expect(tailwind).not.toMatch(/#4a7fa5|#34d399/gi)
    expect(styles).not.toMatch(/#34d399|#10b981|#059669/gi)
    expect(design).not.toMatch(retired)
  })

  it('keeps the approved information semantic', () => {
    // D11: lightened from #3b82f6 to reach WCAG AAA on every surface.
    expect(tailwind).toContain("info: '#7babff'")
  })
})
