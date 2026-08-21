/** @jest-environment node */

import { logApiError } from '@/app/lib/ops-log'

describe('logApiError', () => {
  it('includes error name and message without a stack trace', () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const err = new Error('ECONNREFUSED')
    err.name = 'Error'
    err.stack = 'Error: ECONNREFUSED\n    at Object.<anonymous> (/tmp/fake.ts:1:1)'

    logApiError('Audit start error', {
      request_id: 'req-1',
      journey_id: 'journey-1',
      error: err,
    })

    const jsonLine = errSpy.mock.calls
      .map((args) => args[0])
      .find((line) => typeof line === 'string' && line.startsWith('{'))
    expect(jsonLine).toEqual(expect.any(String))
    const parsed = JSON.parse(jsonLine as string) as {
      msg: string
      request_id: string
      journey_id: string
      revision: string
      error: { name: string; message: string }
      stack?: unknown
    }
    expect(parsed.msg).toBe('Audit start error')
    expect(parsed.request_id).toBe('req-1')
    expect(parsed.journey_id).toBe('journey-1')
    expect(parsed).toHaveProperty('revision')
    expect(parsed.error).toEqual({ name: 'Error', message: 'ECONNREFUSED' })
    expect(parsed.stack).toBeUndefined()
    expect(jsonLine).not.toMatch(/at Object\.<anonymous>/)
    errSpy.mockRestore()
  })
})
