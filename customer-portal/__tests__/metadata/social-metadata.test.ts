import { readFileSync } from 'fs'
import path from 'path'

const read = (relative: string) => readFileSync(path.join(process.cwd(), relative), 'utf8')

describe('social metadata', () => {
  it('anchors generated social image URLs to the production origin', () => {
    const layout = read('app/layout.tsx')

    expect(layout).toContain("metadataBase: new URL('https://nebulacomponents.shop')")
    expect(layout).not.toContain('localhost:3000')
  })

  it('generates a large social share image instead of a favicon-sized asset', () => {
    const imageRoute = read('app/opengraph-image.tsx')

    expect(imageRoute).toMatch(/width:\s*1200/)
    expect(imageRoute).toMatch(/height:\s*630/)
    expect(imageRoute).toContain('Nebula Components')
  })
})
