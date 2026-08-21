import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const read = (relative: string) => readFileSync(path.join(process.cwd(), relative), 'utf8')

describe('/login indexability', () => {
  it('ships a server layout that noindexes the sign-in page and self-canonicalizes', () => {
    const layoutPath = path.join(process.cwd(), 'app/login/layout.tsx')
    expect(existsSync(layoutPath)).toBe(true)
    const source = read('app/login/layout.tsx')
    expect(source).toMatch(/robots:\s*\{[^}]*index:\s*false/)
    expect(source).toMatch(/canonical:\s*['"]https:\/\/nebulacomponents\.com\/login['"]/)
    expect(source).not.toMatch(/canonical:\s*['"]https:\/\/nebulacomponents\.com['"]\s*$/)
  })
})
