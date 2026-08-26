'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui'
import { pushWithViewTransition } from '../../_lib/view-transition'
import posthog from '@/app/lib/posthog-browser'
import { analyticsHeaders, auditAttemptIdFor } from '@/app/lib/client-analytics'
import { createAuditStatusPoller } from '@/app/lib/audit-status-poller'

const WORKER_MESSAGES: Record<'pending' | 'running', string> = {
  pending: 'Audit accepted - worker is analyzing your page',
  running: 'Worker is analyzing your page',
}

export default function ProcessingPage() {
  const params = useParams()
  const router = useRouter()
  const auditId = params.id as string

  const [workerStatus, setWorkerStatus] = useState<'pending' | 'running'>('pending')
  const [status, setStatus] = useState<'processing' | 'ready' | 'error' | 'not_found'>('processing')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')

  useEffect(() => {
    let cancelled = false

    const poller = createAuditStatusPoller(fetch, auditId, (event) => {
      if (cancelled) return
      switch (event.kind) {
        case 'completed':
          posthog.capture('audit_ready', { audit_id: auditId })
          setStatus('ready')
          break
        case 'failed':
          setStatus('error')
          break
        case 'not_found':
          setStatus('not_found')
          break
        case 'unreachable':
          setStatus('error')
          break
      }
    }, {
      onProgress: (s) => {
        if (!cancelled) setWorkerStatus(s)
      },
    })
    poller.start()

    return () => {
      cancelled = true
      poller.stop()
    }
  }, [auditId])

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [autoUnlocking, setAutoUnlocking] = useState(false)

  const doUnlock = async (email: string, name?: string) => {
    setSubmitting(true)
    setSubmitError(null)

    const auditAttemptId = auditAttemptIdFor(auditId)

    posthog.capture('audit_email_submitted', {
      audit_id: auditId,
      audit_attempt_id: auditAttemptId,
      has_name: Boolean(name),
    })

    try {
      const res = await fetch('/api/audit/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...analyticsHeaders(),
        },
        body: JSON.stringify({
          audit_id: auditId,
          email,
          name: name || undefined,
          audit_attempt_id: auditAttemptId ?? undefined,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error ?? 'Could not unlock results')
      }
      if (typeof data.analytics_person_id === 'string') {
        posthog.identify(data.analytics_person_id)
      }

      pushWithViewTransition(router, `/audit/${auditId}/results`)
      return true
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      posthog.captureException(error)
      setSubmitError(error.message)
      return false
    } finally {
      setSubmitting(false)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || submitting) return
    await doUnlock(email, name)
  }

  // Logged-in workspace user: resolve identity server-side, skip the email step.
  useEffect(() => {
    if (status !== 'ready' || autoUnlocking) return

    let cancelled = false
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return null
        const user = await response.json()
        return typeof user?.email === 'string' ? user.email : null
      })
      .then((wsEmail) => {
        if (cancelled || !wsEmail) return
        setAutoUnlocking(true)
        void doUnlock(wsEmail).then((ok) => {
          if (!ok) setAutoUnlocking(false)
        })
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [status])

  return (
    <main id="main-content" className="min-h-screen bg-bg px-6 py-12 pt-24">
      <div className="mx-auto max-w-xl">
        {status === 'processing' && (
          <Card variant="elevated" className="text-center">
            <h1 className="mb-6 text-2xl font-bold text-fg">
              Analyzing Your Page
            </h1>

            {/* Indeterminate progress - driven by real worker state, not a timer */}
            <div className="mb-6">
              <div className="h-3 w-full overflow-hidden rounded-full bg-border">
                <div className="h-full w-full origin-left rounded-full bg-accent animate-pulse" />
              </div>
              <p className="mt-2 text-sm text-fg-muted">
                {WORKER_MESSAGES[workerStatus]}
              </p>
            </div>
          </Card>
        )}

        {status === 'ready' && autoUnlocking && (
          <Card variant="elevated" className="vt-audit-card finding-reveal text-center">
            <div className="mb-4 text-5xl finding-reveal" style={{ animationDelay: '120ms' }}>🔓</div>
            <h1 className="mb-2 text-2xl font-bold text-fg">
              Your Audit Is Ready
            </h1>
            <p className="mb-6 text-fg-muted">
              Unlocking your full report…
            </p>
            <div className="mx-auto h-1.5 w-48 overflow-hidden rounded-full bg-border">
              <div className="h-full w-full origin-left animate-pulse rounded-full bg-accent" />
            </div>
          </Card>
        )}

        {status === 'ready' && !autoUnlocking && (
          <Card variant="elevated" className="vt-audit-card finding-reveal text-center">
            <div className="mb-4 text-5xl finding-reveal" style={{ animationDelay: '120ms' }}>✓</div>
            <h1 className="mb-2 text-2xl font-bold text-fg">
              Your Audit Is Ready
            </h1>
            <p className="mb-6 text-fg-muted">
              Enter your email to receive the full detailed report
            </p>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-1 block text-left text-sm font-medium text-fg">
                  Name (optional)
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-1 block text-left text-sm font-medium text-fg">
                  Email (required)
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <button
                type="submit"
                disabled={!email || submitting}
                className="w-full rounded bg-accent px-6 py-3 font-semibold text-bg transition-colors hover:opacity-85 hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending...' : 'Send Full Results'}
              </button>
              {submitError && (
                <p className="text-sm text-danger text-center" role="alert">{submitError}</p>
              )}
            </form>

            <button
              onClick={() => {
                posthog.capture('audit_email_skipped', { audit_id: auditId })
                pushWithViewTransition(router, `/audit/${auditId}/results`)
              }}
              className="mt-4 text-sm text-accent hover:underline"
            >
              View preview now →
            </button>
          </Card>
        )}

        {status === 'error' && (
          <Card variant="elevated" className="text-center">
            <div className="mb-4 text-5xl">⚠️</div>
            <h1 className="mb-2 text-2xl font-bold text-fg">
              Something Went Wrong
            </h1>
            <p className="mb-6 text-fg-muted">
              We couldn&apos;t complete your audit. Please try again.
            </p>
            <button
              onClick={() => router.push('/audit')}
              className="rounded bg-accent px-6 py-3 font-semibold text-bg transition-colors hover:opacity-85 hover:bg-accent"
            >
              Try Again
            </button>
          </Card>
        )}

        {status === 'not_found' && (
          <Card variant="elevated" className="text-center">
            <div className="mb-4 text-5xl">🔍</div>
            <h1 className="mb-2 text-2xl font-bold text-fg">
              Audit Not Found
            </h1>
            <p className="mb-6 text-fg-muted">
              This audit link is invalid or has expired. Run a fresh audit to
              get results in under two minutes.
            </p>
            <button
              onClick={() => router.push('/audit')}
              className="rounded bg-accent px-6 py-3 font-semibold text-bg transition-colors hover:opacity-85 hover:bg-accent"
            >
              Run a New Audit
            </button>
          </Card>
        )}
      </div>
    </main>
  )
}
