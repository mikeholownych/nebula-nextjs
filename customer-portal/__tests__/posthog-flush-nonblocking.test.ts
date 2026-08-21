/** @jest-environment node */

import { readFileSync } from 'node:fs'
import path from 'node:path'

const files = [
  'app/api/audit/start/route.ts',
  'app/api/audit/unlock/route.ts',
  'app/api/checkout/route.ts',
  'app/api/webhooks/stripe/route.ts',
]

describe('PostHog flush is not awaited on user-critical paths', () => {
  for (const relative of files) {
    it(`${relative} does not await ph.flush()`, () => {
      const source = readFileSync(path.join(process.cwd(), relative), 'utf8')
      expect(source).not.toMatch(/await\s+ph\.flush\s*\(/)
    })
  }
})
