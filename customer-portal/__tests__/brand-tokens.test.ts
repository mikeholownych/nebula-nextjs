import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const tailwind = readFileSync(new URL('../tailwind.config.ts', import.meta.url), 'utf8')
const styles = readFileSync(new URL('../app/styles.css', import.meta.url), 'utf8')
const design = readFileSync(new URL('../DESIGN.md', import.meta.url), 'utf8')

describe('brand token regression guard', () => {
  it('does not reintroduce retired chromatic tokens', () => {
    const retired = /#4a7fa5|#34d399|#10b981|#059669|Signal Emerald/gi
    expect(tailwind).not.toMatch(/#4a7fa5|#34d399/gi)
    expect(styles).not.toMatch(/#34d399|#10b981|#059669/gi)
    expect(design).not.toMatch(retired)
  })

  it('keeps the approved information semantic', () => {
    expect(tailwind).toContain("info: '#3b82f6'")
  })
})
