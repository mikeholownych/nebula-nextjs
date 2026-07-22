'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui'

interface Finding {
  key: string
  label: string
  impact: number
  effort: number
  quadrant: string
  issue: string
  fix: string
}

interface AuditResult {
  audit_id: string | null
  url: string
  status: string
  score: number
  grade: string
  findings: Finding[]
  error?: string
}

// Quick Win is the one positive/actionable signal and gets Signal Emerald;
// the other three quadrants are informational, not "good" or "bad", so they
// share one neutral tone and differentiate by label only.
const QUADRANT_LABELS: Record<string, { label: string; tone: 'accent' | 'neutral' }> = {
  quick_win: { label: 'Quick Win', tone: 'accent' },
  major_project: { label: 'Major Project', tone: 'neutral' },
  strategic: { label: 'Strategic', tone: 'neutral' },
  fill_in: { label: 'Fill-In', tone: 'neutral' },
}

/**
 * Shown after email gate is cleared. Confirms unlock and offers a one-click
 * magic-link so the user can save/revisit their audit from any device.
 * The magic-link offer is soft — there's no paywall attached and skipping
 * has zero friction.
 */
function UnlockConfirmation({ emailSent, email, auditId }: { emailSent: boolean; email: string; auditId: string }) {
  const [magicLinkState, setMagicLinkState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const requestMagicLink = async () => {
    if (!email || magicLinkState !== 'idle') return
    setMagicLinkState('sending')
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setMagicLinkState(res.ok ? 'sent' : 'error')
    } catch {
      setMagicLinkState('error')
    }
  }

  return (
    <Card variant="elevated" className="mt-8">
      <div className="text-center">
        <div className="mb-2 text-3xl">✓</div>
        <h3 className="mb-1 text-lg font-bold text-accent">Full Report Unlocked</h3>
        <p className="mb-5 text-sm text-fg-muted">
          {emailSent
            ? 'The complete report is heading to your inbox now'
            : 'All findings are visible below'}
        </p>
      </div>

      {/* Magic-link offer — only show when we have an email from this session */}
      {email && magicLinkState !== 'sent' && (
        <div className="border-t border-border pt-5 text-center">
          <p className="mb-3 text-sm text-fg-muted">
            Want to revisit this audit later? Get a one-click login link — no password needed.
          </p>
          <button
            onClick={requestMagicLink}
            disabled={magicLinkState === 'sending'}
            className="rounded-lg border border-accent px-5 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
          >
            {magicLinkState === 'sending' ? 'Sending…' :
             magicLinkState === 'error'   ? 'Try again' :
             'Email me a login link'}
          </button>
        </div>
      )}

      {magicLinkState === 'sent' && (
        <div className="border-t border-border pt-5 text-center">
          <p className="text-sm text-fg-muted">
            Login link sent to <strong className="text-fg">{email}</strong> — check your inbox.
          </p>
        </div>
      )}

      {/* Share link — always shown after unlock */}
      <div className="border-t border-border pt-5 flex items-center justify-between gap-4">
        <p className="text-sm text-fg-muted">
          Send this report to your developer or agency
        </p>
        <ShareButton auditId={auditId} />
      </div>
    </Card>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _UnlockConfirmationWrapper({ emailSent, email, auditId }: { emailSent: boolean; email: string; auditId: string }) {
  return <UnlockConfirmation emailSent={emailSent} email={email} auditId={auditId} />
}

interface Props {
  auditId: string
  unlocked: boolean
  sharedView?: boolean
}

/**
 * Fetches the share token from the Next.js proxy route and copies the
 * share URL to the clipboard. Shows progressive states: idle → loading →
 * copied → error. The share URL gives anyone with it read-only access to
 * all findings — no email gate. This is the viral distribution mechanism.
 */
function ShareButton({ auditId }: { auditId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'copied' | 'error'>('idle')
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  const handleShare = async () => {
    if (state === 'loading') return

    // If we already have the URL, just copy again
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl).catch(() => {})
      setState('copied')
      setTimeout(() => setState('idle'), 2500)
      return
    }

    setState('loading')
    try {
      const res = await fetch(`/api/audit/${auditId}/share-token`)
      if (!res.ok) throw new Error('fetch failed')
      const { share_url } = await res.json()
      setShareUrl(share_url)
      await navigator.clipboard.writeText(share_url).catch(() => {})
      setState('copied')
      setTimeout(() => setState('idle'), 2500)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={state === 'loading'}
      className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-fg-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
    >
      {state === 'idle'    && <><span>↗</span> Share this report</>}
      {state === 'loading' && <><span className="animate-spin">⋯</span> Getting link…</>}
      {state === 'copied'  && <><span>✓</span> Link copied</>}
      {state === 'error'   && <><span>✗</span> Try again</>}
    </button>
  )
}

export default function ResultsClient({ auditId, unlocked: initialUnlocked, sharedView: _sharedView = false }: Props) {
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<AuditResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Client-side unlock state — starts from server-determined value but can
  // be updated after a successful inline email submission.
  const [unlocked, setUnlocked] = useState(initialUnlocked)

  const [emailForm, setEmailForm] = useState({ email: '', name: '' })
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(auditId)

        if (isUuid) {
          const response = await fetch(`/api/audit/${auditId}`)
          if (!response.ok) throw new Error('Failed to fetch audit')
          setResults(await response.json())
        } else {
          // Legacy: run new audit from URL in path
          const response = await fetch('/api/audit/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: decodeURIComponent(auditId),
              email: 'results@example.com',
            }),
          })
          if (!response.ok) throw new Error('Failed to fetch results')
          setResults(await response.json())
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [auditId])

  const sendEmail = async () => {
    if (!emailForm.email || !results) return

    setSendingEmail(true)
    setEmailError(null)

    try {
      const response = await fetch('/api/audit/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audit_id: auditId,
          email: emailForm.email,
          name: emailForm.name || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error ?? 'Could not unlock results')
      }

      setEmailSent(true)
      setUnlocked(true)
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSendingEmail(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-bg px-6 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <div className="animate-pulse text-2xl text-fg-muted">Loading results...</div>
        </div>
      </main>
    )
  }

  if (error || !results) {
    return (
      <main className="min-h-screen bg-bg px-6 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <Card variant="elevated">
            <h1 className="mb-4 text-2xl font-bold text-fg">Error Loading Results</h1>
            <p className="text-fg-muted">{error || 'Unknown error'}</p>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-fg">
            Landing Page Audit Results
          </h1>
          <p className="text-fg-muted">
            {new URL(results.url).hostname}
          </p>
        </div>

        {/* Score Card */}
        <Card variant="elevated" className="vt-audit-card mb-8 text-center">
          <div className="mb-4">
            <span className="text-6xl font-bold text-accent">
              {results.score.toFixed(1)}
            </span>
            <span className="text-3xl text-fg-muted">/10</span>
          </div>
          <div className="mb-4">
            <span className={`inline-block rounded-full px-4 py-1 text-lg font-semibold ${
              results.grade === 'A' || results.grade === 'B' ? 'bg-accent text-bg' :
              results.grade === 'C' ? 'bg-warning text-bg' :
              'bg-danger text-bg'
            }`}>
              Grade: {results.grade}
            </span>
          </div>
          <p className="text-sm text-fg-muted">
            Evidence-backed assessment of conversion potential
          </p>
        </Card>

        {/* Findings */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-fg">Key Findings</h2>

          {results.findings.map((finding, index) => (
            <Card
              key={finding.key}
              variant="bordered"
              className="finding-reveal relative overflow-hidden"
              style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
            >
              <div>
                <div className="mb-2 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-fg">{finding.label}</h3>
                    <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      QUADRANT_LABELS[finding.quadrant]?.tone === 'accent'
                        ? 'bg-accent/10 text-accent'
                        : 'bg-fg-muted/10 text-fg-muted'
                    }`}>
                      {QUADRANT_LABELS[finding.quadrant]?.label || finding.quadrant}
                    </span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="rounded bg-accent/10 px-2 py-1 text-accent">
                      Impact: {finding.impact}/10
                    </span>
                    <span className="rounded bg-fg-muted/10 px-2 py-1 text-fg-muted">
                      Effort: {finding.effort}/10
                    </span>
                  </div>
                </div>

                {unlocked || index < 2 ? (
                  <div className="space-y-2 text-sm">
                    <p className="text-fg-muted">
                      <strong>Issue:</strong> {finding.issue}
                    </p>
                    <p className="text-fg">
                      <strong>Fix:</strong> {finding.fix}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-fg-muted blur-sm select-none">
                      {finding.issue}
                    </p>
                    <span className="text-xs text-accent">Share email to unlock</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Email gate — shown only when not yet unlocked */}
        {!unlocked && !emailSent && (
          <Card variant="elevated" className="mt-8">
            <h3 className="mb-2 text-center text-lg font-bold text-fg">
              Unlock All {results.findings.length} Findings
            </h3>
            <p className="mb-4 text-center text-fg-muted">
              Enter your email to see every finding — plus receive the full report in your inbox
            </p>

            <div className="space-y-3">
              <input
                type="email"
                placeholder="Your email address"
                value={emailForm.email}
                onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                className="w-full rounded-lg border border-fg-muted/30 bg-bg px-4 py-2 text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
              />
              <input
                type="text"
                placeholder="Your name (optional)"
                value={emailForm.name}
                onChange={(e) => setEmailForm({ ...emailForm, name: e.target.value })}
                className="w-full rounded-lg border border-fg-muted/30 bg-bg px-4 py-2 text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
              />
              <button
                onClick={sendEmail}
                disabled={!emailForm.email || sendingEmail}
                className="w-full rounded-xl bg-accent px-6 py-3 font-semibold text-bg transition-colors hover:bg-accent-light disabled:opacity-50"
              >
                {sendingEmail ? 'Unlocking...' : 'Unlock Full Report'}
              </button>
              {emailError && (
                <p className="text-sm text-danger text-center" role="alert">{emailError}</p>
              )}
            </div>
          </Card>
        )}

        {(emailSent || unlocked) && (
          <UnlockConfirmation emailSent={emailSent} email={emailForm.email} auditId={auditId} />
        )}

        {/* Upsells */}
        <div className="mt-12 space-y-6">
          <h2 className="text-center text-xl font-bold text-fg">
            Want Help Implementing These Fixes?
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card variant="bordered" className="relative overflow-hidden">
              <div className="p-4">
                <h3 className="mb-1 font-bold text-fg">Audit Lite</h3>
                <p className="mb-2 text-2xl font-bold text-accent">$7</p>
                <p className="mb-4 text-sm text-fg-muted">Top 3 prioritized fixes you can do today</p>
                <a
                  href="https://buy.stripe.com/aFacN55E0cf2fupafM43S0e"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-lg bg-accent px-4 py-2 text-center font-semibold text-bg transition-colors hover:bg-accent-light"
                >
                  Get Started
                </a>
              </div>
            </Card>

            <Card variant="bordered" className="relative overflow-hidden border-accent">
              <div className="absolute right-2 top-2 rounded bg-accent px-2 py-0.5 text-xs font-semibold text-bg">
                POPULAR
              </div>
              <div className="p-4">
                <h3 className="mb-1 font-bold text-fg">Implementation Session</h3>
                <p className="mb-2 text-2xl font-bold text-accent">$97</p>
                <p className="mb-4 text-sm text-fg-muted">We fix every finding from this audit — rewritten copy, rebuilt sections, live in 48 hours</p>
                <a
                  href="https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-lg bg-accent px-4 py-2 text-center font-semibold text-bg transition-colors hover:bg-accent-light"
                >
                  Fix My Page — $97
                </a>
              </div>
            </Card>

            <Card variant="bordered" className="relative overflow-hidden">
              <div className="p-4">
                <h3 className="mb-1 font-bold text-fg">Done-For-You</h3>
                <p className="mb-2 text-2xl font-bold text-accent">$1,497</p>
                <p className="mb-4 text-sm text-fg-muted">Complete rebuild + 30-day monitoring + guarantee</p>
                <a
                  href="https://buy.stripe.com/7sY28r8Qcfregytew243S0g"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-lg bg-accent px-4 py-2 text-center font-semibold text-bg transition-colors hover:bg-accent-light"
                >
                  Get Started
                </a>
              </div>
            </Card>
          </div>
        </div>

        {/* Pass it forward — referral moment #1 */}
        {(emailSent || unlocked) && (
          <Card variant="bordered" className="mt-8 border-accent/30">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-fg">Know another founder with the same problem?</p>
                <p className="mt-1 text-sm text-fg-muted">
                  Forward their site for a free audit — takes 60 seconds. The report names the exact leaks, same as yours.
                </p>
              </div>
              <a
                href="/audit"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg border border-accent px-5 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
              >
                Send them an audit ↗
              </a>
            </div>
          </Card>
        )}

        {/* Priority Matrix Legend */}
        <div className="mt-8 text-center">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-fg-muted">
            Priority Matrix
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {Object.entries(QUADRANT_LABELS).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${value.tone === 'accent' ? 'bg-accent' : 'bg-fg-muted'}`} />
                <span className="text-sm text-fg-muted">{value.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
