/** @jest-environment node */

// Subscription lifecycle persistence must be org-keyed and provision-first:
// a live created event provisions User/Organization/owner Membership and
// lands one org-keyed row; a redelivered event only re-runs the upsert;
// deletion flips status without destroying the paid-through window; an
// unrecognized price writes nothing and pages ops through the outbox.

import { NextRequest } from 'next/server'

const execFileMock = jest.fn((_file: string, _args: readonly string[], cb?: (err: unknown, res: { stdout: string; stderr: string }) => void) => {
  cb?.(null, { stdout: '', stderr: '' })
})

jest.mock('child_process', () => ({
  execFile: (...args: unknown[]) => execFileMock(...(args as [string, readonly string[], (err: unknown, res: { stdout: string; stderr: string }) => void])),
}))

const poolQueryMock = jest.fn()
const clientQueryMock = jest.fn()
const releaseMock = jest.fn()
const connectMock = jest.fn()
jest.mock('@/app/lib/db', () => ({
  pool: {
    query: (...args: unknown[]) => poolQueryMock(...args),
    connect: (...args: unknown[]) => connectMock(...args),
  },
}))

jest.mock('@/app/lib/posthog-server', () => ({
  getPostHogClient: () => ({
    capture: jest.fn(),
    flush: jest.fn().mockResolvedValue(undefined),
  }),
  captureServerException: jest.fn(),
}))

const welcomeMock = jest.fn().mockResolvedValue(true)
jest.mock('@/app/lib/subscription-emails', () => ({
  sendSubscriptionWelcome: (...args: unknown[]) => welcomeMock(...args),
}))

// Real Pro monthly price from app/lib/subscription-plans.ts.
const PRO_MONTHLY_PRICE = 'price_1U0l9AEINR1kU9chtiA64BKd'
const UNKNOWN_PRICE = 'price_unknown_not_mapped'
const USER_ID = '11111111-1111-4111-8111-111111111111'
const ORG_ID = '22222222-2222-4222-8222-222222222222'
const SUB_ID = 'sub_test_123'
const CUSTOMER_ID = 'cus_test_123'

let provisioned: boolean
let subWrites: Array<{ sql: string; params: unknown[] | undefined }>

function makeSubscriptionEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'evt_sub_1',
    type: 'customer.subscription.created',
    livemode: true,
    data: {
      object: {
        id: SUB_ID,
        customer: CUSTOMER_ID,
        status: 'active',
        cancel_at_period_end: false,
        items: {
          data: [
            {
              price: { id: PRO_MONTHLY_PRICE, unit_amount: 2900 },
              current_period_start: 1755000000,
              current_period_end: 1757592000,
            },
          ],
        },
      },
    },
    ...overrides,
  }
}

function mockConstructEvent(event: Record<string, unknown>) {
  const constructEvent = jest.fn().mockReturnValue(event)
  const retrieve = jest.fn().mockResolvedValue({
    id: CUSTOMER_ID,
    email: 'buyer@example.com',
  })
  jest.doMock('stripe', () => {
    return jest.fn().mockImplementation(() => ({
      webhooks: { constructEvent },
      customers: { retrieve },
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

describe('POST /api/webhooks/stripe subscription persistence', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    jest.resetModules()
    provisioned = false
    subWrites = []
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    )
    execFileMock.mockClear()
    releaseMock.mockReset()
    connectMock.mockReset().mockResolvedValue({
      query: (...args: unknown[]) => clientQueryMock(...args),
      release: releaseMock,
    })
    clientQueryMock.mockReset().mockImplementation(async (sql: unknown, params?: unknown[]) => {
      const statement = String(sql)
      if (statement.includes('SELECT u.id AS user_id')) {
        return provisioned
          ? { rowCount: 1, rows: [{ user_id: USER_ID, org_id: ORG_ID }] }
          : { rowCount: 0, rows: [] }
      }
      if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(statement.trim())) {
        return { rowCount: 0, rows: [] }
      }
      if (statement.includes('INSERT INTO users')) {
        return { rowCount: 1, rows: [] }
      }
      if (statement.includes('SELECT id FROM users WHERE LOWER(email)')) {
        return { rowCount: 1, rows: [{ id: USER_ID }] }
      }
      if (statement.includes('INSERT INTO organizations')) {
        return { rowCount: 1, rows: [] }
      }
      if (statement.includes('SELECT id FROM organizations WHERE slug')) {
        return { rowCount: 1, rows: [{ id: ORG_ID }] }
      }
      if (statement.includes('INSERT INTO memberships')) {
        provisioned = true
        return { rowCount: 1, rows: [] }
      }
      if (statement.includes('INSERT INTO subscriptions')) {
        // Mirror Postgres semantics of RETURNING (xmax = 0): the first write
        // takes the INSERT branch (new row), any repeat is the UPDATE branch.
        const inserted = subWrites.length === 0
        subWrites.push({ sql: statement, params })
        return { rowCount: 1, rows: [{ inserted, id: 1 }] }
      }
      throw new Error(`Unexpected query: ${statement}`)
    })
    welcomeMock.mockClear()
    process.env.STRIPE_SECRET_KEY = '[REDACTED]'
    process.env.STRIPE_WEBHOOK_SECRET = '[REDACTED]'
    process.env.INTERNAL_API_SECRET = 'internal-secret'
    process.env.PLATFORM_API_URL = 'http://127.0.0.1:8001'
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  const insertCount = (fragment: string) =>
    clientQueryMock.mock.calls.filter((call) => String(call[0]).includes(fragment)).length

  it('provisions user, organization, and owner membership, then inserts one org-keyed row with lifecycle fields', async () => {
    mockConstructEvent(makeSubscriptionEvent())
    const response = await postWebhook()

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ received: true })

    // Provisioning ran as a transaction on a dedicated client.
    expect(insertCount('BEGIN')).toBe(1)
    expect(insertCount('COMMIT')).toBe(1)
    expect(insertCount('INSERT INTO users')).toBe(1)
    expect(insertCount('INSERT INTO organizations')).toBe(1)
    expect(insertCount('INSERT INTO memberships')).toBe(1)

    // Exactly one org-keyed subscription row.
    expect(subWrites).toHaveLength(1)
    const { sql, params } = subWrites[0]
    expect(sql).toContain('(organization_id, stripe_subscription_id, stripe_customer_id')
    expect(sql).not.toMatch(/\bemail\b/)
    expect(sql).toContain('ON CONFLICT (stripe_subscription_id) DO UPDATE SET')
    expect(sql).toContain('RETURNING (xmax = 0) AS inserted, id')
    expect(params?.[0]).toBe(ORG_ID)
    expect(params?.[1]).toBe(SUB_ID)
    expect(params?.[2]).toBe(CUSTOMER_ID)
    expect(params?.[3]).toBe('active')
    expect(params?.[4]).toBe('pro')
    expect(params?.[5]).toBe('monthly')
    expect(params?.[6]).toBe(new Date(1755000000 * 1000).toISOString())
    expect(params?.[7]).toBe(new Date(1757592000 * 1000).toISOString())
    expect(params?.[8]).toBe(false)
    expect(params?.[9]).toBe(true)

    // A created-first-time row (INSERT branch) fires the welcome enqueue and
    // sale alert exactly once.
    expect(welcomeMock).toHaveBeenCalledTimes(1)
    expect(execFileMock).toHaveBeenCalledTimes(1)
  })

  it('persists test-mode events with livemode false and skips alerts and welcome sends', async () => {
    mockConstructEvent(makeSubscriptionEvent({ livemode: false }))
    const response = await postWebhook()

    expect(response.status).toBe(200)
    expect(subWrites).toHaveLength(1)
    expect(subWrites[0].params?.[9]).toBe(false)
    expect(welcomeMock).not.toHaveBeenCalled()
    expect(execFileMock).not.toHaveBeenCalled()
  })

  it('replays a duplicate event through the upsert only, without reprovisioning', async () => {
    mockConstructEvent(makeSubscriptionEvent())

    const first = await postWebhook()
    const second = await postWebhook()

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    // Both deliveries converge on the same conflict-target upsert...
    expect(subWrites).toHaveLength(2)
    expect(subWrites[0].params?.[1]).toBe(SUB_ID)
    expect(subWrites[1].params?.[1]).toBe(SUB_ID)
    // ...but find-or-create provisioning executed its writes exactly once,
    // so the second delivery can only have taken the UPDATE branch.
    expect(insertCount('INSERT INTO users')).toBe(1)
    expect(insertCount('INSERT INTO organizations')).toBe(1)
    expect(insertCount('INSERT INTO memberships')).toBe(1)
    expect(insertCount('BEGIN')).toBe(1)
    // First-sale side effects are keyed to the INSERT branch: the created-
    // first-time delivery fires the welcome enqueue and sale alert exactly
    // once, and the redelivered upsert (inserted=false) fires zero.
    expect(welcomeMock).toHaveBeenCalledTimes(1)
    expect(execFileMock).toHaveBeenCalledTimes(1)
  })

  it('keeps the row on deletion: status deleted while preserving current_period_end via COALESCE', async () => {
    provisioned = true
    mockConstructEvent(makeSubscriptionEvent({
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: SUB_ID,
          customer: CUSTOMER_ID,
          status: 'canceled',
          cancel_at_period_end: true,
          items: {
            data: [
              {
                price: { id: PRO_MONTHLY_PRICE, unit_amount: 2900 },
                current_period_start: 1755000000,
                current_period_end: 1757592000,
              },
            ],
          },
        },
      },
    }))
    const response = await postWebhook()

    expect(response.status).toBe(200)
    expect(subWrites).toHaveLength(1)
    const { sql, params } = subWrites[0]
    // The preservation clause is in the executed SQL and the delete passes
    // NULL periods so COALESCE falls back to the stored paid-through window.
    expect(sql).toContain(
      'current_period_end=COALESCE(EXCLUDED.current_period_end, subscriptions.current_period_end)',
    )
    expect(sql).toContain(
      'current_period_start=COALESCE(EXCLUDED.current_period_start, subscriptions.current_period_start)',
    )
    expect(params?.[3]).toBe('deleted')
    expect(params?.[6]).toBeNull()
    expect(params?.[7]).toBeNull()
    expect(params?.[9]).toBe(true)
    expect(welcomeMock).not.toHaveBeenCalled()
  })

  it('short-circuits subscription-mode checkout sessions without any purchases write', async () => {
    provisioned = true
    mockConstructEvent({
      id: 'evt_co_sub_1',
      type: 'checkout.session.completed',
      livemode: true,
      data: {
        object: {
          id: 'cs_subscription_mode_1',
          mode: 'subscription',
          payment_status: 'paid',
          amount_total: 2900,
          currency: 'usd',
          customer_email: 'buyer@example.com',
          metadata: { offer_key: 'pro_monthly' },
        },
      },
    })
    const response = await postWebhook()

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ received: true })
    // No review-purchase branch side effects: no purchases row, no sale alert.
    expect(insertCount('INSERT INTO purchases')).toBe(0)
    expect(poolQueryMock).not.toHaveBeenCalled()
    expect(execFileMock).not.toHaveBeenCalled()
    expect(welcomeMock).not.toHaveBeenCalled()
    // No subscription lifecycle writes either - those belong to
    // customer.subscription.* events, not checkout.session.completed.
    expect(subWrites).toHaveLength(0)
  })

  it('writes nothing for an unknown price and pages ops exactly once through the outbox', async () => {
    mockConstructEvent(makeSubscriptionEvent({
      data: {
        object: {
          id: SUB_ID,
          customer: CUSTOMER_ID,
          status: 'active',
          cancel_at_period_end: false,
          items: {
            data: [{ price: { id: UNKNOWN_PRICE, unit_amount: 1200 }, current_period_start: 1755000000, current_period_end: 1757592000 }],
          },
        },
      },
    }))
    const response = await postWebhook()

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ received: true, unknown_price: true })
    // Zero subscription or provisioning writes of any kind.
    expect(connectMock).not.toHaveBeenCalled()
    expect(poolQueryMock).not.toHaveBeenCalled()
    expect(clientQueryMock).not.toHaveBeenCalled()
    expect(subWrites).toHaveLength(0)
    expect(welcomeMock).not.toHaveBeenCalled()
    // Exactly one durable ops alert with the billing prefix.
    const enqueues = (global.fetch as jest.Mock).mock.calls.filter((call) =>
      String(call[0]).includes('/api/outbox/enqueue'),
    )
    expect(enqueues).toHaveLength(1)
    const body = JSON.parse(String(enqueues[0][1].body))
    expect(body.payload.subject).toMatch(/^\[billing\] unknown price/)
    expect(body.payload.subject).toContain(SUB_ID)
  })
})
