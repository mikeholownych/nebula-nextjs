'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui'
import posthog from '@/app/lib/posthog-browser'
import { parseAuditResult, type AuditResult, type Finding } from './auditResultSchema'
import { getDisease, diseaseTierClass, complexityBadge, extractSerpData } from './diseases'
import { REPAIR_SPRINT_OFFER } from '@/app/lib/repair-sprint-offer'
import {
  REPORT_NAVIGATION,
  buildPriorityQueue,
  findingSeverity,
  groupFindingsBySignal,
  summarizeFindings,
} from './reportArchitecture'

// Quick Win is the one positive/actionable signal and gets Signal Emerald;
// the other three quadrants are informational, not "good" or "bad\", so they
// share one neutral tone and differentiate by label only.
const QUADRANT_LABELS: Record<string, { label: string; tone: 'accent' | 'neutral' }> = {
  quick_win: { label: 'Quick Win', tone: 'accent' },
  major_project: { label: 'Major Project', tone: 'neutral' },
  strategic: { label: 'Strategic', tone: 'neutral' },
  fill_in: { label: 'Fill-In', tone: 'neutral' },
}

/**
 * Returns a single copy-paste-ready line from the worst finding.
 * Format: "[DISEASE/LABEL] — {measured value} | Fix: {fix}"
 * Uses CSS selector when available so a dev can jump to it in DevTools.
 * Falls back to the plain issue text when no evidence is present.
 */
function getWorstOffenderSnippet(findings: Finding[]): string | null {
  if (!findings.length) return null
  const worst = [...findings].sort((a, b) => b.impact - a.impact)[0]
  const disease = getDisease(worst.key)
  const displayName = disease ? disease.name : worst.label

  const measured = worst.evidence?.measured
  const selector = worst.evidence?.selector && worst.evidence.selector !== 'N/A'
    ? ` → ${worst.evidence.selector}`
    : ''
  const measured50 = measured
    ? ` (measured: ${measured.slice(0, 70)}${measured.length > 70 ? '…' : ''})`
    : ''

  return `[${displayName}]${measured50}${selector} - Fix: ${worst.fix.slice(0, 120)}${worst.fix.length > 120 ? '...' : ''}`
}

/**
 * Shows the worst-offender finding as a one-click copy-paste snippet.
 * Designed to be pasted directly into Slack, email, or a GitHub issue.
 * The finding escapes the tool and travels upstream to whoever can fix it.
 */
function SlackSnippet({ findings }: { findings: Finding[] }) {
  const [state, setState] = useState<'idle' | 'copied'>('idle')
  const snippet = getWorstOffenderSnippet(findings)
  if (!snippet) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet)
      setState('copied')
      setTimeout(() => setState('idle'), 2500)
      posthog.capture('slack_snippet_copied')
    } catch {
      // clipboard API may be unavailable in some contexts — silent fail
    }
  }

  return (
    <Card variant="bordered" className="mt-6 border-accent/30">
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-fg">Send to your developer</p>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-fg-muted transition-colors hover:border-accent hover:text-accent"
        >
          {state === 'copied' ? <><span>✓</span> Copied</> : <><span>⎘</span> Copy</>}
        </button>
      </div>
      <pre className="rounded-lg border border-border bg-bg px-4 py-4 font-mono text-xs leading-relaxed text-fg whitespace-pre-wrap break-words">
        {snippet}
      </pre>
      <p className="mt-2 text-xs text-fg-muted">
        Paste into Slack, email, or a GitHub issue — your dev has everything they need.
      </p>
    </Card>
  )
}

// The only place amber (`signal-fail`) appears anywhere on the site.
// Every finding rendered here already represents a dimension that scored

/**
 * FixPreview — shows sentence 1 of the AI fix prompt, blurs the rest.
 * Eye path: problem → partial solution → wall → $97 unlock.
 * The fix field already exists in every finding — no backend change needed.
 */
function FixPreview({ finding, unlocked }: { finding: Finding; unlocked: boolean }) {
  const disease = getDisease(finding.key)
  const fixText = finding.fix
  if (!fixText || fixText.length < 20) return null

  // Split at first sentence boundary — period + space or end of string
  const firstPeriod = fixText.search(/\.\s/)
  const preview = firstPeriod > 20 ? fixText.slice(0, firstPeriod + 1) : fixText.slice(0, Math.min(120, fixText.length))
  const remainder = firstPeriod > 20 ? fixText.slice(firstPeriod + 2) : ''

  if (unlocked || !remainder) {
    // Unlocked: show everything + what the prompt delivers
    return (
      <div className="mt-4 rounded-lg border border-accent/20 bg-accent/5 p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.1em] text-accent">Repair Note</p>
        <p className="text-base leading-7 text-fg">{fixText}</p>
        {disease?.promptDelivers && (
          <p className="mt-2 text-xs text-fg-muted">
            <span className="font-semibold">Delivers:</span> {disease.promptDelivers}
          </p>
        )}
      </div>
    )
  }

  // Locked: show preview + blur
  return (
    <div className="mt-4 rounded-lg border border-border bg-bg/50 p-4">
      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.1em] text-fg-muted">Repair Note</p>
      <p className="text-base leading-7 text-fg">{preview}</p>
      {remainder && (
        <div className="relative mt-1 min-w-0 overflow-hidden">
          <p className="select-none break-words blur-sm text-base leading-7 text-fg-muted pointer-events-none" aria-hidden="true">
            {remainder.slice(0, 160)}
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <a
              href="#unlock"
              onClick={() => posthog.capture('fix_preview_unlock_clicked', { finding_key: finding.key })}
              className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-bg shadow-sm transition-colors hover:bg-accent-light"
            >
              Unlock this audit first
            </a>
          </div>
        </div>
      )}
      {disease?.promptDelivers && (
        <p className="mt-2 text-xs text-fg-muted">
          <span className="font-semibold">Delivers:</span> {disease.promptDelivers}
        </p>
      )}
    </div>
  )
}

/**
 * SerpSnippet — renders a mock Google SERP preview for seo_foundations findings.
 * Uses only data already present in finding.evidence.measured.
 * Left: their actual page (blank/truncated). Right: what a good page looks like.
 */
function SerpSnippet({ finding, url }: { finding: Finding; url: string }) {
  if (finding.key !== 'seo_foundations') return null
  const measured = finding.evidence?.measured
  if (!measured) return null
  const serpData = extractSerpData(measured)
  if (!serpData) return null

  const hostname = (() => { try { return new URL(url).hostname } catch { return url } })()
  const isTruncated = serpData.metaDescChars > 155 || serpData.metaDescChars < 70
  const descBar = serpData.metaDescChars < 70
    ? '░░░░░░░░░░░░░░░░░░░░ (description too short - Google fills in random text)'
    : `(${serpData.metaDescChars} chars - truncated at ~155 in search results)`

  return (
    <div className="mt-4 rounded-lg border border-border bg-bg p-4">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.1em] text-fg-muted">How You Show Up in Google</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Their page — broken */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-danger">Your page now</p>
          <div className="rounded border border-danger/20 bg-danger/5 p-4 font-sans text-sm">
            <p className="text-xs text-fg-muted">{hostname}</p>
            <p className="truncate font-semibold text-blue-400">{serpData.title}</p>
            <p className={`mt-1 text-sm leading-6 ${isTruncated ? 'italic text-fg-muted' : 'text-fg-muted'}`}>
              {descBar}
            </p>
          </div>
        </div>
        {/* What it should look like */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-accent">What searchers click</p>
          <div className="rounded border border-accent/20 bg-accent/5 p-4 font-sans text-sm">
            <p className="text-xs text-fg-muted">{hostname}</p>
            <p className="font-semibold text-blue-400">
              {serpData.title.length > 50 ? serpData.title.slice(0, 50) + '...' : serpData.title} | Brand
            </p>
            <p className="mt-1 text-sm leading-6 text-fg-muted">
              [Your value proposition — who it helps, what it does, one outcome. 120–155 chars fills the full preview and earns the click.]
            </p>
          </div>
        </div>
      </div>
      <p className="mt-2 text-sm leading-6 text-fg-muted">
        This is what searchers see before clicking. The Repair Sprint can rewrite your title and meta description if that's the selected repair.
      </p>
    </div>
  )
}

function FailSignal() {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-2 text-xs font-mono font-semibold uppercase tracking-[0.1em] text-signal-fail"
      aria-label="This conversion signal failed its threshold"
    >
      <span className="h-2 w-2 rounded-full bg-signal-fail" aria-hidden="true" />
      Signal fail
    </span>
  )
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
    posthog.capture('magic_link_requested', { audit_id: auditId })
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
        <h3 className="mb-1 text-2xl font-extrabold text-accent">Full Report Unlocked</h3>
        <p className="mb-5 text-sm text-fg-muted">
          {emailSent
            ? 'The complete report is heading to your inbox now'
            : 'All findings are visible below'}
        </p>
      </div>

      {/* Magic-link offer — only show when we have an email from this session */}
      {email && magicLinkState !== 'sent' && (
        <div className="border-t border-border pt-6 text-center">
          <p className="mb-4 text-sm text-fg-muted">
            Want to revisit this audit later? Get a one-click login link — no password needed.
          </p>
          <button
            onClick={requestMagicLink}
            disabled={magicLinkState === 'sending'}
            className="rounded-lg border border-accent px-6 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
          >
            {magicLinkState === 'sending' ? 'Sending...' :
             magicLinkState === 'error'   ? 'Try again' :
             'Email me a login link'}
          </button>
        </div>
      )}

      {magicLinkState === 'sent' && (
        <div className="border-t border-border pt-6 text-center">
          <p className="text-sm text-fg-muted">
            Login link sent to <strong className="text-fg">{email}</strong> - check your inbox.
          </p>
        </div>
      )}

      {/* Share link — always shown after unlock */}
      <div className="border-t border-border pt-6 flex items-center justify-between gap-4">
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
      className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-fg-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
    >
      {state === 'idle'    && <><span>↗</span> Share this report</>}
      {state === 'loading' && <><span className="animate-spin">⋯</span> Getting link…</>}
      {state === 'copied'  && <><span>✓</span> Link copied</>}
      {state === 'error'   && <><span>✗</span> Try again</>}
    </button>
  )
}

function findingAnchor(finding: Finding): string {
  return `finding-${finding.key.replace(/[^a-z0-9_-]+/gi, '-').toLowerCase()}`
}

function ReportNavigation() {
  return (
    <nav aria-label="Audit report sections" className="sticky top-20 z-20 -mx-6 mb-12 border-y border-border bg-bg/95 px-6 py-4 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-5xl gap-2 overflow-x-auto pb-1 sm:justify-center">
        {REPORT_NAVIGATION.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="min-h-11 shrink-0 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-fg-muted transition-colors hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  )
}

function ReportOverview({ results }: { results: AuditResult }) {
  const summary = summarizeFindings(results.findings)
  const hostname = new URL(results.url).hostname

  return (
    <section id="overview" className="scroll-mt-40 border-b border-border pb-16">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-end">
        <div>
          <p className="text-sm font-semibold text-accent">Audit overview</p>
          <h1 className="mt-2 text-2xl font-extrabold text-fg md:text-4xl md:tracking-[-0.03em]">Landing Page Audit Results</h1>
          <p className="mt-2 break-all text-base text-fg-muted">{hostname}</p>
          <p className="mt-5 max-w-[65ch] text-base leading-8 text-fg-muted">
            The score is the orientation. The queue below is the work: highest-impact conversion leaks first, with measured evidence and implementation effort attached.
          </p>
        </div>

        <Card variant="elevated" className="vt-audit-card">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-fg-muted">Conversion readiness</p>
              <p className="mt-1 tabular-nums">
                <span className="text-6xl font-extrabold text-accent">{results.score.toFixed(1)}</span>
                <span className="text-2xl text-fg-muted">/10</span>
              </p>
              <p className="mt-2 text-sm text-fg-muted">Grade {results.grade} · evidence-backed assessment</p>
            </div>
            <dl className="grid grid-cols-3 gap-6 border-t border-border pt-6 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
              <div>
                <dt className="text-xs text-fg-muted">Critical</dt>
                <dd className="mt-1 text-2xl font-extrabold tabular-nums text-danger">{summary.critical}</dd>
              </div>
              <div>
                <dt className="text-xs text-fg-muted">Warnings</dt>
                <dd className="mt-1 text-2xl font-extrabold tabular-nums text-signal-fail">{summary.warning}</dd>
              </div>
              <div>
                <dt className="text-xs text-fg-muted">Advisory</dt>
                <dd className="mt-1 text-2xl font-extrabold tabular-nums text-fg">{summary.advisory}</dd>
              </div>
            </dl>
          </div>
        </Card>
      </div>
    </section>
  )
}

function FixFirstQueue({ findings }: { findings: Finding[] }) {
  const queue = buildPriorityQueue(findings).slice(0, 3)

  return (
    <section id="fix-first" className="scroll-mt-40 border-b border-border py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-fg">Fix these first</h2>
          <p className="mt-2 max-w-[65ch] text-base leading-7 text-fg-muted">
            Ranked by impact first, then effort. This is the shortest path from diagnosis to a cleaner test.
          </p>
        </div>
        <a href="#remediation" className="min-h-11 shrink-0 rounded-lg bg-accent px-6 py-4 text-sm font-semibold text-bg transition-colors hover:bg-accent-light">
          Get every fix — $97
        </a>
      </div>

      {queue.length > 0 ? (
        <ol className="mt-8 divide-y divide-border border-y border-border">
          {queue.map((finding, index) => (
            <li key={finding.key} className="grid gap-4 py-6 md:grid-cols-[3rem_minmax(0,1fr)_auto] md:items-center">
              <span className="text-2xl font-extrabold tabular-nums text-fg-muted">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-fg">{finding.label}</h3>
                  <span className="rounded-full border border-border px-2 py-1 text-xs font-semibold text-fg-muted">
                    {findingSeverity(finding)}
                  </span>
                </div>
                <p className="mt-2 max-w-[65ch] text-sm leading-6 text-fg-muted">{finding.issue}</p>
              </div>
              <div className="flex items-center gap-4 md:flex-col md:items-end">
                <span className="text-xs tabular-nums text-fg-muted">Impact {finding.impact}/10</span>
                <span className="text-xs tabular-nums text-fg-muted">Effort {finding.effort}/10</span>
                <a href={`#${findingAnchor(finding)}`} className="text-sm font-semibold text-accent hover:text-accent-light">View evidence ↓</a>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-8 border-y border-border py-6 text-fg-muted">No failed conversion signals were returned for this audit.</p>
      )}
    </section>
  )
}

function SignalBreakdown({ findings }: { findings: Finding[] }) {
  const groups = groupFindingsBySignal(findings)
  const statusLabel = {
    critical: 'Critical',
    warning: 'Warning',
    advisory: 'Advisory',
    clear: 'Not flagged',
  } as const

  return (
    <section id="signals" className="scroll-mt-40 border-b border-border py-16">
      <h2 className="text-2xl font-extrabold text-fg">Seven conversion signals</h2>
      <p className="mt-2 max-w-[65ch] text-base leading-7 text-fg-muted">
        A signal marked “Not flagged” means this run returned no failure for that category. It does not claim a conversion lift or replace a controlled experiment.
      </p>
      <div className="mt-8 divide-y divide-border border-y border-border">
        {groups.map((group) => (
          <div key={group.id} className="grid gap-4 py-6 sm:grid-cols-[minmax(0,0.75fr)_minmax(0,1.35fr)_auto] sm:items-center sm:gap-8">
            <h3 className="font-semibold text-fg">{group.label}</h3>
            <p className="text-sm leading-6 text-fg-muted">{group.description}</p>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <span className={`text-xs font-semibold ${
                group.status === 'critical' ? 'text-danger' :
                group.status === 'warning' ? 'text-signal-fail' :
                'text-fg-muted'
              }`}>
                {statusLabel[group.status]}
              </span>
              <span className="min-w-8 text-right text-sm tabular-nums text-fg-muted">{group.findings.length}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function EvidenceMethod({ findings }: { findings: Finding[] }) {
  const withEvidence = findings.filter((finding) => finding.evidence).length
  const definitive = findings.filter((finding) => finding.evidence?.confidence === 'definitive').length

  return (
    <div className="mb-8 grid gap-6 border-y border-border py-6 sm:grid-cols-[minmax(0,1.2fr)_auto] sm:items-center">
      <div>
        <h3 className="font-semibold text-fg">Evidence boundary</h3>
        <p className="mt-2 max-w-[65ch] text-sm leading-6 text-fg-muted">
          Findings report observable page conditions, the required threshold, and the measured gap. They identify repair candidates; they do not claim that a single change caused or guarantees revenue.
        </p>
      </div>
      <dl className="flex gap-8">
        <div>
          <dt className="text-xs text-fg-muted">Measured</dt>
          <dd className="mt-1 text-2xl font-extrabold tabular-nums text-fg">{withEvidence}/{findings.length}</dd>
        </div>
        <div>
          <dt className="text-xs text-fg-muted">Definitive</dt>
          <dd className="mt-1 text-2xl font-extrabold tabular-nums text-fg">{definitive}</dd>
        </div>
      </dl>
    </div>
  )
}

export default function ResultsClient({ auditId, unlocked: initialUnlocked, sharedView = false }: Props) {
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
          setResults(parseAuditResult(await response.json()))
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
          setResults(parseAuditResult(await response.json()))
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

    posthog.identify(emailForm.email, { name: emailForm.name || undefined })
    posthog.capture('audit_email_submitted', { audit_id: auditId, source: 'results_page', has_name: Boolean(emailForm.name) })

    try {
      const response = await fetch('/api/audit/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-POSTHOG-DISTINCT-ID': posthog.get_distinct_id() ?? '',
          'X-POSTHOG-SESSION-ID': posthog.get_session_id() ?? '',
        },
        body: JSON.stringify({
          audit_id: auditId,
          email: emailForm.email,
          name: emailForm.name || undefined,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        const message = typeof data.error === 'string' ? data.error.slice(0, 300) : 'Could not unlock results'
        throw new Error(message)
      }

      setEmailSent(data.email_sent === true)
      setUnlocked(true)
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSendingEmail(false)
    }
  }

  if (loading) {
    return (
      <main id="main-content" className="min-h-screen bg-bg px-6 py-12 pt-24">
        <div className="mx-auto max-w-5xl">
          {/* Skeleton nav */}
          <div className="sticky top-20 z-20 -mx-6 mb-12 border-y border-border bg-bg/95 px-6 py-4">
            <div className="flex gap-2">
              {[80, 96, 72, 88, 104].map((w) => (
                <div key={w} className="h-9 animate-pulse rounded-lg bg-bg-muted/40" style={{ width: w }} />
              ))}
            </div>
          </div>
          {/* Skeleton score card */}
          <div className="mb-12 grid gap-8 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="h-4 w-24 animate-pulse rounded bg-bg-muted/40" />
              <div className="h-10 w-48 animate-pulse rounded bg-bg-muted/40" />
              <div className="h-4 w-32 animate-pulse rounded bg-bg-muted/40" />
            </div>
            <div className="h-36 animate-pulse rounded-xl bg-bg-muted/40" />
          </div>
          {/* Skeleton finding rows */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-4 h-24 animate-pulse rounded-xl bg-bg-muted/40" />
          ))}
        </div>
      </main>
    )
  }

  if (error || !results) {
    return (
      <main id="main-content" className="min-h-screen bg-bg px-6 py-12 pt-24">
        <div className="mx-auto max-w-2xl text-center">
          <Card variant="elevated">
            <h1 className="mb-4 text-2xl font-extrabold text-fg">Error Loading Results</h1>
            <p className="text-fg-muted">{error || 'Unknown error'}</p>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main id="main-content" className="min-h-screen bg-bg px-6 py-12 pt-24">
      <div className="mx-auto max-w-5xl">
        <ReportNavigation />
        <ReportOverview results={results} />
        <FixFirstQueue findings={results.findings} />
        <SignalBreakdown findings={results.findings} />

        <section id="evidence" className="scroll-mt-40 py-16">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-fg">Evidence-backed findings</h2>
            <p className="mt-2 max-w-[65ch] text-base leading-7 text-fg-muted">
              Each finding connects an observable page condition to the expected threshold, the measured delta, and a bounded repair.
            </p>
          </div>
          <EvidenceMethod findings={results.findings} />

          <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-extrabold text-fg">All findings</h3>
              <p className="mt-1 text-xs text-fg-muted">
                {results.findings.length} failed signal{results.findings.length === 1 ? '' : 's'} returned by this audit
              </p>
            </div>
            <span className="text-sm tabular-nums text-fg-muted">Impact × effort ranked</span>
          </div>

          {results.findings.map((finding, index) => {
            const disease = getDisease(finding.key)
            return (
            <div key={finding.key} id={findingAnchor(finding)} className="scroll-mt-40">
            <Card
              variant="bordered"
              className="finding-reveal relative overflow-hidden"
              style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
            >
              <div>
                <div className="mb-2 flex items-start justify-between gap-4">
                  <div>
                    {/* Disease name badge — shown when the key is in our disease map */}
                    {disease && (
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-extrabold ${diseaseTierClass(disease.tier)}`}>
                          ⚕ {disease.name}
                        </span>
                      </div>
                    )}
                    <h3 className="font-semibold text-fg">{finding.label}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                        QUADRANT_LABELS[finding.quadrant]?.tone === 'accent'
                          ? 'bg-accent/10 text-accent'
                          : 'bg-fg-muted/10 text-fg-muted'
                      }`}>
                        {QUADRANT_LABELS[finding.quadrant]?.label || finding.quadrant}
                      </span>
                      <FailSignal />
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs tabular-nums">
                    <span className="rounded bg-accent/10 px-2 py-1 text-accent">
                      Impact: {finding.impact}/10
                    </span>
                    <span className="rounded bg-fg-muted/10 px-2 py-1 text-fg-muted">
                      Effort: {finding.effort}/10
                    </span>
                  </div>
                </div>

                {/* Disease symptom line — plain English, no jargon */}
                {disease && (
                  <p className="mb-2 text-base leading-7 italic text-fg-muted">
                    {disease.symptom}
                  </p>
                )}

                {unlocked || index < 2 ? (
                  <div className="mt-4 space-y-2 text-base leading-7">
                    {/* Fix complexity badge — collapses "I'll do it myself" objection */}
                    {disease && (() => {
                      const badge = complexityBadge(disease.complexity)
                      return (
                        <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${badge.class}`}>
                          {badge.label}
                        </span>
                      )
                    })()}
                    <p className="text-fg-muted">
                      <strong>Issue:</strong> {finding.issue}
                    </p>

                    {/* SERP snippet — only for seo_foundations, uses scraped data */}
                    <SerpSnippet finding={finding} url={results.url} />

                    {/* Fix Preview — sentence 1 free, rest locked behind $97 */}
                    <FixPreview finding={finding} unlocked={unlocked} />

                    {/* Evidence block — shown when audit engine provides measurement data */}
                    {finding.evidence && (
                      <details className="mt-4 group">
                        <summary className="flex cursor-pointer items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-fg-muted hover:text-fg">
                          {/* Confidence is a neutral fact about the evidence, not a good/bad
                              signal — deliberately grayscale so it never competes with the
                              one reserved amber marker (FailSignal) for the visitor's attention. */}
                          <span className={`inline-block h-2 w-2 rounded-full ${
                            finding.evidence.confidence === 'definitive' ? 'bg-fg' :
                            finding.evidence.confidence === 'high'       ? 'bg-fg-muted' :
                            finding.evidence.confidence === 'contextual' ? 'bg-fg-dim' :
                            'bg-fg-muted/40'
                          }`} />
                          Evidence
                          <span className={`ml-auto rounded px-2 py-1 text-xs font-semibold ${
                            finding.evidence.confidence === 'definitive' ? 'bg-fg/10 text-fg' :
                            finding.evidence.confidence === 'high'       ? 'bg-fg-muted/10 text-fg-muted' :
                            'bg-fg-dim/10 text-fg-dim'
                          }`}>
                            {finding.evidence.confidence}
                          </span>
                        </summary>
                        <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 ease-out group-open:grid-rows-[1fr]">
                          <div className="overflow-hidden">
                            <div className="mt-2 rounded-lg border border-border bg-bg p-4 font-mono text-xs leading-relaxed text-fg-muted space-y-2">
                              <div><span className="text-fg-muted">measured  </span><span className="text-fg">{finding.evidence.measured}</span></div>
                              <div><span className="text-fg-muted">required  </span><span className="text-fg">{finding.evidence.required}</span></div>
                              <div><span className="text-fg-muted">delta     </span><span className="text-accent">{finding.evidence.delta}</span></div>
                              {finding.evidence.selector !== 'N/A' && (
                                <div><span className="text-fg-muted">selector  </span><code className="text-fg-muted">{finding.evidence.selector}</code></div>
                              )}
                              <div className="pt-1 border-t border-border/50 text-fg-muted text-xs">{finding.evidence.timestamp}</div>
                            </div>
                          </div>
                        </div>
                      </details>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    {/* Complexity badge always visible — collapses objection even before unlock */}
                    {disease && (() => {
                      const badge = complexityBadge(disease.complexity)
                      return (
                        <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${badge.class}`}>
                          {badge.label}
                        </span>
                      )
                    })()}
                    <div className="flex items-center justify-between">
                      <p className="text-fg-muted blur-sm select-none">
                        {finding.issue}
                      </p>
                      <span className="text-xs text-accent shrink-0 ml-2">Share email to unlock</span>
                    </div>
                    {/* Teaser fix preview — always visible, drives unlock desire */}
                    <FixPreview finding={finding} unlocked={false} />
                  </div>
                )}
              </div>
            </Card>
            </div>
            )
          })}
          </div>

        {/* Slack snippet — shown after unlock; helps the finding escape the tool */}
        {unlocked && results.findings.length > 0 && (
          <SlackSnippet findings={results.findings} />
        )}
        </section>

        {/* Email gate — shown only when not yet unlocked */}
        {!unlocked && !emailSent && (
          <Card variant="elevated" className="mt-8">
            <h3 className="mb-2 text-center text-2xl font-extrabold text-fg">
              Unlock All {results.findings.length} Findings
            </h3>
            <p className="mb-4 text-center text-fg-muted">
              Enter your email to see every finding — plus receive the full report in your inbox
            </p>

            <div className="space-y-4">
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
                className="w-full rounded-xl bg-accent px-6 py-4 font-semibold text-bg transition-colors hover:bg-accent-light disabled:opacity-50"
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

        {/* Canonical offer: free audit → $97 One-Leak Repair Sprint */}
        <section id="remediation" className="scroll-mt-40 border-t border-border pt-16">
          <div className="space-y-6">
          <h2 className="text-center text-2xl font-extrabold text-fg">
            Turn the findings into a bounded repair plan.
          </h2>

          <Card variant="bordered" className="relative mx-auto max-w-md overflow-hidden border-accent">
            <div>
              <h3 className="mb-1 text-2xl font-extrabold text-fg">${REPAIR_SPRINT_OFFER.priceUsd} {REPAIR_SPRINT_OFFER.name}</h3>
              <p className="mb-2 text-2xl font-extrabold tabular-nums text-accent">${REPAIR_SPRINT_OFFER.priceUsd}</p>
              <p className="mb-4 max-w-[65ch] text-base leading-7 text-fg-muted">
                {REPAIR_SPRINT_OFFER.summary} Nebula selects one high-confidence repair from
                this audit's findings, confirms the scope with you, implements it, and verifies
                the live change.
              </p>
              <a
                href={
                  unlocked && !sharedView
                    ? `/checkout?audit_id=${encodeURIComponent(auditId)}`
                    : '#unlock'
                }
                className="block w-full rounded-lg bg-accent px-4 py-2 text-center font-semibold text-bg transition-colors hover:bg-accent-light"
              >
                {unlocked && !sharedView
                  ? `Review the ${REPAIR_SPRINT_OFFER.name} - $${REPAIR_SPRINT_OFFER.priceUsd}`
                  : 'Unlock this audit to select its repair'}
              </a>
            </div>
          </Card>
          </div>
        </section>

        {/* Pass it forward — referral moment #1 */}
        {(emailSent || unlocked) && (
          <Card variant="bordered" className="mt-8 border-accent/30">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-fg">Know another founder with the same problem?</p>
                <p className="mt-1 max-w-[65ch] text-base leading-7 text-fg-muted">
                  Forward their site for a free audit — takes a couple of minutes. The report names the exact leaks, same as yours.
                </p>
              </div>
              <a
                href="/audit"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg border border-accent px-6 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
              >
                Send them an audit ↗
              </a>
            </div>
          </Card>
        )}

        {/* Priority Matrix Legend */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <span className="text-xs text-fg-muted">Priority quadrants:</span>
          {Object.entries(QUADRANT_LABELS).map(([key, value]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full ${value.tone === 'accent' ? 'bg-accent' : 'bg-fg-muted/40'}`} />
              <span className="text-xs text-fg-muted">{value.label}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
