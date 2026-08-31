import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8')

function relLum(hex: string) {
  const h = hex.replace('#', '')
  const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const [r, g, b] = rgb.map(lin)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string) {
  const l1 = relLum(a)
  const l2 = relLum(b)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

describe('design token governance', () => {
  const css = read('app/globals.css')
  const tw = read('tailwind.config.ts')
  const design = read('DESIGN.md')
  const home = `${read('app/page.tsx')}\n${read('app/components/HeroSection.tsx')}`

  it('keeps readable greys at WCAG AA on the near-black field', () => {
    expect(contrast('#e8ebe7', '#050505')).toBeGreaterThanOrEqual(4.5)
    expect(contrast('#a0aaa2', '#050505')).toBeGreaterThanOrEqual(4.5)
    expect(contrast('#a0aaa2', '#111111')).toBeGreaterThanOrEqual(4.5)
    expect(contrast('#9fa99f', '#050505')).toBeGreaterThanOrEqual(4.5)
    expect(contrast('#050505', '#c7ff2f')).toBeGreaterThanOrEqual(4.5)
    expect(contrast('#ffffff', '#c7ff2f')).toBeLessThan(4.5)
  })

  it('locks type floors and lime scarcity in the system sources', () => {
    expect(css).toContain('--text-2xs:  0.75rem')
    expect(css).toContain('--fg-muted:      #a0aaa2')
    expect(css).toContain('--fg-dim:        #9fa99f')
    expect(tw).toContain("muted: '#a0aaa2'")
    expect(tw).toContain("dim: '#9fa99f'")
    expect(design).toContain('12px: instrumentation')
    expect(design).toContain('Lime field/background: at most one major occurrence')
    expect(design).toContain('Do not carry giant editorial headlines')
  })

  it('does not put sub-12px metadata on the homepage hero or body', () => {
    expect(home).not.toContain('text-[10px]')
    expect(home).not.toContain('text-[11px]')
    expect(home).not.toContain('#666666')
  })
})
