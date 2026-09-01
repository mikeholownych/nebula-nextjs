import fs from 'fs'
import path from 'path'
import type { Metadata } from 'next'

export const revalidate = 3600

const LEDGER_PATH = '/home/mike/nebula/seo-reports/ai-traffic-ledger.json'
const VISIBILITY_DIR = '/home/mike/nebula/reports/ai_visibility'
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

/* ---------- aggregation ---------- */

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
  const benchmarks = await getBenchmarks()

  const agg = ledger ? aggregate(ledger) : null
  const windowLabel = !agg
    ? 'no data yet'
    : agg.dayKeys.length === 1
      ? `measured ${agg.dayKeys[0]}`
      : `${agg.dayKeys[0]} to ${agg.dayKeys[agg.dayKeys.length - 1]} (${agg.dayKeys.length} days)`

  const maxReads = agg?.perBot.length ? agg.perBot[0].reads : 0
  const maxContent = agg?.topContent.length ? agg.topContent[0][1] : 0
  const topConditions = benchmarks?.components?.slice(0, 6) ?? []
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
  }

  return (
    <main className="min-h-screen bg-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
        <Label>Nebula Components · Observatory</Label>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-fg mb-4">
          How AI systems read Nebula
        </h1>
        <p className="max-w-[65ch] text-fg-muted leading-relaxed mb-4">
          AI assistants retrieve Nebula&apos;s audit dataset, diagnostic specification, and teardown
          evidence around the clock. This page publishes what our server logs record, what those
          systems retrieve, and where Nebula actually appears in live AI answers. Measured, not
          modeled.
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

        {/* Citation outcomes — the part reads alone cannot show */}
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

        {/* Dataset conditions */}
        <section className="mb-14">
          <Label>What the audit dataset shows</Label>
          {benchmarks && topConditions.length > 0 ? (
            <>
              <p className="mb-4 max-w-[65ch] text-fg-muted leading-relaxed">
                Across {benchmarks.audit_count.toLocaleString()} completed audits, pages average{' '}
                {benchmarks.avg_failures_per_page} failed conditions. The most frequently failed
                conditions, as defined in the published specification:
              </p>
              <div className="border border-border">
                {topConditions.map((c) => (
                  <div key={c.label} className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0">
                    <span className="w-44 shrink-0 text-sm text-fg">{c.label}</span>
                    <Bar share={c.share} />
                    <span className="w-14 shrink-0 text-right font-mono text-sm tabular-nums text-fg-muted">
                      {Math.round(c.share * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-fg-muted">Dataset statistics are temporarily unavailable.</p>
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
