'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui'
import posthog from '@/app/lib/posthog-browser'
import { analyticsHeaders, auditAttemptIdFor } from '@/app/lib/client-analytics'
import { trackClientFunnelEvent } from '@/app/lib/client-funnel'
import VisibilityBeacon from '@/components/VisibilityBeacon'
import { parseAuditResult, type AuditResult, type Finding } from './auditResultSchema'
import { getDisease, diseaseTierClass, complexityBadge, extractSerpData } from './diseases'
import RewritePreview from './RewritePreview'
import JsonLdGeneratorModal from '@/app/components/JsonLdGeneratorModal'
import AiAgentFixPromptModal from '@/app/components/AiAgentFixPromptModal'
import {
  REPORT_NAVIGATION,
  buildPriorityQueue,
  findingSeverity,
  groupFindingsBySignal,
  summarizeFindings,
} from './reportArchitecture'
import { REPAIR_SPRINT_OFFER } from '@/app/lib/self-implementation-kit-offer'
import { SUBSCRIPTION_PLANS, PAID_PLAN_KEYS } from '@/app/lib/subscription-plans'
import {
  conditionIdFor,
  conditionVersionFor,
  isExactArtifact,
  rankFirstReason,
  QUADRANT_DEFINITIONS,
} from './conditionLineage'
import { classifyFreePreview } from './freePreview'
import ResultsFeedback from '@/components/ResultsFeedback'
import {
  buildPersonalizedDiagnosis,
  buildRepairBridge,
  buildOverviewHeadline,
  DIMENSION_PLAIN,
} from './recognitionLayer'

const REPAIR_CTA = `Get the repair: $${REPAIR_SPRINT_OFFER.priceUsd}`

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
 * Format: "[DISEASE/LABEL] - {measured value} | Fix: {fix}"
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
      // clipboard API may be unavailable in some contexts - silent fail
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
        Paste into Slack, email, or a GitHub issue - your dev has everything they need.
      </p>
    </Card>
  )
}

// The only place amber (`signal-fail`) appears anywhere on the site.
// Every finding rendered here already represents a dimension that scored

/**
 * FixPreview - shows sentence 1 of the AI fix prompt, blurs the rest.
 * Eye path: problem → partial solution → wall → $97 unlock.
 * The fix field already exists in every finding - no backend change needed.
 */
function FixPreview({ finding, unlocked }: { finding: Finding; unlocked: boolean }) {
  const disease = getDisease(finding.key)
  const fixText = finding.fix
  if (!fixText || fixText.length < 20) return null

  // Split at first sentence boundary - period + space or end of string
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
              className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-bg shadow-sm transition-colors hover:opacity-85 hover:bg-accent"
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
 * SerpSnippet - renders a mock Google SERP preview for seo_foundations findings.
 * Uses only data already present in finding.evidence.measured.
 * Left: their actual page (blank/truncated). Right: what a good page looks like.
 */
function FreeFindingPreview({ finding }: { finding: Finding }) {
  const decision = classifyFreePreview(finding)

  if (decision.kind === 'safe_preview') {
    return (
      <div className="mt-4 rounded-lg border border-accent/20 bg-accent/5 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-accent">Safe change preview</p>
        <p className="text-sm leading-6 text-fg-muted">
          <span className="font-semibold text-fg">Observed:</span> {decision.observed}
        </p>
        <p className="mt-2 text-sm leading-6 text-fg-muted">
          <span className="font-semibold text-fg">Change:</span> {decision.change}
        </p>
        <p className="mt-2 text-xs text-fg-dim">This preview describes a page change. It does not establish conversion or revenue impact.</p>
      </div>
    )
  }

  if (decision.kind === 'paid_artifact') {
    return (
      <div className="mt-4 rounded-lg border border-border bg-bg/50 p-4">
        <p className="text-sm font-semibold text-fg">Specific change available after unlock</p>
        <p className="mt-1 text-xs text-fg-muted">The free result shows the condition. The exact implementation artifact remains paid-gated.</p>
      </div>
    )
  }

  return (
    <p className="mt-4 text-xs text-fg-muted">No specific change preview is available for this finding.</p>
  )
}

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
        {/* Their page - broken */}
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
              [Your value proposition - who it helps, what it does, one outcome. 120–155 chars fills the full preview and earns the click.]
            </p>
          </div>
        </div>
      </div>
      <p className="mt-2 text-sm leading-6 text-fg-muted">
        This is what searchers see before clicking. The implementation kit can supply replacement copy for your title and meta description if that's the selected repair.
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
 * The magic-link offer is soft - there's no paywall attached and skipping
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
        <h3 className="mb-1 text-2xl font-extrabold text-accent">Complete audit results</h3>
        <p className="mb-5 text-sm text-fg-muted">
          {emailSent
            ? 'The complete report is heading to your inbox now'
            : 'All findings are visible below'}
        </p>
      </div>

      {/* Magic-link offer - only show when we have an email from this session */}
      {email && magicLinkState !== 'sent' && (
        <div className="border-t border-border pt-6 text-center">
          <p className="mb-4 text-sm text-fg-muted">
            Want to revisit this audit later? Get a one-click login link - no password needed.
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

      {/* Share link - always shown after unlock */}
      <div className="border-t border-border pt-6 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-fg-muted">
          Send this report to your developer or agency
        </p>
        <div className="flex items-center gap-3">
          <a
            href={`/api/audit/${auditId}/pdf`}
            download
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-muted/10 px-4 py-2 text-sm font-medium text-fg-muted transition-colors hover:border-accent hover:text-fg"
          >
            <span>↓</span> Export PDF
          </a>
          <ShareButton auditId={auditId} />
        </div>
      </div>
    </Card>
  )
}

/**
 * ── Immediate Repair Offer (above-the-fold) ─────────────────────────────
 * Adds the $97 "One-Leak Repair Sprint" offer above the checkout CTA button
 * in the Remediation tab, with a preview of the worst finding's fix.
 */
function ImmediateRepairOffer({
  auditId,
  unlocked,
  sharedView,
  results,
}: {
  auditId: string
  unlocked: boolean
  sharedView?: boolean
  results: AuditResult
}) {
  if (!results.findings.length) return null

  return (
    <section id="immediate-repair" className="scroll-mt-40 border-b border-border py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.1em] text-accent">Highest-priority failed condition</p>
          <h2 className="mt-2 text-2xl font-extrabold text-fg">One scoped repair for the first failed condition</h2>
          <p className="mt-2 mx-auto max-w-[65ch] text-base text-fg-muted">
            If the artifact is exact, you get copy, code, or configuration for that condition.
            <span className="font-semibold text-fg"> 30-day re-audit verifies whether that condition changed.</span>
          </p>
        </div>

        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <Card variant="bordered" className="min-w-0 border-danger/30">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-danger" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-widest text-danger">Priority #1 finding</span>
            </div>
            {(() => {
              const worst = [...results.findings].sort((a, b) => b.impact - a.impact)[0]
              const disease = worst ? getDisease(worst.key) : null
              if (!worst || !disease) return null

              return (
                <>
                  <p className="font-mono text-xs uppercase tracking-widest text-fg-muted">
                    {conditionIdFor(worst)} / v{conditionVersionFor(worst)} · {worst.determination || 'FAIL'}
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-fg">{disease.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-fg-muted">{worst.issue}</p>
                  {worst.evidence?.measured && (
                    <p className="mt-3 text-xs leading-5 text-fg-muted">
                      <span className="font-semibold text-fg">Observed:</span> {worst.evidence.measured}
                    </p>
                  )}
                  {worst.evidence?.required && (
                    <p className="mt-2 text-xs leading-5 text-fg-muted">
                      <span className="font-semibold text-fg">Threshold:</span> {worst.evidence.required}
                    </p>
                  )}
                  {worst.evidence?.selector && worst.evidence.selector !== 'N/A' && (
                    <p className="mt-2 font-mono text-xs text-fg-muted">Selector: {worst.evidence.selector}</p>
                  )}
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.1em] text-fg-muted">
                    {isExactArtifact(worst.fix) ? 'Exact artifact' : 'Recommended change'}
                  </p>
                  <div className="mt-2 min-w-0 break-words rounded-lg border border-border bg-danger/5 p-4 font-mono text-xs leading-relaxed text-fg">
                    {worst.fix.slice(0, 180)}
                    {worst.fix.length > 180 ? '...' : ''}
                  </div>
                  <p className="mt-3 text-xs text-fg-muted">
                    Nebula has not established an effect on conversion outcomes. A later PASS on this condition ID means the page condition changed.
                  </p>
                </>
              )
            })()}
          </Card>

          <div className="flex flex-col justify-center">
            <div className="mb-6 rounded-lg border border-accent/20 bg-accent/5 p-5">
              <p className="text-sm font-semibold text-accent">What you receive</p>
              <p className="mt-2 text-sm leading-6 text-fg">
                {(() => {
                  const worst = [...results.findings].sort((a, b) => b.impact - a.impact)[0]
                  return worst ? buildRepairBridge(worst) : 'A page-specific repair artifact for the highest-priority failed condition.'
                })()}
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-fg-muted">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-accent" aria-hidden="true">+</span>
                  <span>One scoped repair for this condition.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-accent" aria-hidden="true">+</span>
                  <span>{(() => {
                    const worst = [...results.findings].sort((a, b) => b.impact - a.impact)[0]
                    return worst && isExactArtifact(worst.fix)
                      ? 'A page-specific copy, code, or configuration artifact.'
                      : 'A page-specific recommended change for this condition.'
                  })()}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-accent" aria-hidden="true">+</span>
                  <span>One same-condition re-audit within 30 days.</span>
                </li>
              </ul>
            </div>
            <ol className="mb-6 grid gap-3 border-y border-border py-4 text-sm sm:grid-cols-3">
              <li>
                <span className="block font-semibold text-fg">Observed on your page</span>
                <span className="mt-1 block text-xs leading-5 text-fg-muted">The finding and its evidence are recorded first.</span>
              </li>
              <li>
                <span className="block font-semibold text-fg">One scoped repair artifact</span>
                <span className="mt-1 block text-xs leading-5 text-fg-muted">The package addresses one selected condition.</span>
              </li>
              <li>
                <span className="block font-semibold text-fg">Same-condition re-audit</span>
                <span className="mt-1 block text-xs leading-5 text-fg-muted">The later check shows whether that condition changed.</span>
              </li>
            </ol>
            {unlocked && !sharedView ? (
              <form
                action="/api/checkout"
                method="POST"
                className="space-y-3"
              >
                {/* Trust badges above checkout button */}
                <div className="mb-2 flex flex-wrap items-center justify-center gap-3 text-xs text-fg-muted">
                  <span className="flex items-center gap-1 rounded px-2 py-1 bg-accent/10 text-accent">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    256-bit SSL encrypted
                  </span>
                  <span className="flex items-center gap-1 rounded px-2 py-1 bg-accent/10 text-accent">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Secure Stripe checkout
                  </span>
                </div>
                <input type="hidden" name="auditId" value={auditId} />
                <input type="hidden" name="offerKey" value={REPAIR_SPRINT_OFFER.key} />
                <button
                  type="submit"
                  className="block w-full rounded-2xl bg-danger px-6 py-4 text-center text-lg font-semibold text-white transition-colors hover:bg-danger-light hover:opacity-90"
                >
                  {REPAIR_CTA}
                </button>
                <p className="text-center text-xs text-fg-muted">
                  Redirects to secure Stripe checkout. Card details never touch our servers.
                </p>
              </form>
            ) : (
              <a
                href="#unlock"
                onClick={(e) => {
                  e.preventDefault()
                  trackClientFunnelEvent('repair_sprint_clicked', {
                    audit_id: auditId,
                    offer_key: 'fix_pack',
                    placement: 'immediate_repair_preview',
                    unlocked: false,
                  }, { auditId })
                  posthog.capture('audit_cta_clicked', {
                    audit_id: auditId,
                    cta: 'immediate_repair_preview_locked',
                    unlocked: false,
                  })
                }}
                className="block w-full rounded-2xl border border-border px-6 py-4 text-center text-lg font-semibold text-fg transition-colors hover:border-accent hover:text-accent"
              >
                Unlock this audit first
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
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
  initialResults?: AuditResult | null
}

/**
 * Fetches the share token from the Next.js proxy route and copies the
 * share URL to the clipboard. Shows progressive states: idle → loading →
 * copied → error. The share URL gives anyone with it read-only access to
 * all findings - no email gate. This is the viral distribution mechanism.
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

type ReportTabId = (typeof REPORT_NAVIGATION)[number]['id']

function OverviewNext({ onSelect, unlocked, findingCount }: {
  onSelect: (id: ReportTabId) => void
  unlocked: boolean
  findingCount: number
}) {
  return (
    <section id="next-steps" className="border-b border-border py-12">
      <h2 className="text-xl font-extrabold text-fg">Next steps</h2>
      <p className="mt-2 max-w-[65ch] text-base leading-7 text-fg-muted">
        The overview is the orientation. The tabs above hold the evidence, the signal breakdown, and the repair plan.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <button
          onClick={() => onSelect('evidence')}
          className="group rounded-xl border border-border p-5 text-left transition-colors hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="block text-sm font-semibold text-fg">Evidence</span>
          <span className="mt-1 block text-sm leading-6 text-fg-muted">
            {findingCount > 0
              ? `${findingCount} failed signal${findingCount === 1 ? '' : 's'} with measured deltas and selectors`
              : 'All conversion signals passed with verified evidence'}
          </span>
        </button>
        <button
          onClick={() => onSelect('signals')}
          className="group rounded-xl border border-border p-5 text-left transition-colors hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="block text-sm font-semibold text-fg">Signals</span>
          <span className="mt-1 block text-sm leading-6 text-fg-muted">
            Core conversion signals with evidence-backed checks
          </span>
        </button>
        <button
          onClick={() => onSelect('remediation')}
          className="group rounded-xl border border-border p-5 text-left transition-colors hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="block text-sm font-semibold text-fg">Repair plan</span>
          <span className="mt-1 block text-sm leading-6 text-fg-muted">
            {findingCount > 0
              ? (unlocked ? 'Select your $97 repair' : 'Unlock every finding to see the full plan')
              : 'No failed conditions to repair'}
          </span>
        </button>
      </div>
    </section>
  )
}

function ReportTabs({ active, onSelect }: { active: ReportTabId; onSelect: (id: ReportTabId) => void }) {
  return (
    <nav aria-label="Audit report sections" className="sticky top-14 z-20 -mx-6 mb-12 border-y border-border bg-bg/95 px-6 py-4 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto pb-1 sm:justify-center" role="tablist">
        {REPORT_NAVIGATION.map((item) => {
          const selected = item.id === active
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={selected}
              onClick={() => onSelect(item.id)}
              className={`min-h-11 shrink-0 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                selected
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-fg-muted hover:border-accent hover:text-accent'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function ReportOverview({
  results,
  onGoToRemediation,
}: {
  results: AuditResult
  onGoToRemediation?: () => void
}) {
  const summary = summarizeFindings(results.findings)
  const hostname = new URL(results.url).hostname
  const headline = results.composite ?? results.score
  const weighted = results.composite !== undefined
  const firstFailed = buildPriorityQueue(results.findings)[0]

  return (
    <section id="overview" className="scroll-mt-40 border-b border-border pb-16">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-end">
        <div>
          <p className="text-sm font-semibold text-accent">Audit overview</p>

          <h1 className="mt-2 text-3xl font-extrabold text-fg md:text-4xl md:tracking-[-0.03em]">
            {buildOverviewHeadline(results.findings, hostname)}
          </h1>

          <p className="mt-5 max-w-[65ch] text-base leading-8 text-fg-muted">
            {summary.total} conditions failed this run. An effect on conversion outcomes is not established.
          </p>

          <p className="mt-4 max-w-[65ch] text-base leading-8 text-fg-muted">
            We checked this landing page against 9 conversion conditions. Highest-priority failed conditions are listed first.
          </p>

          <p className="mt-4 max-w-[65ch] text-base leading-8 text-fg-muted">
            <span className="font-semibold text-fg">Repair is scoped to one condition:</span>{' '}
            The{' '}
            {onGoToRemediation ? (
              <button
                type="button"
                onClick={onGoToRemediation}
                className="font-semibold text-accent hover:underline inline p-0 bg-transparent border-0 cursor-pointer"
              >
                $97 Repair Sprint
              </button>
            ) : (
              <span className="font-semibold text-accent">$97 Repair Sprint</span>
            )}{' '}
            produces one implementation artifact for the first failed condition. A 30-day re-audit verifies whether that same condition ID changed.
          </p>
        </div>

        <Card variant="elevated" className="vt-audit-card border-danger/30">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-fg">Page condition score</p>
              <div className="flex items-end gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted">Composite</p>
                  <p className="mt-1 tabular-nums">
                    <span className="text-5xl font-extrabold text-fg">{headline.toFixed(1)}</span>
                    <span className="text-xl text-fg-muted">/10</span>
                  </p>
                  <p className="mt-3 max-w-[28ch] text-xs text-fg-muted">
                    Score is a compatibility number. It is not conversion proof.
                  </p>
                </div>
                <div className="border-l border-border pl-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted">Failed conditions</p>
                  <p className={`mt-1 font-mono text-[96px] font-extrabold leading-none tracking-tighter ${summary.total > 0 ? 'text-danger' : 'text-accent'}`}>{summary.total}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-fg-muted">
                {weighted ? 'Weighted across high-impact conditions' : 'Evidence-backed assessment'}
              </p>
              {firstFailed && (
                <p className="mt-2 font-mono text-xs text-fg-muted">
                  First condition: {conditionIdFor(firstFailed)} / v{conditionVersionFor(firstFailed)}
                </p>
              )}
            </div>

            {/* Psychology: Social proof (pattern matching) */}
            <dl className="grid grid-cols-3 gap-6 border-t border-border pt-6 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
              <div>
                <dt className="text-xs text-fg-muted">Critical</dt>
                <dd className={`mt-1 text-2xl font-extrabold tabular-nums ${summary.critical > 0 ? 'text-danger' : 'text-fg'}`}>{summary.critical}</dd>
              </div>
              <div>
                <dt className="text-xs text-fg-muted">Warnings</dt>
                <dd className={`mt-1 text-2xl font-extrabold tabular-nums ${summary.warning > 0 ? 'text-signal-fail' : 'text-fg'}`}>{summary.warning}</dd>
              </div>
              <div>
                <dt className="text-xs text-fg-muted">Advisory</dt>
                <dd className="mt-1 text-2xl font-extrabold tabular-nums text-fg">{summary.advisory}</dd>
              </div>
            </dl>
          </div>

          {/* Social proof: live audit count */}
          <div className="mt-6 border-t border-border pt-4">
            <p className="text-xs text-fg-muted">
              <span className="font-semibold text-fg">9 conversion signals checked.</span> Each finding includes evidence from your page HTML and a specific fix recommendation.
            </p>
          </div>
        </Card>
      </div>
    </section>
  )
}

function FixFirstQueue({
  findings,
  auditId,
  onGoToRemediation,
  onViewEvidence,
}: {
  findings: Finding[]
  auditId: string
  onGoToRemediation?: () => void
  onViewEvidence?: (finding: Finding) => void
}) {
  const queue = buildPriorityQueue(findings).slice(0, 3)

  return (
    <section id="fix-first" className="scroll-mt-40 border-b border-border py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-fg">Fix first</h2>
          <p className="mt-2 max-w-[65ch] text-base leading-7 text-fg-muted">
            {queue.length > 0
              ? 'The first failed condition worth changing. Rank uses severity and effort, not predicted conversion loss.'
              : 'No failed conversion signals were returned for this audit.'}
          </p>
        </div>
        {queue.length > 0 && (
          onGoToRemediation ? (
            <button
              onClick={() => {
                posthog.capture('audit_cta_clicked', { audit_id: auditId, cta: 'fix_first_queue' })
                onGoToRemediation()
              }}
              className="min-h-11 shrink-0 rounded-lg bg-danger px-6 py-4 text-sm font-semibold text-white transition-colors hover:bg-danger-light"
            >
              {/* Psychology: Loss frame CTA */}
              {REPAIR_CTA}
            </button>
          ) : (
            <span className="min-h-11 shrink-0 rounded-lg border border-border px-6 py-4 text-sm font-semibold text-fg-muted">
              {REPAIR_CTA}
            </span>
          )
        )}
      </div>

      {queue.length > 0 && (
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
                {index === 0 && (
                  <p className="mt-2 max-w-[65ch] text-xs leading-5 text-fg-muted">{rankFirstReason(finding)}</p>
                )}
              </div>
              <div className="flex items-center gap-4 md:flex-col md:items-end">
                <span className="text-xs tabular-nums text-fg-muted" aria-label="Rule-derived prioritization score based on journey position, severity, reproducibility and confidence. This is not predicted conversion loss.">Priority {finding.impact}/10</span>
                <span className="text-xs tabular-nums text-fg-muted">Effort {finding.effort}/10</span>
                <button
                  type="button"
                  onClick={() => onViewEvidence?.(finding)}
                  className="text-sm font-semibold text-accent hover:text-fg hover:underline transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>View evidence</span>
                  <span aria-hidden="true">↓</span>
                </button>
              </div>
            </li>
          ))}
        </ol>
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
      <h2 className="text-2xl font-extrabold text-fg">Nine conversion signals</h2>
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

// ── Personalized Next Step ─────────────────────────────────────────────────
// Shows a single plain-language "here's what this means for you" block
// based on the worst-scoring finding. No database needed - data is live.
// DIMENSION_PLAIN and buildPersonalizedDiagnosis imported from recognitionLayer.

function PersonalizedNextStep({
  findings,
  onViewEvidence,
}: {
  findings: Finding[]
  onViewEvidence?: (finding: Finding) => void
}) {
  if (!findings.length) return null
  const diagnosis = buildPersonalizedDiagnosis(findings)
  if (!diagnosis) return null

  return (
    <div className="mb-8 rounded border border-accent/30 bg-accent/5 p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-accent">Your biggest leak</p>
          <h2 className="text-lg font-bold text-fg leading-snug">{diagnosis.headline}</h2>
          <p className="mt-2 text-sm text-fg-muted leading-6">{diagnosis.finding.key in DIMENSION_PLAIN ? DIMENSION_PLAIN[diagnosis.finding.key].why : ''}</p>
          {diagnosis.measuredLine && (
            <p className="mt-3 text-sm text-fg leading-6">
              <span className="font-semibold">On your page:</span>{' '}
              <span className="font-mono text-sm text-fg-muted">{diagnosis.measuredLine}</span>
            </p>
          )}
          <p className="mt-3 text-xs text-fg-muted">
            This is the <span className="font-semibold text-fg">{diagnosis.finding.label}</span> signal.
            {' '}The $97 repair fixes this specific issue, not a generic template.
          </p>
        </div>
        {onViewEvidence && (
          <button
            type="button"
            onClick={() => onViewEvidence(diagnosis.finding)}
            className="shrink-0 self-start rounded-lg border border-accent/40 bg-accent/10 px-3.5 py-2 text-xs font-bold text-accent hover:bg-accent hover:text-bg transition-colors cursor-pointer"
          >
            View Evidence →
          </button>
        )}
      </div>
    </div>
  )
}

export default function ResultsClient({
  auditId,
  unlocked: initialUnlocked,
  sharedView = false,
  initialResults = null,
}: Props) {
  const [loading, setLoading] = useState(!initialResults)
  const [results, setResults] = useState<AuditResult | null>(initialResults)
  const [error, setError] = useState<string | null>(null)

  // Client-side unlock state - starts from server-determined value but can
  // be updated after a successful inline email submission.
  const [unlocked, setUnlocked] = useState(initialUnlocked)

  const [emailForm, setEmailForm] = useState({ email: '', name: '' })
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ReportTabId>('overview')

  const navigateToFinding = (finding: Finding) => {
    setActiveTab('evidence')
    const anchor = findingAnchor(finding)
    try {
      window.history.pushState(null, '', `#${anchor}`)
    } catch {
      // noop
    }
    setTimeout(() => {
      const el = document.getElementById(anchor)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        el.classList.add('ring-2', 'ring-accent', 'ring-offset-4', 'ring-offset-bg')
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-accent', 'ring-offset-4', 'ring-offset-bg')
        }, 2500)
      }
    }, 80)
  }

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#/, '')
      if (!hash) return

      if (['overview', 'fix-first', 'signals', 'evidence', 'remediation'].includes(hash)) {
        setActiveTab(hash as ReportTabId)
      } else if (hash.startsWith('finding-')) {
        setActiveTab('evidence')
        setTimeout(() => {
          const el = document.getElementById(hash)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            el.classList.add('ring-2', 'ring-accent', 'ring-offset-4', 'ring-offset-bg')
            setTimeout(() => {
              el.classList.remove('ring-2', 'ring-accent', 'ring-offset-4', 'ring-offset-bg')
            }, 2500)
          }
        }, 120)
      } else if (hash === 'repair') {
        setActiveTab('remediation')
      }
    }

    handleHash()
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  useEffect(() => {
    const trackViewed = (parsed: AuditResult) => {
      const scoreVal = Math.round(parsed.score)
      const scoreBucket = scoreVal <= 40 ? 'score_0_40' : scoreVal <= 70 ? 'score_41_70' : 'score_71_100'
      trackClientFunnelEvent('audit_result_viewed', {
        audit_id: auditId,
        score_bucket: scoreBucket,
        grade: parsed.grade,
        findings_count: parsed.findings.length,
        unlocked: initialUnlocked,
      }, { auditId })
      posthog.capture('audit_results_viewed', {
        audit_id: auditId,
        score: parsed.score,
        grade: parsed.grade,
        unlocked: initialUnlocked,
        findings_count: parsed.findings.length,
      })
    }

    if (initialResults) {
      trackViewed(initialResults)
      return
    }

    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/audit/${auditId}`)
        if (!response.ok) throw new Error('Failed to fetch audit')
        const parsed = parseAuditResult(await response.json())
        setResults(parsed)
        trackViewed(parsed)
      } catch (err) {
        trackClientFunnelEvent('audit_result_load_failed', {
          audit_id: auditId,
          reason_code: 'network_error',
        }, { auditId })
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [auditId, initialResults, initialUnlocked])

  const sendEmail = async () => {
    if (!emailForm.email || !results) return

    setSendingEmail(true)
    setEmailError(null)

    const auditAttemptId = auditAttemptIdFor(auditId)

    posthog.capture('audit_email_submitted', {
      audit_id: auditId,
      audit_attempt_id: auditAttemptId,
      source: 'results_page',
      has_name: Boolean(emailForm.name),
    })

    try {
      const response = await fetch('/api/audit/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...analyticsHeaders(),
        },
        body: JSON.stringify({
          audit_id: auditId,
          email: emailForm.email,
          name: emailForm.name || undefined,
          audit_attempt_id: auditAttemptId ?? undefined,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        const message = typeof data.error === 'string' ? data.error.slice(0, 300) : 'Could not unlock results'
        throw new Error(message)
      }

      setEmailSent(data.email_sent === true)
      setUnlocked(true)
      if (typeof data.analytics_person_id === 'string') {
        posthog.identify(data.analytics_person_id)
      }
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSendingEmail(false)
    }
  }

  if (loading) {
    return (
      <main id="main-content" className="min-h-screen min-w-0 w-full overflow-x-hidden bg-bg px-6 py-12 pt-24">
        <div className="mx-auto max-w-6xl">
          {/* Skeleton nav - matches ReportNavigation height */}
          <nav aria-label="Loading" className="sticky top-14 z-20 -mx-6 mb-12 overflow-x-hidden border-y border-border bg-bg/95 px-6 py-4">
            <div className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto pb-1 sm:justify-center">
              {['Overview', 'Fix first', 'Signals', 'Evidence', 'Repair'].map((label) => (
                <span key={label} className="min-h-11 shrink-0 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-fg-muted/30">
                  {label}
                </span>
              ))}
            </div>
          </nav>
          {/* Skeleton overview - matches ReportOverview grid */}
          <section className="scroll-mt-40 border-b border-border pb-16">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-end">
              <div>
                <p className="text-sm font-semibold text-accent">Audit overview</p>
                <h1 className="mt-2 text-2xl font-extrabold text-fg md:text-4xl md:tracking-[-0.03em]">Landing Page Audit Results</h1>
                <div className="mt-2 h-5 w-40 animate-pulse rounded bg-bg-muted/40" />
                <div className="mt-5 h-16 w-full max-w-[65ch] animate-pulse rounded bg-bg-muted/40" />
              </div>
              <Card variant="elevated" className="vt-audit-card">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-fg-muted">Conversion readiness</p>
                    <p className="mt-1 tabular-nums">
                      <span className="text-6xl font-extrabold text-accent/30">-</span>
                      <span className="text-2xl text-fg-muted">/10</span>
                    </p>
                    <div className="mt-2 h-4 w-44 animate-pulse rounded bg-bg-muted/40" />
                  </div>
                  <dl className="grid grid-cols-3 gap-6 border-t border-border pt-6 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                    {['Critical', 'Warnings', 'Advisory'].map((label) => (
                      <div key={label}>
                        <dt className="text-xs text-fg-muted">{label}</dt>
                        <dd className="mt-1 h-8 w-8 animate-pulse rounded bg-bg-muted/40" />
                      </div>
                    ))}
                  </dl>
                </div>
              </Card>
            </div>
          </section>
          {/* Skeleton finding rows - match Card height */}
          <div className="py-16 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-bg-muted/20" />
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (error || !results) {
    return (
      <main id="main-content" className="min-h-screen min-w-0 w-full overflow-x-hidden bg-bg px-6 py-12 pt-24">
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
    <main id="main-content" className="min-h-screen min-w-0 w-full overflow-x-hidden bg-bg px-6 py-12 pt-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex min-w-0 w-full flex-wrap items-center justify-end gap-3">
          <AiAgentFixPromptModal results={results} />
          {unlocked && !sharedView && (
            <a
              href={`/api/report/pdf?audit_id=${encodeURIComponent(auditId)}`}
              download
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-muted/10 px-4 py-2 text-sm font-medium text-fg-muted transition-colors hover:border-accent hover:text-fg"
            >
              <span>↓</span> Download PDF
            </a>
          )}
        </div>
        <ReportTabs active={activeTab} onSelect={setActiveTab} />

        {activeTab === 'overview' && (
          <>
            <PersonalizedNextStep
              findings={results.findings}
              onViewEvidence={navigateToFinding}
            />
            <ReportOverview
              results={results}
              onGoToRemediation={() => setActiveTab('remediation')}
            />
            <ImmediateRepairOffer
              auditId={auditId}
              unlocked={unlocked}
              sharedView={sharedView}
              results={results}
            />
            {results.findings.length > 0 && (
              <FixFirstQueue
                findings={results.findings}
                auditId={auditId}
                onGoToRemediation={() => setActiveTab('remediation')}
                onViewEvidence={navigateToFinding}
              />
            )}
            {/* Inline email gate - shown on Overview for unlocked visitors and non-shared locked views */}
            {!unlocked && !sharedView && !emailSent && (
              <section className="border-y border-border py-12 my-4">
                <div className="mx-auto max-w-xl text-center">
                  <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-2">Free - takes 10 seconds</p>
                  <h2 className="text-2xl font-extrabold text-fg mb-2">
                    Unlock the full report + receive it in your inbox
                  </h2>
                  <p className="text-fg-muted mb-6 text-sm leading-relaxed">
                    See every finding, the fix preview for each, and the evidence behind the score.
                  </p>
                  <form
                    onSubmit={(e) => { e.preventDefault(); sendEmail() }}
                    className="flex flex-col sm:flex-row gap-3 justify-center"
                  >
                    <input
                      type="email"
                      required
                      placeholder="you@company.com"
                      value={emailForm.email}
                      onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                      disabled={sendingEmail}
                      className="flex-1 min-w-0 rounded-lg border border-border bg-bg px-4 py-3 text-sm text-fg placeholder-fg-dim outline-none transition focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60"
                    />
                    <button
                      type="submit"
                      disabled={!emailForm.email || sendingEmail}
                      className="shrink-0 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-bg transition-all hover:opacity-85 hover:bg-accent active:scale-[0.98] disabled:opacity-60"
                    >
                      {sendingEmail ? 'Unlocking…' : 'Unlock full report →'}
                    </button>
                  </form>
                  {emailError && (
                    <p className="mt-3 text-xs text-danger">{emailError}</p>
                  )}
                </div>
              </section>
            )}
            {(emailSent || unlocked) && !sharedView && (
              <UnlockConfirmation emailSent={emailSent} email={emailForm.email} auditId={auditId} />
            )}
            <OverviewNext
              onSelect={setActiveTab}
              unlocked={unlocked && !sharedView}
              findingCount={results.findings.length}
            />
          </>
        )}

        {activeTab === 'fix-first' && (
          <>
            <FixFirstQueue
              findings={results.findings}
              auditId={auditId}
              onGoToRemediation={() => setActiveTab('remediation')}
              onViewEvidence={navigateToFinding}
            />
            {unlocked && results.findings.length > 0 && <SlackSnippet findings={results.findings} />}
          </>
        )}

        {activeTab === 'signals' && (
          <SignalBreakdown findings={results.findings} />
        )}

        {activeTab === 'evidence' && (
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

          {/* Strategic finding - structural synthesis above the ranked list */}
          {results.strategic_finding && (
            <div className="rounded-md border border-border/60 bg-bg-elevated/60 px-5 py-4">
              <p className="mb-1 text-2xs font-semibold uppercase tracking-label text-fg-dim">Strategic finding</p>
              <p className="text-sm leading-6 text-fg-muted">{results.strategic_finding}</p>
            </div>
          )}

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
                    {/* Disease name badge - shown when the key is in our disease map */}
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
                      {finding.principle && (
                        <span className="inline-flex items-center rounded-sm border border-border/60 px-2 py-1 text-2xs font-semibold uppercase tracking-label text-fg-dim">
                          {finding.principle}
                        </span>
                      )}
                      <FailSignal />
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs tabular-nums">
                    <span className="rounded bg-accent/10 px-2 py-1 text-accent">
                      Priority: {finding.impact}/10
                    </span>
                    <span className="rounded bg-fg-muted/10 px-2 py-1 text-fg-muted">
                      Effort: {finding.effort}/10
                    </span>
                  </div>
                </div>

                {/* Disease symptom line - plain English, no jargon */}
                {disease && (
                  <p className="mb-2 text-base leading-7 italic text-fg-muted">
                    {disease.symptom}
                  </p>
                )}

                {unlocked || index < 2 ? (
                  <div className="mt-4 space-y-2 text-base leading-7">
                    {/* Fix complexity badge - collapses "I'll do it myself" objection */}
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

                    {/* Principle explanation - educational layer on why this affects conversion */}
                    {finding.principle_explanation && (
                      <p className="text-xs leading-5 text-fg-dim border-l-2 border-border/60 pl-3">
                        <span className="font-semibold text-fg-muted">{finding.principle}: </span>
                        {finding.principle_explanation}
                      </p>
                    )}

                    {/* SERP snippet - only for seo_foundations, uses scraped data */}
                    <SerpSnippet finding={finding} url={results.url} />

                    {/* Fix Preview - sentence 1 free, rest locked behind the implementation kit */}
                    <FixPreview finding={finding} unlocked={unlocked} />

                    {/* AI Rewrite Preview - first rewrite free, rest behind the implementation kit */}
                    <RewritePreview
                      auditId={auditId}
                      findingKey={finding.key}
                      findingCount={results.findings.length}
                    />

                    {/* Instant JSON-LD Schema Generator - shown for AI Readiness & SEO findings */}
                    {(finding.key === 'ai_readiness' || finding.key === 'seo_foundations') && (
                      <div className="mt-4">
                        <JsonLdGeneratorModal
                          initialType={finding.key === 'ai_readiness' ? 'FAQPage' : 'SoftwareApplication'}
                          pageUrl={results.url}
                          className="border-accent/20 bg-accent/5"
                        />
                      </div>
                    )}

                    {/* Evidence block - shown when audit engine provides measurement data */}
                    {finding.evidence && (
                      <details className="mt-4 group">
                        <summary className="flex cursor-pointer items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-fg-muted hover:text-fg">
                          {/* Confidence is a neutral fact about the evidence, not a good/bad
                              signal - deliberately grayscale so it never competes with the
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
                    {/* Complexity badge always visible - collapses objection even before unlock */}
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
                    {/* Finding-specific preview: exact artifacts are bounded, generic fixes stay paid-gated */}
                    <FreeFindingPreview finding={finding} />
                  </div>
                )}
              </div>
            </Card>
            </div>
            )
          })}
          </div>

        {/* Slack snippet - shown after unlock; helps the finding escape the tool */}
        {unlocked && results.findings.length > 0 && (
          <SlackSnippet findings={results.findings} />
        )}
        </section>
        )}

        {activeTab === 'remediation' && (
          <>
        {/* Email gate - shown only when not yet unlocked */}
        {!unlocked && !emailSent && (
          <Card variant="elevated" className="mt-8" id="unlock">
            <h3 className="mb-2 text-center text-2xl font-extrabold text-fg">
              Unlock All {results.findings.length} Findings
            </h3>
            <p className="mb-4 text-center text-fg-muted">
              Enter your email to see every finding - plus receive the full report in your inbox
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
                className="w-full rounded bg-accent px-6 py-4 font-semibold text-bg transition-colors hover:opacity-85 hover:bg-accent disabled:opacity-50"
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

          {/* NEW: Before/After Proof Layer (Psychology: Remove risk perception) */}
          {results.findings.length > 0 && (
            <Card variant="elevated" className="border-accent/30 bg-accent/5">
              {(() => {
                const worst = [...results.findings].sort((a, b) => b.impact - a.impact)[0]
                if (!worst) return null
                const exact = isExactArtifact(worst.fix)
                return (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-widest text-accent">
                        {exact ? 'Exact artifact' : 'Recommended change'}
                      </p>
                      <h3 className="mt-2 text-xl font-extrabold text-fg">
                        {conditionIdFor(worst)} / v{conditionVersionFor(worst)}
                      </h3>
                      <p className="mt-1 font-mono text-xs uppercase tracking-widest text-fg-muted">
                        {worst.determination || 'FAIL'}
                      </p>
                    </div>
                    <dl className="space-y-3 text-sm leading-6 text-fg-muted">
                      <div>
                        <dt className="font-semibold text-fg">Condition</dt>
                        <dd>{worst.issue}</dd>
                      </div>
                      {worst.evidence?.measured && (
                        <div>
                          <dt className="font-semibold text-fg">Observed</dt>
                          <dd>{worst.evidence.measured}</dd>
                        </div>
                      )}
                      {worst.evidence?.required && (
                        <div>
                          <dt className="font-semibold text-fg">Threshold</dt>
                          <dd>{worst.evidence.required}</dd>
                        </div>
                      )}
                      {worst.evidence?.selector && worst.evidence.selector !== 'N/A' && (
                        <div>
                          <dt className="font-semibold text-fg">Selector</dt>
                          <dd className="font-mono text-xs">{worst.evidence.selector}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="font-semibold text-fg">What changes this determination</dt>
                        <dd>{worst.evidence?.delta || worst.fix}</dd>
                      </div>
                    </dl>
                    {exact ? (
                      <div>
                        <p className="mb-2 text-sm font-semibold text-fg-muted">Paste-ready artifact</p>
                        <div className="rounded-lg border border-border bg-accent/5 p-4 font-mono text-sm leading-relaxed text-fg">
                          <p>{worst.fix}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-fg-muted">
                        No paste-ready copy, code, or configuration is attached to this run. The Repair Sprint produces that artifact.
                      </p>
                    )}
                    <p className="text-xs text-fg-muted">
                      {worst.not_established || 'Nebula has not established an effect on conversion outcomes for this condition.'}
                    </p>
                  </div>
                )
              })()}
            </Card>
          )}

          <h2 className="text-center text-2xl font-extrabold text-fg">
            Know exactly which one thing to fix and how to fix it.
          </h2>

          <VisibilityBeacon
            beaconId={`repair_sprint_results_${auditId}`}
            eventName="repair_sprint_exposed"
            properties={{ audit_id: auditId, offer_key: 'fix_pack', placement: 'results_remediation_section' }}
          >
            <Card variant="bordered" className="relative mx-auto max-w-md overflow-hidden border-accent">
              <div>
                <h3 className="mb-1 text-2xl font-extrabold text-fg">{REPAIR_SPRINT_OFFER.name}</h3>
                <p className="mb-2 text-2xl font-extrabold tabular-nums text-accent">${REPAIR_SPRINT_OFFER.priceUsd}</p>
                <p className="mb-4 max-w-[65ch] text-base leading-7 text-fg-muted">
                  One scoped repair package for the highest-priority failed condition. Copy, code, or configuration for that condition ID. You or your developer implements it.
                </p>
                <ul className="mb-5 space-y-2 text-sm text-fg-muted">
                  <li className="flex items-start gap-2"><span className="text-accent font-bold mt-0.5">+</span>One condition. Prepared within 48 hours.</li>
                  <li className="flex items-start gap-2"><span className="text-accent font-bold mt-0.5">+</span>Implementation artifact for that condition, not a 12-point checklist</li>
                  <li className="flex items-start gap-2"><span className="text-accent font-bold mt-0.5">+</span><span><strong className="text-fg">Included:</strong> 30-day re-audit to verify whether the audited condition changed</span></li>
                </ul>
                <a
                  href={
                    unlocked && !sharedView
                      ? `/checkout?audit_id=${encodeURIComponent(auditId)}`
                      : "#unlock"
                  }
                  onClick={() => {
                    trackClientFunnelEvent('repair_sprint_clicked', {
                      audit_id: auditId,
                      offer_key: 'fix_pack',
                      placement: 'results_remediation_section',
                      unlocked,
                    }, { auditId })
                    posthog.capture("audit_cta_clicked", {
                      audit_id: auditId,
                      cta: "remediation_section",
                      unlocked,
                    })
                  }}
                  className="block w-full rounded-lg bg-danger px-4 py-2 text-center font-semibold text-white transition-colors hover:bg-danger-light"
                >
                  {unlocked && !sharedView
                    ? REPAIR_CTA
                    : "Unlock this audit to select its repair"}
                </a>
              </div>
            </Card>
          </VisibilityBeacon>

          <Card variant="bordered" className="mx-auto max-w-2xl border-border bg-bg-muted/10">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-fg-muted">After the repair</p>
            <h3 className="mt-2 text-lg font-extrabold text-fg">Keep watching after the fix ships</h3>
            <p className="mt-2 text-sm leading-6 text-fg-muted">
              The $97 repair fixes one condition. Monitoring catches the next leak before it costs you another campaign.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {PAID_PLAN_KEYS.map((key) => {
                const plan = SUBSCRIPTION_PLANS[key]
                return (
                  <div key={key} className="rounded-lg border border-border bg-bg p-4">
                    <p className="text-sm font-semibold text-fg">{plan.name}</p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-fg">
                      ${plan.monthlyUsd}
                      <span className="text-xs font-normal text-fg-muted">/mo</span>
                    </p>
                    <p className="mt-2 text-xs leading-5 text-fg-muted">{plan.tagline}</p>
                  </div>
                )
              })}
            </div>
            <a href="/pricing" className="mt-4 inline-flex text-sm font-semibold text-accent hover:underline">
              Compare monitoring plans →
            </a>
          </Card>
          </div>
        </section>

        {/* Pass it forward - referral moment #1 */}
        {(emailSent || unlocked) && (
          <Card variant="bordered" className="mt-8 border-accent/30">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-fg">Know another founder with the same problem?</p>
                <p className="mt-1 max-w-[65ch] text-base leading-7 text-fg-muted">
                  Forward their site for a free audit. The report names failed conditions the same way.
                </p>
              </div>
              <a
                href="/audit?utm_source=content&utm_medium=organic-content"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg border border-accent px-6 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
              >
                Send them an audit ↗
              </a>
            </div>
          </Card>
        )}

        <ResultsFeedback auditId={auditId} />
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <span className="text-xs text-fg-muted">Priority quadrants (severity x implementation effort, not conversion impact):</span>
          {Object.entries(QUADRANT_LABELS).map(([key, value]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full ${value.tone === 'accent' ? 'bg-accent' : 'bg-fg-muted/40'}`} />
              <span className="text-xs text-fg-muted">
                {value.label}: {QUADRANT_DEFINITIONS[key] || ''}
              </span>
            </div>
          ))}
        </div>
          </>
        )}
      </div>
    </main>
  )
}
