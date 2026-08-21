import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('RFC 9727 api-catalog', () => {
  it('anchors the public catalog at nebulacomponents.com, not .shop', () => {
    const catalog = readFileSync(
      path.join(process.cwd(), 'public/.well-known/api-catalog'),
      'utf8',
    )
    expect(catalog).toContain('https://nebulacomponents.com/')
    expect(catalog).not.toContain('nebulacomponents.shop')
  })
})
