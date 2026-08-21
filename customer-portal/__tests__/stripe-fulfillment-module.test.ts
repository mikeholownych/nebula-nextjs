/** @jest-environment node */

import { readFileSync } from 'node:fs'
import path from 'node:path'

const read = (relative: string) =>
  readFileSync(path.join(process.cwd(), relative), 'utf8')

describe('stripe fulfillment extract', () => {
  it('webhook route imports in-process fulfillment helpers from the sibling module', () => {
    const route = read('app/api/webhooks/stripe/route.ts')
    const fulfillment = read('app/api/webhooks/stripe/fulfillment.ts')

    expect(route).toMatch(/from ['"]\.\/fulfillment['"]/)
    expect(route).toContain('enqueueKitSend')
    expect(route).toContain('restoreFailedFulfillment')
    expect(route).not.toContain('from \'child_process\'')
    expect(fulfillment).toContain('export async function enqueueKitSend')
    expect(fulfillment).toContain('/api/outbox/enqueue')
    expect(fulfillment).toMatch(/127\.0\.0\.1:8001/)
    expect(fulfillment).not.toMatch(/127\.0\.0\.1:8769|localhost:8769/)
  })
})
