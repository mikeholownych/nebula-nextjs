/**
 * D11 regression gate: design-token color pairs must meet WCAG 2.2 AAA
 * (>= 7:1 for normal text) against every background they're rendered on.
 *
 * Production QA found ~80 violation nodes on the homepage alone, driven by
 * fg.muted (#7a8078, 4.24-4.92:1). Values are parsed from tailwind.config.ts
 * so this gate cannot drift from the real tokens.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'

function luminance(hex: string): number {
  const c = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(c.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function ratio(fgHex: string, bgHex: string): number {
  const [l1, l2] = [luminance(fgHex), luminance(bgHex)].sort((a, b) => b - a)
  return (l1 + 0.05) / (l2 + 0.05)
}

const configSource = readFileSync(
  path.join(process.cwd(), 'tailwind.config.ts'),
  'utf8',
)

function requireMatch(re: RegExp, label: string): string {
  const m = configSource.match(re)
  if (!m) throw new Error(`token ${label} not found in tailwind.config.ts`)
  return m[1].toLowerCase()
}

const backgrounds = {
  bg: requireMatch(/bg:\s*\{\s*\n\s*DEFAULT:\s*'(#[0-9a-fA-F]{6})'/, 'bg.DEFAULT'),
  panel: '#131615',
  surface: '#191c1a',
}

const foregrounds: Record<string, string> = {
  'fg.DEFAULT': requireMatch(/fg:\s*\{\s*\n\s*DEFAULT:\s*'(#[0-9a-fA-F]{6})'/, 'fg.DEFAULT'),
  'fg.muted': requireMatch(/fg:\s*\{[\s\S]*?muted:\s*'(#[0-9a-fA-F]{6})'/, 'fg.muted'),
  'fg.dim': requireMatch(/dim:\s*'(#[0-9a-fA-F]{6})'/, 'fg.dim'),
  danger: requireMatch(/danger:\s*\{\s*\n\s*DEFAULT:\s*'(#[0-9a-fA-F]{6})'/, 'danger'),
  info: requireMatch(/\n\s*info:\s*'(#[0-9a-fA-F]{6})'/, 'info'),
  accent: requireMatch(/const ACCENT\s*=\s*'(#[0-9a-fA-F]{6})'/i, 'ACCENT'),
}

describe('WCAG 2.2 AAA token contrast gate (D11)', () => {
  it.each(Object.entries(foregrounds))(
    '%s meets >= 7:1 on every background surface',
    (name, fg) => {
      for (const [bgName, bg] of Object.entries(backgrounds)) {
        const r = ratio(fg, bg)
        if (!(r >= 7)) {
          throw new Error(
            `${name} (${fg}) on ${bgName} (${bg}) is ${r.toFixed(2)}:1 - AAA requires >= 7:1`,
          )
        }
        expect(r).toBeGreaterThanOrEqual(7)
      }
    },
  )

  it('uses the D11 remediated muted token (no silent revert)', () => {
    expect(foregrounds['fg.muted']).toBe('#a0aaa2')
  })
})
