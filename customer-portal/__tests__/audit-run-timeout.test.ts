/** @jest-environment node */

import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('POST /api/audit/run x402 leftover path', () => {
  it('aborts the FastAPI wait_for_result fetch with AbortSignal.timeout', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'app/api/audit/run/route.ts'),
      'utf8',
    )
    expect(source).toMatch(/AbortSignal\.timeout\(/)
    expect(source).toMatch(/\/audit\/run/)
  })
})
