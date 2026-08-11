'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import posthog from '@/app/lib/posthog-browser'

type Status = 'pass' | 'warning' | 'fail' | 'unknown'

interface ComponentResult {
  status: Status
  score?: number | null
  passStandard: string
  note?: string | null
  adTerms?: string[]
  pageTerms?: string[]
  sharedTerms?: string[]
  pageH1?: string
  adCopyExcerpt?: string
  finding?: {
    issue: string
    fix: string
    measured: string | null
    required: string | null
    delta: string | null
    selector: string | null
  } | null
}

interface LabResponse {
  url: string
  score: number | null
  grade: string | null
  components: {
    messageMatch: ComponentResult
    headline: ComponentResult
    cta: ComponentResult
    aboveFold: ComponentResult
    socialProof: ComponentResult
    mobile: ComponentResult
    loadSpeed: ComponentResult
    adSignals: ComponentResult
    seoFoundations: ComponentResult
    aiReadiness: ComponentResult
  }
}

const STATUS_META: Record<Status, { label: string; dot: string; badge: string }> = {
  pass:    { label: 'Pass',        dot: 'bg-accent',       badge: 'bg-accent/15 text-accent' },
  warning: { label: 'Warning',     dot: 'bg-amber-400',    badge: 'bg-amber-400/15 text-amber-400' },
  fail:    { label: 'Fail',        dot: 'bg-red-400',      badge: 'bg-red-400/15 text-red-400' },
  unknown: { label: 'Not checked', dot: 'bg-fg-muted/40',  badge: 'bg-fg-muted/10 text-fg-muted' },
}

function EvidenceBlock({ finding }: { finding: NonNullable<ComponentResult['finding']> }) {
  const items = [
    { label: 'Issue', value: finding.issue },
    { label: 'Measured', value: finding.measured },
    { label: 'Required', value: finding.required },
    { label: 'Gap', value: finding.delta },
    { label: 'Fix', value: finding.fix },
  ].filter((i): i is { label: string; value: string } => Boolean(i.value))

  return (
    <div className="mt-4 rounded-xl border border-border bg-bg-muted/20 px-4 py-3 text-sm space-y-2">
      {items.map((i) => (
        <div key={i.label} className="flex gap-2 text-fg-muted">
          <span className="shrink-0 w-20 font-semibold text-fg">{i.label}</span>
          <span className="leading-relaxed">{i.value}</span>
        </div>
      ))}
    </div>
  )
}

function ComponentCard({
  index,
  title,
  question,
  result,
}: {
  index: string
  title: string
  question: string
  result: ComponentResult
}) {
  const meta = STATUS_META[result.status] ?? STATUS_META.unknown
  return (
    <div className="rounded-2xl border border-border bg-bg-panel p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-fg-muted mb-0.5">
            {index}
          </p>
          <h3 className="text-base font-bold text-fg">{title}</h3>
          <p className="text-xs text-fg-muted mt-0.5">{question}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badge}`}>
          {meta.label}
        </span>
      </div>

      {result.note && <p className="mt-3 text-sm text-fg-muted">{result.note}</p>}

      {/* Message Match overlap evidence */}
      {result.sharedTerms !== undefined && result.pageH1 && (
        <div className="mt-3 rounded-xl border border-border bg-bg-muted/20 p-3 text-xs">
          <p className="mb-1.5 font-semibold text-fg">Term overlap</p>
          <p className="text-fg-muted">
            <span className="font-semibold text-fg">Ad:</span> &ldquo;{result.adCopyExcerpt}&rdquo;
          </p>
          <p className="mt-1.5 text-fg-muted">
            <span className="font-semibold text-fg">Page H1:</span> &ldquo;{result.pageH1}&rdquo;
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {result.sharedTerms && result.sharedTerms.length > 0 ? (
              <>
                <span className="text-fg-muted">Shared:</span>
                {result.sharedTerms.map((t) => (
                  <span key={t} className="rounded-full bg-accent/20 px-2 py-0.5 font-semibold text-accent">
                    {t}
                  </span>
                ))}
              </>
            ) : (
              <span className="text-fg-muted">No shared promise terms found.</span>
            )}
          </div>
        </div>
      )}

      {result.finding && <EvidenceBlock finding={result.finding} />}

      <p className="mt-3 border-t border-border pt-2.5 text-xs text-fg-muted/70">
        <span className="font-semibold text-fg-muted">Pass standard:</span>{' '}
        {result.passStandard}
      </p>
    </div>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="pt-2 text-xs font-semibold uppercase tracking-widest text-fg-muted">{label}</p>
  )
}

function ScoreSummary({ components }: { components: LabResponse['components'] }) {
  const all = Object.values(components)
  const passes = all.filter((c) => c.status === 'pass').length
  const fails = all.filter((c) => c.status === 'fail').length
  const warnings = all.filter((c) => c.status === 'warning').length
  return (
    <div className="flex flex-wrap gap-4 text-sm">
      <span className="text-accent font-semibold">{passes} pass</span>
      <span className="text-amber-400 font-semibold">{warnings} warning</span>
      <span className="text-red-400 font-semibold">{fails} fail</span>
    </div>
  )
}

export default function LabClient() {
  const [url, setUrl] = useState('')
  const [adCopy, setAdCopy] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<LabResponse | null>(null)
  // Save-to-workspace state
  // Save-to-workspace state. Start empty so SSR and the first client render
  // agree; the stored email is pulled in after mount (reading localStorage
  // during render caused an input value hydration mismatch for returning
  // visitors - the quiet sibling of the /workspace React #418 bug).
  const [saveEmail, setSaveEmail] = useState<string>('')
  const [saveLabel, setSaveLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)

  // Pull any previously-used workspace email once, after mount, to prefill the
  // save form without affecting SSR/first render.
  useEffect(() => {
    const stored = window.localStorage.getItem('nebula_ws_email')
    if (stored) setSaveEmail(stored)
  }, [])

  function buildSavePayload() {
    if (!result) return null
    const comps: Record<string, { status?: string; score?: number | null }> = {}
    for (const [key, c] of Object.entries(result.components)) {
      comps[key] = { status: c.status, score: c.score }
    }
    return {
      url: result.url,
      score: result.score ?? 0,
      grade: result.grade,
      components: comps,
      adCopy: adCopy.trim() || null,
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const email = saveEmail.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSaveError('Enter a valid email address')
      return
    }
    const payload = buildSavePayload()
    if (!payload) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/lab-experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, label: saveLabel.trim() || `Run ${new Date().toLocaleDateString()}`, ...payload }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSaveError(data.error ?? 'Save failed')
      } else {
        window.localStorage.setItem('nebula_ws_email', email)
        setSavedId(data.id)
        posthog.capture('lab_experiment_saved', {
          page_domain: (() => { try { return new URL(payload.url).hostname } catch { return payload.url } })(),
          score: payload.score,
        })
      }
    } catch {
      setSaveError('Could not reach the save endpoint.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/audit/lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), adCopy: adCopy.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Component check failed')
      } else {
        setResult(data)
        posthog.capture('lab_check_completed', {
          page_domain: (() => { try { return new URL(data.url).hostname } catch { return data.url } })(),
          ad_copy_provided: Boolean(adCopy.trim()),
          message_match_status: data.components?.messageMatch?.status ?? 'unknown',
          headline_status: data.components?.headline?.status ?? 'unknown',
          cta_status: data.components?.cta?.status ?? 'unknown',
          above_fold_status: data.components?.aboveFold?.status ?? 'unknown',
          social_proof_status: data.components?.socialProof?.status ?? 'unknown',
          mobile_status: data.components?.mobile?.status ?? 'unknown',
          load_speed_status: data.components?.loadSpeed?.status ?? 'unknown',
          ad_signals_status: data.components?.adSignals?.status ?? 'unknown',
          seo_foundations_status: data.components?.seoFoundations?.status ?? 'unknown',
          ai_readiness_status: data.components?.aiReadiness?.status ?? 'unknown',
        })
      }
    } catch {
      setError('Could not reach the component engine.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-4xl space-y-10">

        {/* Input form */}
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-bg-panel p-6">
          <div className="grid gap-4">
            <div>
              <label htmlFor="ad-copy" className="mb-1.5 block text-sm font-semibold text-fg">
                Ad copy you are running <span className="text-fg-muted font-normal">(optional - enables Message Match check)</span>
              </label>
              <textarea
                id="ad-copy"
                value={adCopy}
                onChange={(e) => setAdCopy(e.target.value)}
                rows={3}
                placeholder="Paste the headline or first line of the ad people clicked..."
                className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm text-fg placeholder:text-fg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>
            <div>
              <label htmlFor="page-url" className="mb-1.5 block text-sm font-semibold text-fg">
                Landing page URL
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="page-url"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-landing-page.com"
                  className="w-full flex-1 rounded-xl border border-border bg-bg px-4 py-3 text-sm text-fg placeholder:text-fg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                />
                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="rounded-xl bg-accent px-7 py-3 font-semibold text-bg hover:bg-accent-light focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Running…' : 'Check All Components'}
                </button>
              </div>
            </div>
          </div>
          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        </form>

        {/* Results */}
        {result && (
          <>
            {/* Summary bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-fg-muted">
                  <span className="font-semibold text-fg">{result.url}</span>
                  {result.score !== null && (
                    <> - <span className="font-semibold text-fg">{result.score}/10</span> · Grade <span className="font-semibold text-fg">{result.grade}</span></>
                  )}
                </p>
                <ScoreSummary components={result.components} />
              </div>
              <Link
                href="/audit?from=lab"
                onClick={() => posthog.capture('lab_full_audit_clicked')}
                className="rounded-xl border border-accent px-5 py-2.5 text-sm font-semibold text-accent hover:bg-accent hover:text-bg transition-colors"
              >
                Run full free audit →
              </Link>
            </div>

            {/* Save to workspace */}
            {savedId ? (
              <div className="rounded-2xl border border-accent/40 bg-accent/10 px-5 py-4">
                <p className="text-sm font-semibold text-accent">
                  ✓ Saved to your workspace
                </p>
                <p className="mt-1 text-sm text-fg-muted">
                  Find it under Workspace → Experiments, track variants, and mark the winner as
                  production.
                </p>
                <Link
                  href="/workspace"
                  className="mt-3 inline-block rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-bg hover:bg-accent-light transition-colors"
                >
                  Open workspace →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSave} className="rounded-2xl border border-border bg-bg-panel p-5">
                <p className="text-sm font-semibold text-fg">Save this run to your workspace</p>
                <p className="mt-0.5 text-xs text-fg-muted">
                  Track experiments (Headline A, B, C…), compare scores, and mark the winner as
                  production.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1.2fr]">
                  <div>
                    <label htmlFor="lab-save-label" className="mb-1 block text-xs font-semibold text-fg-muted">
                      Label
                    </label>
                    <input
                      id="lab-save-label"
                      type="text"
                      value={saveLabel}
                      onChange={(e) => setSaveLabel(e.target.value)}
                      placeholder="Headline A"
                      className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-fg placeholder:text-fg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    />
                  </div>
                  <div>
                    <label htmlFor="lab-save-email" className="mb-1 block text-xs font-semibold text-fg-muted">
                      Workspace email
                    </label>
                    <input
                      id="lab-save-email"
                      type="email"
                      value={saveEmail}
                      onChange={(e) => setSaveEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-fg placeholder:text-fg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    />
                  </div>
                </div>
                {saveError && <p className="mt-2 text-sm text-red-400">{saveError}</p>}
                <button
                  type="submit"
                  disabled={saving}
                  className="mt-3 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-bg hover:bg-accent-light transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save experiment'}
                </button>
              </form>
            )}

            {/* Conversion layer */}
            <div className="space-y-4">
              <SectionHeader label="Conversion layer" />
              <div className="grid gap-4 sm:grid-cols-2">
                <ComponentCard index="01" title="Message Match"
                  question="Does the page repeat the promise from your ad?"
                  result={result.components.messageMatch} />
                <ComponentCard index="02" title="Headline"
                  question="Does the H1 name the buyer outcome clearly?"
                  result={result.components.headline} />
                <ComponentCard index="03" title="CTA"
                  question="Is the primary action obvious and visible above fold?"
                  result={result.components.cta} />
                <ComponentCard index="04" title="Above the Fold"
                  question="Is the offer and promise visible without scrolling?"
                  result={result.components.aboveFold} />
                <ComponentCard index="05" title="Social Proof"
                  question="Is there proof near the first CTA?"
                  result={result.components.socialProof} />
              </div>
            </div>

            {/* Technical layer */}
            <div className="space-y-4">
              <SectionHeader label="Technical layer" />
              <div className="grid gap-4 sm:grid-cols-2">
                <ComponentCard index="06" title="Mobile CTA"
                  question="Is the primary action usable on a 375px viewport?"
                  result={result.components.mobile} />
                <ComponentCard index="07" title="Load Speed"
                  question="Does the page pass Core Web Vitals on mobile?"
                  result={result.components.loadSpeed} />
                <ComponentCard index="08" title="Ad Signals"
                  question="Are ad-tracking artifacts present in the page source?"
                  result={result.components.adSignals} />
              </div>
            </div>

            {/* Discoverability layer */}
            <div className="space-y-4">
              <SectionHeader label="Discoverability layer" />
              <div className="grid gap-4 sm:grid-cols-2">
                <ComponentCard index="09" title="SEO Foundations"
                  question="Are title, meta description, and H1 all present?"
                  result={result.components.seoFoundations} />
                <ComponentCard index="10" title="AI Readiness"
                  question="Is the page citable by AI systems?"
                  result={result.components.aiReadiness} />
              </div>
            </div>

            <p className="text-xs text-fg-muted/70">
              Same engine as the free audit, same evidence standard. The lab runs all 9 components on demand.
            </p>
          </>
        )}
      </div>
    </section>
  )
}
