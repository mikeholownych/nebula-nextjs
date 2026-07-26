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

const queryMock = jest.fn()
jest.mock('@/app/lib/db', () => ({
  pool: { query: (...args: unknown[]) => queryMock(...args) },
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
    metadata: { offer_key: 'fix-pack' },
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
    queryMock.mockReset().mockImplementation(async (sql: unknown) => {
      const statement = String(sql)
      if (statement.includes('INSERT INTO purchases')) {
        return { rowCount: 1, rows: [{ stripe_session_id: 'cs_live_test' }] }
      }
      if (statement.includes("fulfillment_status = 'processing'")) {
        return { rowCount: 1, rows: [{ stripe_session_id: 'cs_live_test' }] }
      }
      if (
        statement.includes("fulfillment_status = 'delivered'") ||
        statement.includes("fulfillment_status = 'failed'")
      ) {
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
      ])
    )
    expect(queryMock.mock.calls.some((call) =>
      String(call[0]).includes("fulfillment_status = 'delivered'")
    )).toBe(true)
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
    expect(queryMock).toHaveBeenCalledTimes(1)
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
    expect(queryMock.mock.calls[0][1][2]).toBe('details@example.com')
  })

  it('does not deliver, alert, or capture a purchase twice for a duplicate Stripe session', async () => {
    queryMock
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ stripe_session_id: 'cs_live_test' }],
      })
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ stripe_session_id: 'cs_live_test' }],
      })
      .mockResolvedValueOnce({ rowCount: 1, rows: [] })
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
    mockConstructEvent(makeSession())

    const first = await postWebhook()
    const second = await postWebhook()

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(queryMock).toHaveBeenCalledTimes(5)
    expect(execFileMock.mock.calls.filter((call) =>
      String(call[0]).includes('venv/bin/python3')
    )).toHaveLength(1)
    expect(execFileMock.mock.calls.filter((call) => call[0] === 'hermes')).toHaveLength(1)
    expect(captureMock.mock.calls.filter((call) =>
      call[0]?.event === 'purchase_completed'
    )).toHaveLength(1)
  })

  it('restores failed fulfillment and retries the same receipt safely', async () => {
    execFileMock
      .mockImplementationOnce((...args: unknown[]) => {
        const callback = args[args.length - 1] as (error: Error) => void
        callback(new Error('delivery command failed'))
      })
      .mockImplementation(successfulExecFile)
    queryMock
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ stripe_session_id: 'cs_live_test' }] })
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ stripe_session_id: 'cs_live_test' }] })
      .mockResolvedValueOnce({ rowCount: 1, rows: [] })
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ stripe_session_id: 'cs_live_test' }] })
      .mockResolvedValueOnce({ rowCount: 1, rows: [] })
    mockConstructEvent(makeSession())

    const failed = await postWebhook()
    const retried = await postWebhook()

    expect(failed.status).toBe(500)
    expect(retried.status).toBe(200)
    const pythonCalls = execFileMock.mock.calls.filter((call) =>
      String(call[0]).includes('venv/bin/python3')
    )
    expect(pythonCalls).toHaveLength(2)
    expect(queryMock.mock.calls.some((call) =>
      String(call[0]).includes("fulfillment_status = 'failed'")
    )).toBe(true)
    expect(queryMock.mock.calls.some((call) =>
      String(call[0]).includes("fulfillment_status = 'delivered'")
    )).toBe(true)
    expect(captureMock.mock.calls.filter((call) =>
      call[0]?.event === 'purchase_completed'
    )).toHaveLength(1)
  })

  it('does not dispatch when another event already holds the processing claim', async () => {
    queryMock
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
    mockConstructEvent(makeSession())

    const response = await postWebhook()

    expect(response.status).toBe(200)
    expect(queryMock).toHaveBeenCalledTimes(2)
    expect(execFileMock).not.toHaveBeenCalled()
    expect(captureMock).not.toHaveBeenCalled()
  })

  it('returns 500 before side effects when persistence fails so Stripe can retry safely', async () => {
    queryMock.mockRejectedValueOnce(new Error('database unavailable'))
    mockConstructEvent(makeSession())

    const response = await postWebhook()

    expect(response.status).toBe(500)
    expect(execFileMock).not.toHaveBeenCalled()
    expect(captureMock).not.toHaveBeenCalled()
  })
})
