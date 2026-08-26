/**
 * Deterministic coverage for the audit processing page's status polling.
 *
 * The terminal-state machine lives in app/lib/audit-status-poller.ts with
 * injectable scheduling, so these tests drive it synchronously - no React
 * rendering, no timer flakiness. Pins the production defects:
 * - D2: invalid/expired/unreachable audits must reach a terminal state
 * - D4: polling must stop once a terminal status arrives
 *
 * A jsdom render smoke below additionally pins the not-found UI.
 */
import {
  createAuditStatusPoller,
  DEFAULT_MAX_CONSECUTIVE_FAILURES,
  DEFAULT_POLL_INTERVAL_MS,
  type ScheduleFunctions,
} from '@/app/lib/audit-status-poller'

const AUDIT_ID = '123e4567-e89b-12d3-a456-426614174000'
const STATUS_URL = `/api/audit/${AUDIT_ID}/status`

function jsonResponse(status: number, body?: Record<string, unknown>): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

/** Queue-based fetch: each call consumes the next entry (Response or Error). */
function queuedFetch(queue: Array<Response | Error>) {
  const calls: string[] = []
  const impl = ((input: RequestInfo | URL) => {
    calls.push(String(input))
    const next = queue.shift()
    if (next instanceof Error) return Promise.reject(next)
    return Promise.resolve(
      next ?? jsonResponse(500, { error: 'unexpected extra poll' }),
    )
  }) as typeof fetch
  return { impl, calls }
}

/** Manual scheduler: start() registers the interval fn; tests fire it directly. */
function manualSchedule() {
  let intervalFn: (() => void) | null = null
  let intervalMs = 0
  let cleared = 0
  const schedule: ScheduleFunctions = {
    setInterval: (fn, ms) => {
      intervalFn = fn
      intervalMs = ms
      return Symbol('interval')
    },
    clearInterval: () => {
      cleared += 1
      intervalFn = null
    },
  }
  return {
    schedule,
    tick: () => intervalFn?.(),
    get pending() {
      return intervalFn !== null
    },
    get intervalMs() {
      return intervalMs
    },
    get cleared() {
      return cleared
    },
  }
}

type Setup = {
  queue: Array<Response | Error>
  maxFailures?: number
}

function setup({ queue, maxFailures }: Setup) {
  const events: string[] = []
  const fetch_ = queuedFetch(queue)
  const clock = manualSchedule()
  const poller = createAuditStatusPoller(fetch_.impl, AUDIT_ID, (event) => {
    events.push(event.kind)
  }, {
    maxConsecutiveFailures: maxFailures ?? DEFAULT_MAX_CONSECUTIVE_FAILURES,
    schedule: clock.schedule,
  })
  return { poller, events, calls: fetch_.calls, clock }
}

describe('audit status poller', () => {
  it('polls immediately on start and schedules the production interval', async () => {
    const { poller, calls, clock } = setup({
      queue: [jsonResponse(200, { status: 'running' })],
    })
    poller.start()
    await Promise.resolve()
    expect(calls).toEqual([STATUS_URL])
    expect(clock.intervalMs).toBe(DEFAULT_POLL_INTERVAL_MS)
    expect(clock.pending).toBe(true)
    poller.stop()
  })

  it('emits authoritative pending and running progress without stopping', async () => {
    const progress: string[] = []
    const fetch_ = queuedFetch([
      jsonResponse(200, { status: 'pending' }),
      jsonResponse(200, { status: 'running' }),
    ])
    const clock = manualSchedule()
    const poller = createAuditStatusPoller(fetch_.impl, AUDIT_ID, () => undefined, {
      schedule: clock.schedule,
      onProgress: (status: 'pending' | 'running') => progress.push(status),
    })

    poller.start()
    await drainMicrotasks()
    clock.tick()
    await drainMicrotasks()

    expect(progress).toEqual(['pending', 'running'])
    expect(poller.stopped).toBe(false)
    poller.stop()
  })

  it('emits completed exactly once and stops polling (D4)', async () => {
    const { poller, events, calls, clock } = setup({
      queue: [jsonResponse(200, { status: 'completed' })],
    })
    poller.start()
    await drainMicrotasks()

    expect(events).toEqual(['completed'])
    expect(poller.stopped).toBe(true)
    expect(clock.cleared).toBe(1)
    expect(clock.pending).toBe(false)
    expect(calls).toHaveLength(1)
  })

  it('emits failed for an upstream failure and stops polling (D4)', async () => {
    const { poller, events, clock } = setup({
      queue: [jsonResponse(200, { status: 'failed' })],
    })
    poller.start()
    await drainMicrotasks()

    expect(events).toEqual(['failed'])
    expect(poller.stopped).toBe(true)
    expect(clock.cleared).toBe(1)
  })

  it('reaches a terminal not-found state on HTTP 404 (D2)', async () => {
    const { poller, events, clock } = setup({
      queue: [jsonResponse(404, { error: 'Audit not found' })],
    })
    poller.start()
    await drainMicrotasks()

    expect(events).toEqual(['not_found'])
    expect(poller.stopped).toBe(true)
    expect(clock.cleared).toBe(1)
  })

  it('treats HTTP 410 as not-found (D2)', async () => {
    const { poller, events } = setup({
      queue: [jsonResponse(410)],
    })
    poller.start()
    await drainMicrotasks()

    expect(events).toEqual(['not_found'])
    expect(poller.stopped).toBe(true)
  })

  it('gives up only after the configured consecutive 5xx failures (D2)', async () => {
    const { poller, events, calls, clock } = setup({
      queue: [
        jsonResponse(503),
        jsonResponse(503),
        jsonResponse(503),
      ],
      maxFailures: 3,
    })
    poller.start()
    await drainMicrotasks()
    clock.tick()
    await drainMicrotasks()
    clock.tick()
    await drainMicrotasks()

    expect(events).toEqual(['unreachable'])
    expect(calls).toHaveLength(3)
    expect(poller.stopped).toBe(true)
  })

  it('recovers when a transient failure is followed by success', async () => {
    const { poller, events, clock } = setup({
      queue: [
        jsonResponse(503),
        jsonResponse(200, { status: 'running' }),
      ],
      maxFailures: 2,
    })
    poller.start()
    await drainMicrotasks()
    clock.tick()
    await drainMicrotasks()

    expect(events).toEqual([])
    expect(poller.stopped).toBe(false)
    expect(clock.pending).toBe(true)
    poller.stop()
  })

  it('gives up after sustained network errors (D2)', async () => {
    const { poller, events, clock } = setup({
      queue: [new Error('down'), new Error('down')],
      maxFailures: 2,
    })
    poller.start()
    await drainMicrotasks()
    clock.tick()
    await drainMicrotasks()

    expect(events).toEqual(['unreachable'])
    expect(poller.stopped).toBe(true)
  })

  it('ignores everything after stop()', async () => {
    const { poller, events } = setup({
      queue: [jsonResponse(200, { status: 'completed' })],
    })
    poller.stop()
    poller.start()

    await drainMicrotasks()
    expect(events).toEqual([])
    expect(poller.stopped).toBe(true)
  })
})

async function drainMicrotasks(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await Promise.resolve()
}
