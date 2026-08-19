import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from '@jest/globals'
import { brand, BRAND_VERSION } from '../app/lib/brand'

const repo = path.resolve(__dirname, '..')

function walk(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry === 'coverage' || entry === 'archive') continue
    const full = path.join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}

describe('canonical brand projections', () => {
  it('is brand version 2', () => {
    expect(BRAND_VERSION).toBe(2)
    expect(brand.colors.accent).toBe('#c7ff2f')
    expect(brand.metadata.themeColor).toBe('#080909')
  })

  it('ships every registered current asset', () => {
    const missing = Object.entries(brand.assets)
      .filter(([, rel]) => {
        const fileRel = String(rel).split('?')[0]
        if (fileRel === '/opengraph-image') return false
        return !existsSync(path.join(repo, 'public', fileRel.replace(/^\//, '')))
      })
      .map(([key, rel]) => `${key}:${rel}`)
    expect(missing).toEqual([])
  })

  it('wires layout, schema, and manifest to the registry', () => {
    const layout = readFileSync(path.join(repo, 'app/layout.tsx'), 'utf8')
    const schema = readFileSync(path.join(repo, 'app/lib/schema.ts'), 'utf8')
    const manifest = readFileSync(path.join(repo, 'app/manifest.ts'), 'utf8')
    expect(layout).toMatch(/from ['\"]@\/app\/lib\/brand['\"]|from ['\"]\.\/lib\/brand['\"]/)
    expect(layout).toContain('brand.assets.faviconSvg')
    expect(layout).toContain('brand.assets.appleTouchIcon')
    expect(layout).toContain('brand.assets.ogDefault')
    expect(layout).toContain('brand.metadata.themeColor')
    expect(schema).toContain('brand.assets.organizationLogo')
    expect(schema).not.toContain('/logo-dark.png')
    expect(manifest).toContain('brand.assets.pwaIcon192')
    expect(manifest).toContain('brand.colors.background')
  })

  it('keeps current OG art on chartreuse, not retired teal', () => {
    const og = readFileSync(path.join(repo, 'app/opengraph-image.tsx'), 'utf8')
    expect(og).toContain('#c7ff2f')
    expect(og).not.toContain('#00c2a0')
    expect(og).not.toContain('#33d4b8')
    expect(og).not.toContain('0,194,160')
  })

  it('does not reference deprecated current-brand assets outside archive', () => {
    const files = [
      ...walk(path.join(repo, 'app')),
      ...walk(path.join(repo, 'components')),
      ...walk(path.join(repo, 'public')),
    ].filter((file) => !file.includes(`${path.sep}archive${path.sep}`))

    const offenders: string[] = []
    for (const file of files) {
      if (!/\.(ts|tsx|js|jsx|html|css|svg|json|xml|webmanifest)$/.test(file)) continue
      if (file.endsWith(`${path.sep}brand.ts`)) continue
      const text = readFileSync(file, 'utf8')
      for (const asset of brand.deprecated.assets) {
        if (text.includes(asset)) offenders.push(`${path.relative(repo, file)}:${asset}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('does not point live metadata at missing og-card.png', () => {
    const files = walk(path.join(repo, 'app')).filter((file) => file.endsWith('.tsx') || file.endsWith('.ts'))
    const hits = files.filter((file) => {
      if (file.endsWith(`${path.sep}brand.ts`)) return false
      return readFileSync(file, 'utf8').includes('/og-card.png')
    })
    expect(hits.map((file) => path.relative(repo, file))).toEqual([])
  })
})
