/** @jest-environment node */

import { readFileSync } from 'node:fs'
import path from 'node:path'

const source = readFileSync(
  path.join(process.cwd(), 'app/pricing/page.tsx'),
  'utf8',
)

describe('pricing Product schema (Google Merchant Center)', () => {
  it('includes the required image field on the Product schema', () => {
    // Google Merchant Center flagged "Missing field 'image'" on the
    // /pricing Product structured data. The Product schema must carry a
    // resolvable image URL or the listing is rejected.
    expect(source).toContain("image: 'https://nebulacomponents.com/brand/v2/og-default.png'")
  })

  it('the image URL points at the canonical OG asset', () => {
    expect(source).toContain('/brand/v2/og-default.png')
  })
})
