/** @jest-environment node */

// Verifies the fix for a real bug: the webhook used to trigger the $97
// prompt-pack fulfillment on ANY livemode purchase with an email, on the
// (disproven) assumption that the Fix Pack was the only paid product on
// the site. Live Stripe data showed several other active price points
// (Audit Lite $7, the $1,497 retainer, etc.) with no fulfillment of their
// own — a $7 buyer with a prior free audit would've silently received the
// full $97 pack, and a $1,497 buyer would've gotten nothing but a Telegram
// alert. Fulfillment must only fire for the exact $97 charge.

import { NextRequest } from 'next/server'

const successfulExecFile = (..._args: unknown[]) => {
  const cb = _args[_args.length - 1] as (err: unknown, res: { stdout: string; stderr: string }) => void
  cb(null, { stdout: '', stderr: '' })
}

const execFileMock = jest.fn(successfulExecFile)

const hermesMessage = (call: readonly unknown[]): string => {
  const args = call[1]
  return Array.isArray(args) ? String(args[3]) : ''
}

jest.mock('child_process', () => ({
  execFile: (...args: unknown[]) => execFileMock(...args),
}))

const poolQueryMock = jest.fn()
const clientQueryMock = jest.fn()
const releaseMock = jest.fn()
const connectMock = jest.fn()
let fulfillmentStatus: string | undefined
jest.mock('@/app/lib/db', () => ({
  pool: {
    query: (...args: unknown[]) => poolQueryMock(...args),
    connect: (...args: unknown[]) => connectMock(...args),
  },
}))

const flush = jest.fn().mockResolvedValue(undefined)
const identifyMock = jest.fn()
const captureMock = jest.fn()
jest.mock('@/app/lib/posthog-server', () => ({
  getPostHogClient: () => ({
    identify: identifyMock,
    capture: captureMock,
    flush,
  }),
}))

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cs_live_test',
    customer_email: 'buyer@example.com',
    amount_total: 9700,
    currency: 'usd',
    payment_status: 'paid',
    metadata: {
      offer_key: 'fix-pack',
      audit_id: '123e4567-e89b-12d3-a456-426614174000',
    },
    ...overrides,
  }
}

function mockConstructEvent(session: Record<string, unknown>, livemode = true) {
  const constructEvent = jest.fn().mockReturnValue({
    id: 'evt_test',
    type: 'checkout.session.completed',
    livemode,
    data: { object: session },
  })
  jest.doMock('stripe', () => {
    return jest.fn().mockImplementation(() => ({
      webhooks: { constructEvent },
    }))
  })
}

async function postWebhook() {
  const { POST } = await import('@/app/api/webhooks/stripe/route')
  const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
    method: 'POST',
    headers: { 'stripe-signature': 'test-sig' },
    body: '{}',
  })
  return POST(request)
}

describe('POST /api/webhooks/stripe fulfillment gating', () => {
  beforeEach(() => {
    jest.resetModules()
    execFileMock.mockReset().mockImplementation(successfulExecFile)
    fulfillmentStatus = undefined
    poolQueryMock.mockReset().mockResolvedValue({
      rowCount: 1,
      rows: [{ stripe_session_id: 'cs_live_test' }],
    })
    releaseMock.mockReset()
    connectMock.mockReset().mockResolvedValue({
      query: (...args: unknown[]) => clientQueryMock(...args),
      release: releaseMock,
    })
    clientQueryMock.mockReset().mockImplementation(async (
      sql: unknown,
      params?: unknown[],
    ) => {
      const statement = String(sql)
      if (
        statement.includes('pg_advisory_lock') ||
        statement.includes('pg_advisory_unlock')
      ) {
        return { rowCount: 1, rows: [] }
      }
      if (statement.includes('INSERT INTO purchases')) {
        const inserted = fulfillmentStatus === undefined
        if (inserted) fulfillmentStatus = statement.includes("'pending'")
          ? 'pending'
          : String(params?.[7])
        return {
          rowCount: inserted ? 1 : 0,
          rows: inserted ? [{ stripe_session_id: 'cs_live_test' }] : [],
        }
      }
      if (statement.includes('SELECT fulfillment_status')) {
        return {
          rowCount: fulfillmentStatus === undefined ? 0 : 1,
          rows: fulfillmentStatus === undefined
            ? []
            : [{ fulfillment_status: fulfillmentStatus }],
        }
      }
      if (statement.includes("fulfillment_status = 'delivered'")) {
        fulfillmentStatus = 'delivered'
        return { rowCount: 1, rows: [] }
      }
      if (statement.includes("fulfillment_status = 'failed'")) {
        fulfillmentStatus = 'failed'
        return { rowCount: 1, rows: [] }
      }
      if (statement.includes("fulfillment_status = 'processing'")) {
        fulfillmentStatus = 'processing'
        return { rowCount: 1, rows: [] }
      }
      throw new Error(`Unexpected query: ${statement}`)
    })
    identifyMock.mockClear()
    captureMock.mockClear()
    flush.mockClear()
    process.env.STRIPE_SECRET_KEY = 'sk_test_x'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_x'
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('runs deliver_prompt_pack.py for an exact $97 livemode purchase', async () => {
    mockConstructEvent(makeSession({ amount_total: 9700 }))
    const response = await postWebhook()

    expect(response.status).toBe(200)
    const pythonCalls = execFileMock.mock.calls.filter((c) =>
      String(c[0]).includes('venv/bin/python3')
    )
    expect(pythonCalls).toHaveLength(1)
    expect(pythonCalls[0][1]).toEqual(
      expect.arrayContaining([
        '--email',
        'buyer@example.com',
        '--stripe-session-id',
        'cs_live_test',
        '--audit-id',
        '123e4567-e89b-12d3-a456-426614174000',
      ])
    )
    expect(clientQueryMock.mock.calls.some((call) =>
      String(call[0]).includes("fulfillment_status = 'delivered'")
    )).toBe(true)
    expect(clientQueryMock.mock.calls.some((call) =>
      String(call[0]).includes('pg_advisory_lock')
    )).toBe(true)
    expect(clientQueryMock.mock.calls.some((call) =>
      String(call[0]).includes('pg_advisory_unlock')
    )).toBe(true)
    expect(connectMock).toHaveBeenCalledTimes(1)
    expect(releaseMock).toHaveBeenCalledTimes(1)
    const hermesCall = execFileMock.mock.calls.find((call) => call[0] === 'hermes')
    expect(hermesCall ? hermesMessage(hermesCall) : '').toContain('*SALE*')
    expect(captureMock).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'purchase_completed' }),
    )
  })

  it('does NOT run deliver_prompt_pack.py for a $7 Audit Lite purchase', async () => {
    mockConstructEvent(makeSession({ amount_total: 700 }))
    const response = await postWebhook()

    expect(response.status).toBe(200)
    const pythonCalls = execFileMock.mock.calls.filter((c) =>
      String(c[0]).includes('venv/bin/python3')
    )
    expect(pythonCalls).toHaveLength(0)
  })

  it('does NOT run deliver_prompt_pack.py for a $1,497 retainer purchase', async () => {
    mockConstructEvent(makeSession({ amount_total: 149700 }))
    const response = await postWebhook()

    expect(response.status).toBe(200)
    const pythonCalls = execFileMock.mock.calls.filter((c) =>
      String(c[0]).includes('venv/bin/python3')
    )
    expect(pythonCalls).toHaveLength(0)
  })

  it.each([
    ['unpaid receipt', { payment_status: 'unpaid' }],
    ['missing payment status', { payment_status: undefined }],
    ['non-USD currency', { currency: 'eur' }],
    ['missing currency', { currency: undefined }],
    ['missing offer identity', { metadata: {} }],
    ['missing metadata', { metadata: undefined }],
    ['wrong offer identity', { metadata: { offer_key: 'other-offer' } }],
    ['missing audit identity', { metadata: { offer_key: 'fix-pack' } }],
  ])('fails automatic delivery closed for %s while retaining persistence and review alerting', async (
    _label,
    overrides,
  ) => {
    mockConstructEvent(makeSession(overrides))
    const response = await postWebhook()

    expect(response.status).toBe(200)
    const pythonCalls = execFileMock.mock.calls.filter((c) =>
      String(c[0]).includes('venv/bin/python3')
    )
    const hermesCalls = execFileMock.mock.calls.filter((c) => c[0] === 'hermes')
    expect(pythonCalls).toHaveLength(0)
    expect(hermesCalls).toHaveLength(1)
    expect(hermesMessage(hermesCalls[0])).toContain('*CHECKOUT REVIEW*')
    expect(hermesMessage(hermesCalls[0])).not.toContain('*SALE*')
    expect(captureMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ event: 'purchase_completed' }),
    )
    expect(poolQueryMock).toHaveBeenCalledTimes(1)
    expect(connectMock).not.toHaveBeenCalled()
  })

  it('fulfills a delayed canonical paid receipt after public price expiry', async () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2027-01-01T00:00:00.000Z'))
    mockConstructEvent(makeSession())

    const response = await postWebhook()

    expect(response.status).toBe(200)
    const pythonCalls = execFileMock.mock.calls.filter((c) =>
      String(c[0]).includes('venv/bin/python3')
    )
    expect(pythonCalls).toHaveLength(1)
  })

  it('sends a review alert for a non-$97 purchase so a human sees it without a false sale label', async () => {
    mockConstructEvent(makeSession({ amount_total: 149700 }))
    await postWebhook()

    const hermesCalls = execFileMock.mock.calls.filter((c) => c[0] === 'hermes')
    expect(hermesCalls).toHaveLength(1)
    expect(hermesCalls[0][1]).toEqual(
      expect.arrayContaining(['send', '--to', 'telegram:5920497760'])
    )
    expect(hermesMessage(hermesCalls[0])).toContain('*CHECKOUT REVIEW*')
    expect(hermesMessage(hermesCalls[0])).not.toContain('*SALE*')
  })

  it('does not fulfill or alert for test-mode ($97-equivalent) events', async () => {
    mockConstructEvent(makeSession({ amount_total: 9700 }), false)
    await postWebhook()

    expect(execFileMock).not.toHaveBeenCalled()
  })

  it('uses customer_details.email when customer_email is absent', async () => {
    mockConstructEvent(makeSession({
      customer_email: null,
      customer_details: { email: 'details@example.com' },
    }))

    await postWebhook()

    const pythonCalls = execFileMock.mock.calls.filter((call) =>
      String(call[0]).includes('venv/bin/python3')
    )
    expect(pythonCalls).toHaveLength(1)
    expect(pythonCalls[0][1]).toEqual(
      expect.arrayContaining(['--email', 'details@example.com']),
    )
    const insertCall = clientQueryMock.mock.calls.find((call) =>
      String(call[0]).includes('INSERT INTO purchases')
    )
    expect(insertCall?.[1]?.[2]).toBe('details@example.com')
  })

  it('does not deliver, alert, or capture a purchase twice for a duplicate Stripe session', async () => {
    mockConstructEvent(makeSession())

    const first = await postWebhook()
    const second = await postWebhook()

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(connectMock).toHaveBeenCalledTimes(2)
    expect(releaseMock).toHaveBeenCalledTimes(2)
    expect(execFileMock.mock.calls.filter((call) =>
      String(call[0]).includes('venv/bin/python3')
    )).toHaveLength(1)
    expect(execFileMock.mock.calls.filter((call) => call[0] === 'hermes')).toHaveLength(1)
    expect(captureMock.mock.calls.filter((call) =>
      call[0]?.event === 'purchase_completed'
    )).toHaveLength(1)
  })

  it('serializes concurrent events so only the advisory-lock holder dispatches', async () => {
    let releaseSecondLock: (() => void) | undefined
    const secondLock = new Promise<void>((resolve) => {
      releaseSecondLock = resolve
    })
    let connectionIndex = 0
    connectMock.mockImplementation(async () => {
      const index = connectionIndex++
      return {
        query: async (...args: unknown[]) => {
          const statement = String(args[0])
          if (index === 1 && statement.includes('pg_advisory_lock')) {
            await secondLock
          }
          const result = await clientQueryMock(...args)
          if (index === 0 && statement.includes('pg_advisory_unlock')) {
            releaseSecondLock?.()
          }
          return result
        },
        release: releaseMock,
      }
    })
    let deliveryCallback:
      | ((error: unknown, result: { stdout: string; stderr: string }) => void)
      | undefined
    execFileMock.mockImplementation((...args: unknown[]) => {
      if (String(args[0]).includes('venv/bin/python3')) {
        deliveryCallback = args[args.length - 1] as typeof deliveryCallback
        return
      }
      successfulExecFile(...args)
    })
    mockConstructEvent(makeSession())

    const first = postWebhook()
    await new Promise((resolve) => setImmediate(resolve))
    expect(deliveryCallback).toBeDefined()

    const second = postWebhook()
    await new Promise((resolve) => setImmediate(resolve))
    expect(connectMock).toHaveBeenCalledTimes(2)
    expect(execFileMock.mock.calls.filter((call) =>
      String(call[0]).includes('venv/bin/python3')
    )).toHaveLength(1)

    deliveryCallback?.(null, { stdout: '', stderr: '' })
    const [firstResponse, secondResponse] = await Promise.all([first, second])

    expect(firstResponse.status).toBe(200)
    expect(secondResponse.status).toBe(200)
    expect(execFileMock.mock.calls.filter((call) =>
      String(call[0]).includes('venv/bin/python3')
    )).toHaveLength(1)
    expect(releaseMock).toHaveBeenCalledTimes(2)
  })

  it('restores failed fulfillment and retries the same receipt safely', async () => {
    execFileMock
      .mockImplementationOnce((...args: unknown[]) => {
        const callback = args[args.length - 1] as (error: Error) => void
        callback(new Error('delivery command failed'))
      })
      .mockImplementation(successfulExecFile)
    mockConstructEvent(makeSession())

    const failed = await postWebhook()
    const retried = await postWebhook()

    expect(failed.status).toBe(500)
    expect(retried.status).toBe(200)
    const pythonCalls = execFileMock.mock.calls.filter((call) =>
      String(call[0]).includes('venv/bin/python3')
    )
    expect(pythonCalls).toHaveLength(2)
    expect(clientQueryMock.mock.calls.some((call) =>
      String(call[0]).includes("fulfillment_status = 'failed'")
    )).toBe(true)
    expect(clientQueryMock.mock.calls.some((call) =>
      String(call[0]).includes("fulfillment_status = 'delivered'")
    )).toBe(true)
    expect(captureMock.mock.calls.filter((call) =>
      call[0]?.event === 'purchase_completed'
    )).toHaveLength(1)
  })

  it('safely retries a crash-sticky processing row under the advisory lock', async () => {
    fulfillmentStatus = 'processing'
    mockConstructEvent(makeSession())

    const response = await postWebhook()

    expect(response.status).toBe(200)
    expect(clientQueryMock.mock.calls.some((call) =>
      String(call[0]).includes('pg_advisory_lock')
    )).toBe(true)
    expect(execFileMock.mock.calls.filter((call) =>
      String(call[0]).includes('venv/bin/python3')
    )).toHaveLength(1)
    expect(fulfillmentStatus).toBe('delivered')
  })

  it('returns 500 before side effects when persistence fails so Stripe can retry safely', async () => {
    connectMock.mockRejectedValueOnce(new Error('database unavailable'))
    mockConstructEvent(makeSession())

    const response = await postWebhook()

    expect(response.status).toBe(500)
    expect(execFileMock).not.toHaveBeenCalled()
    expect(captureMock).not.toHaveBeenCalled()
  })
})
