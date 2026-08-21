/** @jest-environment node */

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const read = (relative: string) =>
  readFileSync(path.join(process.cwd(), relative), 'utf8')

describe('canonical SiteNav', () => {
  it('layout imports @/components/SiteNav and does not import the deleted drawer duplicate', () => {
    const layout = read('app/layout.tsx')
    expect(layout).toMatch(/from ['"]@\/components\/SiteNav['"]/)
    expect(layout).not.toMatch(/from ['"]@\/app\/components\/SiteNav['"]/)
    expect(layout).not.toMatch(/from ['"]\.\/components\/SiteNav['"]/)
    expect(existsSync(path.join(process.cwd(), 'app/components/SiteNav.tsx'))).toBe(false)
  })

  it('stories import the canonical SiteNav', () => {
    const stories = read('stories/SiteNav.stories.tsx')
    expect(stories).toMatch(/from ['"]@\/components\/SiteNav['"]/)
    expect(existsSync(path.join(process.cwd(), 'components/SiteNav.tsx'))).toBe(true)
  })
})
