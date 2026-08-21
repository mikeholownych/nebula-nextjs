/** @jest-environment node */

// The $97 offer is a repair sprint. A canonical live purchase must
// transition through processing and deliver the tailored kit exactly once.

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
  captureServerException: jest.fn(),
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
      analytics_consent: 'all',
      analytics_person_id: `person_${'a'.repeat(32)}`,
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
  const originalFetch = global.fetch

  beforeEach(() => {
    jest.resetModules()
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ url: 'https://audited.example/landing' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
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
        if (fulfillmentStatus !== 'processing') {
          return { rowCount: 0, rows: [] }
        }
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
    process.env.STRIPE_SECRET_KEY = '[REDACTED]'
    process.env.STRIPE_WEBHOOK_SECRET = '[REDACTED]'
    process.env.INTERNAL_API_SECRET = 'test-internal'
    process.env.PLATFORM_API_URL = 'http://127.0.0.1:8001'
    process.env.INTERNAL_API_SECRET = 'internal-secret'
    process.env.PLATFORM_API_URL = 'http://127.0.0.1:8001'
  })

  afterEach(() => {
    jest.useRealTimers()
    global.fetch = originalFetch
  })

  it('delivers the active repair sprint through processing and records a sale', async () => {
    mockConstructEvent(makeSession({ amount_total: 9700 }))
    const response = await postWebhook()

    expect(response.status).toBe(200)
    const pythonCalls = execFileMock.mock.calls.filter((c) =>
      String(c[0]).includes('venv/bin/python3')
    )
    expect(pythonCalls).toHaveLength(0)
    const enqueue = (global.fetch as jest.Mock).mock.calls.find((call) =>
      String(call[0]).includes('/api/outbox/enqueue'),
    )
    expect(enqueue).toBeDefined()
    expect(String(enqueue?.[1]?.body)).toContain('cs_live_test')
    expect(String(enqueue?.[1]?.body)).toContain('buyer@example.com')

    const hermesCalls = execFileMock.mock.calls.filter((c) => c[0] === 'hermes')
    expect(hermesCalls).toHaveLength(1)
    expect(hermesMessage(hermesCalls[0])).toContain('*SALE*')
    expect(hermesMessage(hermesCalls[0])).not.toContain('KICKOFF REQUIRED')
    expect(clientQueryMock.mock.calls.some((call) =>
      String(call[0]).includes("SET fulfillment_status = 'processing'")
    )).toBe(true)
    expect(fulfillmentStatus).toBe('processing')
  })

  it('enqueues kit send for the D7 $67 close of the same sprint', async () => {
    mockConstructEvent(makeSession({ amount_total: 6700 }))
    const response = await postWebhook()

    expect(response.status).toBe(200)
    const pythonCalls = execFileMock.mock.calls.filter((c) =>
      String(c[0]).includes('venv/bin/python3')
    )
    expect(pythonCalls).toHaveLength(0)
    expect((global.fetch as jest.Mock).mock.calls.some((call) =>
      String(call[0]).includes('/api/outbox/enqueue'),
    )).toBe(true)
    expect(fulfillmentStatus).toBe('processing')
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
    expect(pythonCalls).toHaveLength(0)
    expect((global.fetch as jest.Mock).mock.calls.some((call) =>
      String(call[0]).includes('/api/outbox/enqueue'),
    )).toBe(true)
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
    // Same reasoning as the duplicate-session test above.
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2027-01-01T00:00:00.000Z'))
    mockConstructEvent(makeSession({
      customer_email: null,
      customer_details: { email: 'details@example.com' },
    }))

    await postWebhook()

    const pythonCalls = execFileMock.mock.calls.filter((call) =>
      String(call[0]).includes('venv/bin/python3')
    )
    expect(pythonCalls).toHaveLength(0)
    const enqueue = (global.fetch as jest.Mock).mock.calls.find((call) =>
      String(call[0]).includes('/api/outbox/enqueue'),
    )
    expect(String(enqueue?.[1]?.body)).toContain('details@example.com')
    const insertCall = clientQueryMock.mock.calls.find((call) =>
      String(call[0]).includes('INSERT INTO purchases')
    )
    expect(insertCall?.[1]?.[2]).toBe('details@example.com')
  })

  it('does not deliver, alert, or capture a purchase twice for a duplicate Stripe session', async () => {
    // Idempotency of the automatic-delivery path only exercises once the
    // Repair Sprint offer is no longer the live managed offer (see "alerts
    // for a manual repair-sprint kickoff" above for the in-window case,
    // which never calls deliver_prompt_pack.py at all).
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2027-01-01T00:00:00.000Z'))
    mockConstructEvent(makeSession())

    const first = await postWebhook()
    const second = await postWebhook()

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(connectMock).toHaveBeenCalledTimes(2)
    expect(releaseMock).toHaveBeenCalledTimes(2)
    expect(execFileMock.mock.calls.filter((call) =>
      String(call[0]).includes('venv/bin/python3')
    )).toHaveLength(0)
    expect(execFileMock.mock.calls.filter((call) => call[0] === 'hermes')).toHaveLength(1)
    expect(captureMock.mock.calls.filter((call) =>
      call[0]?.event === 'purchase_completed'
    )).toHaveLength(1)
  })

  it('serializes concurrent events so only the advisory-lock holder dispatches', async () => {
    // Same reasoning as the duplicate-session test above: this exercises the
    // automatic-delivery lock/retry path, which only runs once the Repair
    // Sprint offer is no longer live. Fake only Date so setImmediate-based
    // orchestration below still yields the real event loop.
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'clearTimeout'] })
    jest.setSystemTime(new Date('2027-01-01T00:00:00.000Z'))
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
    mockConstructEvent(makeSession())

    const first = postWebhook()
    await new Promise((resolve) => setImmediate(resolve))
    const second = postWebhook()
    await new Promise((resolve) => setImmediate(resolve))
    expect(connectMock).toHaveBeenCalledTimes(2)

    const [firstResponse, secondResponse] = await Promise.all([first, second])

    expect(firstResponse.status).toBe(200)
    expect(secondResponse.status).toBe(200)
    expect(execFileMock.mock.calls.filter((call) =>
      String(call[0]).includes('venv/bin/python3')
    )).toHaveLength(0)
    expect(releaseMock).toHaveBeenCalledTimes(2)
  })

  it('restores failed fulfillment and retries the same receipt safely', async () => {
    // Same reasoning as the duplicate-session test above.
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2027-01-01T00:00:00.000Z'))
    // Fail only the delivery subprocess, not the fire-and-forget sale alert
    // that fires first (the alert's own execFile call must not be mistaken
    // for the delivery call this test is actually exercising).
    let enqueueAttempts = 0
    ;(global.fetch as jest.Mock).mockImplementation(async (url: unknown) => {
      if (String(url).includes('/api/outbox/enqueue')) {
        enqueueAttempts += 1
        if (enqueueAttempts === 1) {
          return new Response('enqueue failed', { status: 503 })
        }
        return new Response(JSON.stringify({ id: 'msg-1' }), { status: 200 })
      }
      return new Response(JSON.stringify({ url: 'https://audited.example/landing' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })
    mockConstructEvent(makeSession())

    const failed = await postWebhook()
    const retried = await postWebhook()

    expect(failed.status).toBe(500)
    expect(retried.status).toBe(200)
    expect(enqueueAttempts).toBe(2)
    expect(clientQueryMock.mock.calls.some((call) =>
      String(call[0]).includes("fulfillment_status = 'failed'")
    )).toBe(true)
    expect(fulfillmentStatus).toBe('processing')
    expect(captureMock.mock.calls.filter((call) =>
      call[0]?.event === 'purchase_completed'
    )).toHaveLength(1)
  })

  it('safely retries a crash-sticky processing row under the advisory lock', async () => {
    // Same reasoning as the duplicate-session test above.
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2027-01-01T00:00:00.000Z'))
    fulfillmentStatus = 'processing'
    mockConstructEvent(makeSession())

    const response = await postWebhook()

    expect(response.status).toBe(200)
    expect(clientQueryMock.mock.calls.some((call) =>
      String(call[0]).includes('pg_advisory_lock')
    )).toBe(true)
    expect(execFileMock.mock.calls.filter((call) =>
      String(call[0]).includes('venv/bin/python3')
    )).toHaveLength(0)
    expect((global.fetch as jest.Mock).mock.calls.some((call) =>
      String(call[0]).includes('/api/outbox/enqueue'),
    )).toBe(true)
    expect(fulfillmentStatus).toBe('processing')
  })

  it('returns 500 before side effects when persistence fails so Stripe can retry safely', async () => {
    connectMock.mockRejectedValueOnce(new Error('database unavailable'))
    mockConstructEvent(makeSession())

    const response = await postWebhook()

    expect(response.status).toBe(500)
    expect(execFileMock).not.toHaveBeenCalled()
    expect(captureMock).not.toHaveBeenCalled()
  })

  it('sets purchases.audit_url from Stripe metadata instead of platform audits', async () => {
    mockConstructEvent(makeSession({
      metadata: {
        offer_key: 'fix-pack',
        audit_id: '123e4567-e89b-12d3-a456-426614174000',
        url: 'https://buyer.example/landing',
        analytics_consent: 'all',
        analytics_person_id: `person_${'a'.repeat(32)}`,
      },
    }))

    const response = await postWebhook()

    expect(response.status).toBe(200)
    const enqueue = (global.fetch as jest.Mock).mock.calls.find((call) =>
      String(call[0]).includes('/api/outbox/enqueue'),
    )
    expect(enqueue).toBeDefined()
    expect(String(enqueue?.[1]?.body)).toContain('https://buyer.example/landing')
    expect(String(enqueue?.[1]?.body)).not.toMatch(/FROM\s+audits/i)
  })

  it('falls back to FastAPI GET /audit/{id} when Stripe metadata has no url', async () => {
    mockConstructEvent(makeSession())
    const response = await postWebhook()

    expect(response.status).toBe(200)
    const auditLookup = (global.fetch as jest.Mock).mock.calls.find((call) =>
      String(call[0]).includes('/audit/123e4567-e89b-12d3-a456-426614174000'),
    )
    expect(auditLookup).toBeDefined()
    const enqueue = (global.fetch as jest.Mock).mock.calls.find((call) =>
      String(call[0]).includes('/api/outbox/enqueue'),
    )
    expect(String(enqueue?.[1]?.body)).toContain('https://audited.example/landing')
  })

  it('notifies FastAPI CRM after persist with the internal secret', async () => {
    mockConstructEvent(makeSession({
      metadata: {
        offer_key: 'fix-pack',
        audit_id: '123e4567-e89b-12d3-a456-426614174000',
        url: 'https://buyer.example/landing',
        analytics_consent: 'all',
        analytics_person_id: `person_${'a'.repeat(32)}`,
      },
    }))

    const response = await postWebhook()

    expect(response.status).toBe(200)
    const crmCall = (global.fetch as jest.Mock).mock.calls.find((call) =>
      String(call[0]).includes('/api/crm/purchase-completed'),
    )
    expect(crmCall).toBeDefined()
    const init = crmCall?.[1] as RequestInit
    const headers = new Headers(init.headers)
    expect(headers.get('authorization')).toBe('Bearer internal-secret')
    const body = JSON.parse(String(init.body))
    expect(body.email).toBe('buyer@example.com')
    expect(body.audit_id).toBe('123e4567-e89b-12d3-a456-426614174000')
    expect(body.audit_url).toBe('https://buyer.example/landing')
  })

  it('logs non-2xx CRM notify responses without failing the Stripe webhook', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    global.fetch = jest.fn().mockImplementation(async (url: unknown) => {
      if (String(url).includes('/api/crm/purchase-completed')) {
        return new Response('crm unavailable', { status: 503 })
      }
      return new Response(JSON.stringify({ url: 'https://audited.example/landing' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })
    mockConstructEvent(makeSession({
      metadata: {
        offer_key: 'fix-pack',
        audit_id: '123e4567-e89b-12d3-a456-426614174000',
        url: 'https://buyer.example/landing',
        analytics_consent: 'all',
        analytics_person_id: `person_${'a'.repeat(32)}`,
      },
    }))

    const response = await postWebhook()

    expect(response.status).toBe(200)
    expect(errorSpy).toHaveBeenCalledWith(
      'CRM purchase hook failed:',
      503,
      expect.any(String),
    )
    errorSpy.mockRestore()
  })

  it('notifies CRM again on an already-delivered Stripe retry', async () => {
    fulfillmentStatus = 'delivered'
    mockConstructEvent(makeSession({
      metadata: {
        offer_key: 'fix-pack',
        audit_id: '123e4567-e89b-12d3-a456-426614174000',
        url: 'https://buyer.example/landing',
        analytics_consent: 'all',
        analytics_person_id: `person_${'a'.repeat(32)}`,
      },
    }))

    const response = await postWebhook()

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ received: true, duplicate: true })
    expect(execFileMock.mock.calls.filter((call) =>
      String(call[0]).includes('venv/bin/python3'),
    )).toHaveLength(0)
    const crmCalls = (global.fetch as jest.Mock).mock.calls.filter((call) =>
      String(call[0]).includes('/api/crm/purchase-completed'),
    )
    expect(crmCalls).toHaveLength(1)
    const body = JSON.parse(String((crmCalls[0][1] as RequestInit).body))
    expect(body.email).toBe('buyer@example.com')
    expect(body.audit_url).toBe('https://buyer.example/landing')
  })

  it('releases the advisory-lock client when persistence fails after connect', async () => {
    clientQueryMock.mockImplementation(async (sql: unknown) => {
      const statement = String(sql)
      if (statement.includes('pg_advisory_lock') || statement.includes('pg_advisory_unlock')) {
        return { rowCount: 1, rows: [] }
      }
      if (statement.includes('INSERT INTO purchases')) {
        throw new Error('insert failed')
      }
      throw new Error(`Unexpected query: ${statement}`)
    })
    mockConstructEvent(makeSession())

    const response = await postWebhook()

    expect(response.status).toBe(500)
    expect(connectMock).toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalled()
    expect(execFileMock).not.toHaveBeenCalled()
  })
})
