/**
 * Audit status polling controller.
 *
 * Extracted from the processing page so the terminal-state state machine
 * (D2: give up on invalid/expired/unreachable audits; D4: stop polling at
 * terminal states) can be tested deterministically without rendering React
 * in jsdom, where final-commit flushing proved unreliable.
 *
 * All timing/scheduling is injectable; defaults match production behavior.
 */

export const DEFAULT_POLL_INTERVAL_MS = 1_500

/** Consecutive failed polls before the UI gives up with a terminal error. */
export const DEFAULT_MAX_CONSECUTIVE_FAILURES = 20

export type AuditPollEvent =
  | { kind: 'completed' }
  | { kind: 'failed' }
  | { kind: 'not_found' }
  | { kind: 'unreachable' }

export interface AuditStatusPoller {
  /** Starts polling immediately, then on the schedule interval. Idempotent. */
  start(): void
  /** Stops all timers. Safe to call repeatedly. */
  stop(): void
  /** True once a terminal event fired or stop() was called. */
  readonly stopped: boolean
}

export interface ScheduleFunctions {
  setInterval: (fn: () => void, ms: number) => unknown
  clearInterval: (handle: unknown) => void
}

const realSchedule: ScheduleFunctions = {
  setInterval: (fn, ms) => setInterval(fn, ms),
  clearInterval: (handle) => clearInterval(handle as ReturnType<typeof setInterval>),
}

export function createAuditStatusPoller(
  fetchImpl: typeof fetch,
  auditId: string,
  onEvent: (event: AuditPollEvent) => void,
  options: {
    intervalMs?: number
    maxConsecutiveFailures?: number
    schedule?: ScheduleFunctions
  } = {},
): AuditStatusPoller {
  const intervalMs = options.intervalMs ?? DEFAULT_POLL_INTERVAL_MS
  const maxConsecutiveFailures =
    options.maxConsecutiveFailures ?? DEFAULT_MAX_CONSECUTIVE_FAILURES
  const schedule = options.schedule ?? realSchedule

  let stopped = false
  let handle: unknown
  let consecutiveFailures = 0

  const finish = (event: AuditPollEvent) => {
    if (stopped) return
    stopped = true
    schedule.clearInterval(handle)
    onEvent(event)
  }

  const poll = async () => {
    if (stopped) return
    let res: Response
    try {
      res = await fetchImpl(`/api/audit/${auditId}/status`, { cache: 'no-store' })
    } catch {
      registerFailure()
      return
    }
    if (stopped) return
    if (res.status === 404 || res.status === 410) {
      finish({ kind: 'not_found' })
      return
    }
    if (!res.ok) {
      registerFailure()
      return
    }
    try {
      const body = (await res.json()) as { status?: string }
      if (stopped) return
      if (body.status === 'completed') finish({ kind: 'completed' })
      else if (body.status === 'failed') finish({ kind: 'failed' })
      else consecutiveFailures = 0
    } catch {
      registerFailure()
    }
  }

  function registerFailure() {
    if (stopped) return
    consecutiveFailures += 1
    if (consecutiveFailures >= maxConsecutiveFailures) {
      finish({ kind: 'unreachable' })
    }
  }

  return {
    get stopped() {
      return stopped
    },
    start() {
      if (stopped) return
      void poll()
      handle = schedule.setInterval(() => {
        void poll()
      }, intervalMs)
    },
    stop() {
      if (stopped) return
      stopped = true
      schedule.clearInterval(handle)
    },
  }
}
