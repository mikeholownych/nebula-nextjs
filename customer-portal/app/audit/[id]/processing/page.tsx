'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui'
import { pushWithViewTransition } from '../../_lib/view-transition'
import posthog from '@/app/lib/posthog-browser'
import { analyticsHeaders, auditAttemptIdFor } from '@/app/lib/client-analytics'

const STATUS_MESSAGES = [
  { message: 'Scanning page structure...', duration: 2000 },
  { message: 'Analyzing conversion elements...', duration: 2000 },
  { message: 'Checking trust signals...', duration: 2000 },
  { message: 'Measuring load performance...', duration: 2000 },
  { message: 'Generating findings...', duration: 2000 },
]

export default function ProcessingPage() {
  const params = useParams()
  const router = useRouter()
  const auditId = params.id as string

  const [progress, setProgress] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)
  const [status, setStatus] = useState<'processing' | 'ready' | 'error'>('processing')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')

  useEffect(() => {
    // Simulate progress animation. Stepped coarsely (10 ticks, not 50) and
    // driven by `transform: scaleX()` rather than `width` in the JSX below -
    // width changes force a layout recalc on every tick; transform is
    // compositor-only, so this scales to slow/low-end mobile without jank.
    const totalDuration = STATUS_MESSAGES.reduce((sum, m) => sum + m.duration, 0)
    const steps = 10
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          posthog.capture('audit_ready', { audit_id: auditId })
          setStatus('ready')
          return 100
        }
        return prev + 100 / steps
      })
    }, totalDuration / steps)

    // Cycle through messages
    const messageTimeouts: NodeJS.Timeout[] = []

    STATUS_MESSAGES.forEach((_, index) => {
      if (index > 0) {
        const timeout = setTimeout(() => {
          setMessageIndex(index)
        }, STATUS_MESSAGES.slice(0, index).reduce((sum, m) => sum + m.duration, 0))
        messageTimeouts.push(timeout)
      }
    })

    return () => {
      clearInterval(progressInterval)
      messageTimeouts.forEach(clearTimeout)
    }
  }, [])

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

      // Cookie is now set - redirect to results page (no ?unlocked query param needed)
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

  // Logged-in workspace user: skip the email capture step entirely. The audit
  // was already started with their workspace email, so unlock with it and
  // route straight to the full report. If unlock fails, fall back to the form.
  useEffect(() => {
    if (status !== 'ready' || autoUnlocking) return

    // Resolve identity from the server-validated session, not localStorage.
    // localStorage identity state is not authoritative and is absent for
    // workspace users who never visited the Lab page.
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

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="h-3 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full w-full origin-left rounded-full bg-accent transition-transform duration-1000 ease-linear"
                  style={{ transform: `scaleX(${progress / 100})` }}
                />
              </div>
              <p className="mt-2 text-sm text-fg-muted">{Math.round(progress)}% complete</p>
            </div>

            {/* Status Message */}
            <div className="min-h-[2rem]">
              <p className="text-lg text-fg animate-pulse">
                {STATUS_MESSAGES[messageIndex].message}
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
              We couldn't complete your audit. Please try again.
            </p>
            <button
              onClick={() => router.push('/audit')}
              className="rounded bg-accent px-6 py-3 font-semibold text-bg transition-colors hover:opacity-85 hover:bg-accent"
            >
              Try Again
            </button>
          </Card>
        )}
      </div>
    </main>
  )
}
