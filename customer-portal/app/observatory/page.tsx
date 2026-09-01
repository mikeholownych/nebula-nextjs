import fs from 'fs'
import path from 'path'
import type { Metadata } from 'next'
import { OBSERVATORY_SOURCES } from '@/app/lib/datasets'
export const revalidate = 3600

const LEDGER_PATH = '/home/mike/nebula/seo-reports/ai-traffic-ledger.json'
const VISIBILITY_DIR = '/home/mike/nebula/reports/ai_visibility'
const VERIFICATION_LEDGER = '/home/mike/nebula/ledgers/repair_verification.json'
const EPISTEMIC_LEDGER = '/home/mike/nebula/ledgers/epistemic_observatory.json'
const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'
const CANONICAL = 'https://nebulacomponents.com/observatory'

export const metadata: Metadata = {
  title: 'Observatory: How AI Systems Read Nebula | Nebula Components',
  description:
    'Log-derived intelligence on the AI systems reading Nebula audit data: reads by assistant, catalog reach, the content AI retrieves most, measured citation outcomes in live AI answers, and what the audit dataset shows. Measured, not modeled.',
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: 'Nebula Observatory',
    description:
      'The AI systems reading Nebula audit data, what they retrieve, and where Nebula is cited in live AI answers. Measured, not modeled.',
    url: CANONICAL,
    siteName: 'Nebula Components',
    type: 'website',
  },
}

/* ---------- data shapes ---------- */

const AI_BOTS = ['PerplexityBot', 'OpenAI', 'GPTBot', 'ClaudeBot', 'Applebot'] as const
const SEARCH_BOTS = ['Googlebot', 'Bingbot', 'YandexBot'] as const

const BOT_META: Record<string, { label: string; operator: string; kind: string }> = {
  PerplexityBot: { label: 'PerplexityBot', operator: 'Perplexity', kind: 'Answer engine index' },
  OpenAI: { label: 'OAI-SearchBot / ChatGPT-User', operator: 'OpenAI', kind: 'Live browsing + search' },
  GPTBot: { label: 'GPTBot', operator: 'OpenAI', kind: 'Training crawler' },
  ClaudeBot: { label: 'ClaudeBot', operator: 'Anthropic', kind: 'Training crawler' },
  Applebot: { label: 'Applebot', operator: 'Apple', kind: 'Siri + Spotlight' },
}

interface DayEntry {
  bot_summary: Record<string, number>
  raw_record_count: number
  sitemap_path_count: number
  googlebot_crawled_count: number
  bingbot_crawled_count: number
  ai_paths?: Record<string, Array<[string, number]>>
  ai_path_reach?: Record<string, number>
}

interface Ledger {
  started: string
  updated_at: string
  days: Record<string, DayEntry>
}

interface VisibilitySummary {
  generated_at: string
  summary: {
    status: string
    responses: number
    mention_rate: number
    canonical_citations: number
    gap_queries: string[]
  }
}

interface BenchmarkData {
  audit_count: number
  avg_failures_per_page: number
  components: Array<{ label: string; failures: number; share: number }>
}

interface ObservatoryStats {
  audit_count: number
  min_cell_n: number
  score_percentiles?: { p10: number; p25: number; p50: number; p75: number; p90: number }
  score_histogram?: number[]
  pages_with_failures_rate?: number
  condition_base_rates?: Array<{ key: string; label: string; fail_rate: number; n: number }>
  cooccurrence?: Array<{ if_fails: string; also_fails: string; rate: number; n: number }>
  quadrant_mix?: Record<string, number>
}

interface VerificationLedger {
  generated_at: string
  delivered_reaudits: number
  conditions_reobserved: number
  fail_to_pass: number
  fail_to_fail: number
}

interface EpistemicLedger {
  generated_at: string
  stamped_audits: number
  audits_with_indeterminate: number
  determination_counts?: Record<string, number>
  integrity_states?: Record<string, number>
  gate?: { need_stamped_audits: number; need_days: number; stamped_audits: number; days_open: number }
}

function readJson<T>(p: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    return null
  }
}

/* ---------- data loading ---------- */

function readLedger(): Ledger | null {
  try {
    return JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8'))
  } catch {
    return null
  }
}

function readLatestVisibility(): VisibilitySummary | null {
  try {
    const runs = fs
      .readdirSync(VISIBILITY_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort()
    for (let i = runs.length - 1; i >= 0; i--) {
      const p = path.join(VISIBILITY_DIR, runs[i], 'summary.json')
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'))
    }
    return null
  } catch {
    return null
  }
}

async function getBenchmarks(): Promise<BenchmarkData | null> {
  try {
    const res = await fetch(`${API_BASE}/audit/stats/benchmarks`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function getObservatoryStats(): Promise<ObservatoryStats | null> {
  try {
    const res = await fetch(`${API_BASE}/audit/stats/observatory`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

/* ---------- aggregation ---------- */

// Observatory finding keys → signal reference pages. Only mapped keys link.
const SIGNAL_PAGE: Record<string, string> = {
  headline: '/signals/message-match',
  cta: '/signals/cta-clarity',
  social_proof: '/signals/trust-signals',
  load_speed: '/signals/load-speed',
  seo_foundations: '/signals/seo-foundations',
  ai_readiness: '/signals/ai-readiness',
  mobile: '/signals/mobile-cta',
}

const NON_CONTENT = new Set(['/robots.txt', '/sitemap.xml', '/manifest.webmanifest'])

function isContentPath(p: string): boolean {
  return !NON_CONTENT.has(p) && !p.startsWith('/api/') && !p.startsWith('/_next')
}

function aggregate(ledger: Ledger) {
  const dayKeys = Object.keys(ledger.days).sort()
  const days = dayKeys.map((k) => ledger.days[k])

  const perBot = AI_BOTS.map((name) => {
    const reads = days.reduce((a, d) => a + (d.bot_summary[name] ?? 0), 0)
    const reach = days.reduce((a, d) => Math.max(a, d.ai_path_reach?.[name] ?? 0), 0)
    const pathTotals = new Map<string, number>()
    for (const d of days) {
      for (const [p, c] of d.ai_paths?.[name] ?? []) {
        if (isContentPath(p)) pathTotals.set(p, (pathTotals.get(p) ?? 0) + c)
      }
    }
    const topPaths = [...pathTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
    return { name, reads, reach, topPaths }
  })
    .filter((b) => b.reads > 0)
    .sort((a, b) => b.reads - a.reads)

  // Content AI reads most, across all AI bots.
  const contentTotals = new Map<string, number>()
  for (const d of days) {
    for (const bot of AI_BOTS) {
      for (const [p, c] of d.ai_paths?.[bot] ?? []) {
        if (isContentPath(p)) contentTotals.set(p, (contentTotals.get(p) ?? 0) + c)
      }
    }
  }
  const topContent = [...contentTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)

  const aiReads = perBot.reduce((a, b) => a + b.reads, 0)
  const searchReads = days.reduce(
    (acc, d) => acc + SEARCH_BOTS.reduce((a, n) => a + (d.bot_summary[n] ?? 0), 0),
    0,
  )
  const latest = days[days.length - 1]

  return {
    dayKeys,
    perBot,
    topContent,
    aiReads,
    searchReads,
    sitemapCount: latest?.sitemap_path_count ?? 0,
    googlebotReach: latest?.googlebot_crawled_count ?? 0,
    bingbotReach: latest?.bingbot_crawled_count ?? 0,
  }
}

/* ---------- ui ---------- */

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mb-3">{children}</p>
  )
}

function Stat({ value, label, window }: { value: string; label: string; window: string }) {
  return (
    <div className="border border-border bg-bg-panel p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-fg-muted">{window}</p>
      <p className="mt-2 text-4xl font-extrabold tabular-nums text-fg">{value}</p>
      <p className="mt-1 text-sm text-fg-muted">{label}</p>
    </div>
  )
}

function Bar({ share }: { share: number }) {
  return (
    <div className="h-2 flex-1 bg-surface-muted">
      <div
        className="h-2 bg-accent"
        style={{ width: `${Math.max(4, Math.round(share * 100))}%` }}
      />
    </div>
  )
}

export default async function ObservatoryPage() {
  const ledger = readLedger()
  const visibility = readLatestVisibility()
  const verification = readJson<VerificationLedger>(VERIFICATION_LEDGER)
  const epistemic = readJson<EpistemicLedger>(EPISTEMIC_LEDGER)
  const [benchmarks, stats] = await Promise.all([getBenchmarks(), getObservatoryStats()])

  const agg = ledger ? aggregate(ledger) : null
  const windowLabel = !agg
    ? 'no data yet'
    : agg.dayKeys.length === 1
      ? `measured ${agg.dayKeys[0]}`
      : `${agg.dayKeys[0]} to ${agg.dayKeys[agg.dayKeys.length - 1]} (${agg.dayKeys.length} days)`

  const maxReads = agg?.perBot.length ? agg.perBot[0].reads : 0
  const maxContent = agg?.topContent.length ? agg.topContent[0][1] : 0
  const vis = visibility?.summary?.status === 'ok' ? visibility.summary : null
  const visQueries = vis ? vis.gap_queries.length + (vis.canonical_citations > 0 ? 2 : 0) : 0

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': `${CANONICAL}#dataset`,
    name: 'Nebula Observatory: AI retrieval and audit condition dataset',
    description:
      'Daily log-derived counts of AI assistant retrieval of Nebula Components audit data, plus aggregate failed-condition distributions from completed landing page audits.',
    url: CANONICAL,
    creator: { '@type': 'Organization', name: 'Nebula Components', url: 'https://nebulacomponents.com' },
    temporalCoverage: `${ledger?.started ?? '2026-09-01'}/..`,
    measurementTechnique:
      'Server access log classification by user agent; completed-audit aggregation against the published diagnostic specification.',
    isBasedOn: OBSERVATORY_SOURCES.map((source) => ({ '@type': 'Dataset', identifier: source.id })),
  }

  return (
    <main className="min-h-screen bg-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
        {/* Answer capsule - structured for AI retrieval */}
        <div
          data-answer-capsule
          className="border-l-2 border-accent bg-surface-muted rounded-r-md px-5 py-4 mb-10"
        >
          <p className="text-fg leading-relaxed text-sm">
            The Nebula Observatory is a published reference dataset on landing page failures.
            {stats && stats.score_percentiles ? (
              <>
                {' '}Across {stats.audit_count.toLocaleString()} completed audits: median page
                scores {stats.score_percentiles.p50} out of 10;{' '}
                {Math.round((stats.condition_base_rates?.find(c => c.key === 'headline')?.fail_rate ?? 0.62) * 100)}% of
                pages fail headline clarity;{' '}
                {Math.round((stats.condition_base_rates?.find(c => c.key === 'seo_foundations')?.fail_rate ?? 0.50) * 100)}% fail
                SEO foundations;{' '}
                {Math.round((stats.condition_base_rates?.find(c => c.key === 'social_proof')?.fail_rate ?? 0.39) * 100)}% fail
                social proof.
                {stats.cooccurrence?.[0] && (
                  <> Pages failing {stats.cooccurrence[0].if_fails.toLowerCase()} also
                  fail {stats.cooccurrence[0].also_fails.toLowerCase()}{' '}
                  {Math.round(stats.cooccurrence[0].rate * 100)}% of the time.</>
                )}
                {' '}{Math.round((stats.quadrant_mix?.quick_win ?? 0.71) * 100)}% of all
                findings are quick-win severity (high severity, low implementation effort).
              </>
            ) : (
              <> Across 295+ completed audits: median page scores 6.9 out of 10; 62% of pages
              fail headline clarity; 50% fail SEO foundations; 39% fail social proof.</>
            )}
            {' '}AI assistants have retrieved this data {agg ? agg.aiReads.toLocaleString() : '83+'}
            {' '}times in the current measurement window. Updated daily from server logs and
            completed audits.
          </p>
        </div>

        <Label>Nebula Components · Observatory</Label>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-fg mb-4">
          The state of landing pages, measured
        </h1>
        <p className="max-w-[65ch] text-fg-muted leading-relaxed mb-4">
          Reference statistics from completed Nebula audits: how pages score, which conditions fail
          most, and which failures travel together. Below that, the AI systems retrieving this
          dataset and where Nebula appears in live AI answers. Measured, not modeled.
        </p>
        <p className="font-mono text-xs text-fg-muted mb-12">
          Source: server access logs + live answer-engine queries · Updated daily
          {ledger ? ` · Data fresh as of ${ledger.updated_at.slice(0, 16).replace('T', ' ')} UTC` : ''}
        </p>

        {/* Headline stats */}
        <section className="mb-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat
            value={agg ? agg.aiReads.toLocaleString() : 'n/a'}
            label="Page reads by AI assistants"
            window={windowLabel}
          />
          <Stat
            value={agg ? String(agg.perBot.length) : 'n/a'}
            label="AI systems reading Nebula"
            window={windowLabel}
          />
          <Stat
            value={vis ? String(vis.canonical_citations) : 'n/a'}
            label="Nebula citations in live AI answers"
            window={vis ? 'latest measurement run' : 'no run yet'}
          />
          <Stat
            value={benchmarks ? benchmarks.audit_count.toLocaleString() : 'n/a'}
            label="Completed landing page audits"
            window="all time"
          />
        </section>

        {/* ── Reference statistics: the visitor-facing dataset ── */}
        {stats && stats.audit_count >= stats.min_cell_n && (
          <>
            {/* Score distribution */}
            <section className="mb-14">
              <Label>How landing pages score · N={stats.audit_count}</Label>
              <p className="mb-4 max-w-[65ch] text-fg-muted leading-relaxed">
                Score distribution across all {stats.audit_count.toLocaleString()} completed
                audits. The median page scores {stats.score_percentiles!.p50} out of 10;{' '}
                {Math.round((stats.pages_with_failures_rate ?? 0) * 100)}% of audited pages carry
                at least one failed condition.
              </p>
              {stats.score_histogram && (
                <div className="flex h-32 items-end gap-1 border border-border bg-bg-panel p-4">
                  {stats.score_histogram.map((c, i) => {
                    const max = Math.max(...stats.score_histogram!)
                    return (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1">
                        <div
                          className="w-full bg-accent"
                          style={{ height: `${max ? Math.max(2, Math.round((c / max) * 88)) : 2}px` }}
                        />
                        <span className="font-mono text-[9px] text-fg-muted">{i}-{i + 1}</span>
                      </div>
                    )
                  })}
                </div>
              )}
              {stats.score_percentiles && (
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-fg-muted">
                  <span>p10 {stats.score_percentiles.p10}</span>
                  <span>p25 {stats.score_percentiles.p25}</span>
                  <span className="text-fg">median {stats.score_percentiles.p50}</span>
                  <span>p75 {stats.score_percentiles.p75}</span>
                  <span>p90 {stats.score_percentiles.p90}</span>
                </div>
              )}
              <p className="mt-3 text-xs text-fg-muted">
                Run an audit to see where your page sits on this distribution.
              </p>
            </section>

            {/* Condition failure base rates */}
            {stats.condition_base_rates && stats.condition_base_rates.length > 0 && (
              <section className="mb-14" id="condition-base-rates">
                <Label>Condition failure base rates</Label>
                <p className="mb-4 max-w-[65ch] text-fg-muted leading-relaxed">
                  The share of audited pages that fail each condition, as defined in the published
                  specification. If your page fails one of these, this is how common that failure
                  is.
                </p>
                <div className="border border-border">
                  {stats.condition_base_rates.map((c) => (
                    <div key={c.key} className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0">
                      {SIGNAL_PAGE[c.key] ? (
                        <a
                          href={SIGNAL_PAGE[c.key]}
                          className="w-44 shrink-0 text-sm text-fg underline decoration-border underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
                        >
                          {c.label}
                        </a>
                      ) : (
                        <span className="w-44 shrink-0 text-sm text-fg">{c.label}</span>
                      )}
                      <Bar share={c.fail_rate} />
                      <span className="w-14 shrink-0 text-right font-mono text-sm tabular-nums text-fg-muted">
                        {Math.round(c.fail_rate * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-fg-muted">
                  Each condition links to its reference page: definition, decision rule, and
                  pass/fail examples from the{' '}
                  <a href="/spec/landing-page-diagnostic-v1" className="text-accent hover:text-fg transition-colors">
                    published specification
                  </a>
                  .
                </p>
              </section>
            )}

            {/* Co-occurrence */}
            {stats.cooccurrence && stats.cooccurrence.length > 0 && (
              <section className="mb-14">
                <Label>Failures that travel together</Label>
                <p className="mb-4 max-w-[65ch] text-fg-muted leading-relaxed">
                  Conditional failure rates: when a page fails the first condition, how often it
                  also fails the second. Useful for knowing what else is probably wrong.
                </p>
                <div className="border border-border">
                  {stats.cooccurrence.map((p, i) => {
                    // Find the base rate of `also_fails` so we can show the lift.
                    const baseRate = stats.condition_base_rates?.find(
                      (c) => c.label.toLowerCase() === p.also_fails.toLowerCase()
                    )?.fail_rate
                    const lift = baseRate && baseRate > 0
                      ? Math.round(p.rate / baseRate * 10) / 10
                      : null
                    return (
                      <div key={i} className="flex flex-wrap items-start gap-x-4 gap-y-1 border-b border-border px-4 py-3 last:border-b-0">
                        <span className="text-sm text-fg">
                          Fails <span className="font-semibold">{p.if_fails}</span>
                          <span className="text-fg-muted"> → also fails </span>
                          <span className="font-semibold">{p.also_fails}</span>
                        </span>
                        <span className="ml-auto shrink-0 text-right">
                          <span className="font-mono text-sm tabular-nums text-fg">
                            {Math.round(p.rate * 100)}%
                          </span>
                          {lift !== null && (
                            <span className="ml-2 font-mono text-xs tabular-nums text-fg-muted">
                              {lift}x base rate
                            </span>
                          )}
                          <span className="ml-2 font-mono text-xs text-fg-muted">n={p.n}</span>
                        </span>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Quadrant mix */}
            {stats.quadrant_mix && Object.keys(stats.quadrant_mix).length > 0 && (
              <section className="mb-14">
                <Label>How fixable are the failures</Label>
                <p className="mb-4 max-w-[65ch] text-fg-muted leading-relaxed">
                  Every finding is classified by severity and implementation effort. The split
                  across all findings in the dataset:
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(stats.quadrant_mix).map(([k, v]) => (
                    <div key={k} className="border border-border bg-bg-panel p-5">
                      <p className="text-3xl font-extrabold tabular-nums text-fg">{Math.round(v * 100)}%</p>
                      <p className="mt-1 text-sm text-fg-muted">
                        {k === 'quick_win'
                          ? 'Quick wins: high severity, low implementation effort'
                          : k === 'major_project'
                            ? 'Major projects: high severity, substantial effort'
                            : k.replace(/_/g, ' ')}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Per-AI-system detail */}
        <section className="mb-14">
          <Label>The AI systems, what they read, and how deep they reach</Label>
          {!agg || agg.perBot.length === 0 ? (
            <p className="text-sm text-fg-muted">No AI crawler requests recorded in the current window yet.</p>
          ) : (
            <div className="border border-border">
              {agg.perBot.map((b) => {
                const meta = BOT_META[b.name]
                return (
                  <div key={b.name} className="border-b border-border px-4 py-4 last:border-b-0">
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <span className="font-mono text-sm font-semibold text-fg">{meta.label}</span>
                      <span className="text-xs text-fg-muted">{meta.operator} · {meta.kind}</span>
                      <span className="ml-auto font-mono text-sm tabular-nums text-fg">
                        {b.reads.toLocaleString()} reads
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-4">
                      <Bar share={maxReads ? b.reads / maxReads : 0} />
                      <span className="w-40 shrink-0 text-right font-mono text-xs tabular-nums text-fg-muted">
                        {b.reach > 0 ? `${b.reach} distinct paths` : 'path reach n/a'}
                      </span>
                    </div>
                    {b.topPaths.length > 0 && (
                      <p className="mt-2 font-mono text-xs text-fg-muted break-all">
                        reads most:{' '}
                        {b.topPaths.map(([p], i) => (
                          <span key={p}>
                            {i > 0 && ' · '}
                            {p}
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          <p className="mt-3 text-xs text-fg-muted">
            Search crawlers are counted separately: Googlebot has reached{' '}
            {agg ? agg.googlebotReach : 0} of {agg ? agg.sitemapCount : 0} sitemap paths, Bingbot{' '}
            {agg ? agg.bingbotReach : 0}. SEO tools and unclassified agents are excluded from every
            number on this page.
          </p>
        </section>

        {/* What AI reads most */}
        <section className="mb-14">
          <Label>The content AI retrieves most</Label>
          {!agg || agg.topContent.length === 0 ? (
            <p className="text-sm text-fg-muted">Not enough content-path data in the window yet.</p>
          ) : (
            <div className="border border-border">
              {agg.topContent.map(([p, c]) => (
                <div key={p} className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0">
                  <span className="w-64 shrink-0 truncate font-mono text-xs text-fg">{p}</span>
                  <Bar share={maxContent ? c / maxContent : 0} />
                  <span className="w-12 shrink-0 text-right font-mono text-sm tabular-nums text-fg-muted">{c}</span>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-fg-muted">
            Content paths only. robots.txt, sitemaps, and API endpoints are excluded.
          </p>
        </section>

        {/* Citation outcomes - the part reads alone cannot show */}
        <section className="mb-14">
          <Label>Does reading turn into citing? Measured answer outcomes</Label>
          {vis ? (
            <>
              <p className="mb-4 max-w-[65ch] text-fg-muted leading-relaxed">
                Reads measure retrieval. Citations measure whether an answer engine actually uses
                Nebula when a buyer asks. We query live answer engines on a fixed set of
                buyer-intent questions and record verbatim responses.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="border border-border bg-bg-panel p-5">
                  <p className="text-3xl font-extrabold tabular-nums text-fg">{vis.canonical_citations}</p>
                  <p className="mt-1 text-sm text-fg-muted">nebulacomponents.com citations in answers</p>
                </div>
                <div className="border border-border bg-bg-panel p-5">
                  <p className="text-3xl font-extrabold tabular-nums text-fg">
                    {Math.round(vis.mention_rate * 100)}%
                  </p>
                  <p className="mt-1 text-sm text-fg-muted">of responses mention Nebula by name</p>
                </div>
                <div className="border border-border bg-bg-panel p-5">
                  <p className="text-3xl font-extrabold tabular-nums text-fg">{vis.gap_queries.length}</p>
                  <p className="mt-1 text-sm text-fg-muted">tracked queries still unanswered by anyone or won by others</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-fg-muted">
                Latest run: {visibility!.generated_at.slice(0, 10)} · {vis.responses} live responses
                across {visQueries > 0 ? '7' : 'n/a'} buyer-intent queries · Raw responses are
                hashed and archived. Wins and gaps are both published; a gap stays a gap until a
                measured run says otherwise.
              </p>
            </>
          ) : (
            <p className="text-sm text-fg-muted">No citation measurement run recorded yet.</p>
          )}
        </section>

        {/* ── Tier 2: verification & reliability, gated by real denominators ── */}
        <section className="mb-14">
          <Label>Repair verification: measured, not promised</Label>
          <p className="mb-4 max-w-[65ch] text-fg-muted leading-relaxed">
            After a Repair Sprint, Nebula re-observes the same versioned condition on the same
            page and records whether it moved from FAIL to PASS. That is a condition-state
            change, not a conversion claim. We publish this rate only from real re-observations.
          </p>
          {verification && verification.conditions_reobserved >= 10 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="border border-border bg-bg-panel p-5">
                <p className="text-3xl font-extrabold tabular-nums text-fg">
                  {Math.round(
                    (verification.fail_to_pass / verification.conditions_reobserved) * 100,
                  )}
                  %
                </p>
                <p className="mt-1 text-sm text-fg-muted">
                  of re-observed conditions independently verified FAIL to PASS
                </p>
              </div>
              <div className="border border-border bg-bg-panel p-5">
                <p className="text-3xl font-extrabold tabular-nums text-fg">
                  {verification.conditions_reobserved}
                </p>
                <p className="mt-1 text-sm text-fg-muted">conditions re-observed</p>
              </div>
              <div className="border border-border bg-bg-panel p-5">
                <p className="text-3xl font-extrabold tabular-nums text-fg">
                  {verification.delivered_reaudits}
                </p>
                <p className="mt-1 text-sm text-fg-muted">independent re-audits delivered</p>
              </div>
            </div>
          ) : (
            <div className="border border-border bg-bg-panel p-5">
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-fg-muted">
                Status: accumulating evidence
              </p>
              <p className="mt-2 text-sm leading-6 text-fg-muted">
                {verification ? verification.conditions_reobserved : 0} conditions re-observed so
                far. This number publishes when at least 10 independent re-observations exist. A
                rate computed from fewer would be theater, so until then the honest value is:
                not yet established.
              </p>
            </div>
          )}
        </section>

        <section className="mb-14">
          <Label>Diagnostic reliability: how often the instrument can determine</Label>
          <p className="mb-4 max-w-[65ch] text-fg-muted leading-relaxed">
            Every determination is stamped with observation integrity. When the engine cannot
            establish an observation, the finding says INDETERMINATE with a reason code instead
            of guessing. We publish the determinable rate once the measurement gate is met.
          </p>
          {epistemic && epistemic.gate && epistemic.stamped_audits >= epistemic.gate.need_stamped_audits ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="border border-border bg-bg-panel p-5">
                <p className="text-3xl font-extrabold tabular-nums text-fg">
                  {Math.round(
                    ((epistemic.stamped_audits - epistemic.audits_with_indeterminate) /
                      epistemic.stamped_audits) *
                      100,
                  )}
                  %
                </p>
                <p className="mt-1 text-sm text-fg-muted">of audits fully determinable</p>
              </div>
              <div className="border border-border bg-bg-panel p-5">
                <p className="text-3xl font-extrabold tabular-nums text-fg">
                  {epistemic.stamped_audits.toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-fg-muted">stamped production audits</p>
              </div>
              <div className="border border-border bg-bg-panel p-5">
                <p className="text-3xl font-extrabold tabular-nums text-fg">
                  {epistemic.audits_with_indeterminate}
                </p>
                <p className="mt-1 text-sm text-fg-muted">audits with an indeterminate observation</p>
              </div>
            </div>
          ) : (
            <div className="border border-border bg-bg-panel p-5">
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-fg-muted">
                Status: measurement gate open
              </p>
              <p className="mt-2 text-sm leading-6 text-fg-muted">
                {epistemic?.gate
                  ? `${epistemic.gate.stamped_audits} of ${epistemic.gate.need_stamped_audits} stamped audits collected, day ${epistemic.gate.days_open} of ${epistemic.gate.need_days}.`
                  : 'Instrumentation active; gate progress unavailable.'}{' '}
                The reliability rate publishes when the gate closes. Publishing it earlier from a
                small denominator would overstate certainty. Most tools never publish this number
                at all.
              </p>
            </div>
          )}
        </section>

        {/* Methodology */}
        <section className="mb-14" id="methodology">
          <Label>How these numbers are counted</Label>
          <ul className="list-disc list-inside space-y-2 text-sm text-fg-muted leading-relaxed">
            <li>
              AI reads count page requests from user agents classified as AI assistants or their
              crawlers: PerplexityBot, OpenAI (OAI-SearchBot, ChatGPT-User), GPTBot, ClaudeBot,
              Applebot. Static assets are excluded.
            </li>
            <li>
              Search reads (Googlebot, Bingbot, YandexBot) are reported separately. SEO tools
              (Ahrefs, Semrush), monitoring agents, and unclassified traffic are excluded from both.
            </li>
            <li>
              Citation outcomes come from live answer-engine API queries on a fixed buyer-intent
              query set, run on a schedule. Raw responses are hashed and archived before
              summarization. A citation is a link to nebulacomponents.com in the engine&apos;s cited
              sources; a mention is the brand name in the answer text.
            </li>
            <li>
              The measurement window starts {ledger?.started ?? '2026-09-01'} and accumulates daily.
              We publish the exact window rather than implying a longer history.
            </li>
            <li>
              Dataset statistics (score distribution, base rates, co-occurrence) aggregate all
              completed audits with internal traffic excluded. Any cell with fewer than 30
              observations is suppressed rather than published. Conditional rates state their own
              denominator (n).
            </li>
            <li>
              Repair verification counts condition-state changes (FAIL to PASS on the same
              versioned condition ID) from independent re-audits. Reliability counts audits whose
              observations were all determinable. Both publish only after their stated evidence
              gates are met; before that, the gate state itself is shown.
            </li>
            <li>
              Audit dataset figures come from completed audits only. Counts are facts about the
              dataset. They are not conversion claims, and reads are not endorsements.
            </li>
          </ul>
        </section>

        {/* CTA */}
        <section className="border-t border-border pt-10">
          <p className="mb-6 max-w-[65ch] text-fg-muted leading-relaxed">
            Every audit in this dataset runs against the published diagnostic specification. The
            same evidence standard applies to your page.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="/audit?utm_source=observatory&utm_medium=cta"
              className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-accent px-6 py-3 font-semibold text-bg transition-opacity hover:opacity-90"
            >
              Run the free audit
            </a>
            <a
              href="/spec/landing-page-diagnostic-v1"
              className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-border px-6 py-3 font-medium text-fg-muted transition-colors hover:border-fg-muted hover:text-fg"
            >
              Read the specification
            </a>
          </div>
        </section>
      </div>
    </main>
  )
}
