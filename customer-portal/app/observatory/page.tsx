import fs from 'fs'
import type { Metadata } from 'next'

export const revalidate = 3600

const LEDGER_PATH = '/home/mike/nebula/seo-reports/ai-traffic-ledger.json'
const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'
const CANONICAL = 'https://nebulacomponents.com/observatory'

export const metadata: Metadata = {
  title: 'Observatory: Who Reads Nebula Audit Data | Nebula Components',
  description:
    'Live, log-derived counts of the AI systems reading Nebula audit data, the size of the audit dataset, and the most common failed page conditions. Updated daily from server logs and completed audits.',
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: 'Nebula Observatory',
    description:
      'The AI systems reading Nebula audit data, and what the audit dataset shows. Measured, not modeled.',
    url: CANONICAL,
    siteName: 'Nebula Components',
    type: 'website',
  },
}

// Bots we classify as AI assistants/crawlers (not SEO tools, not search engines).
const AI_BOTS = ['PerplexityBot', 'OpenAI', 'GPTBot', 'ClaudeBot', 'Applebot'] as const
const SEARCH_BOTS = ['Googlebot', 'Bingbot', 'YandexBot'] as const

interface DayEntry {
  bot_summary: Record<string, number>
  raw_record_count: number
  sitemap_path_count: number
  googlebot_crawled_count: number
  bingbot_crawled_count: number
}

interface Ledger {
  started: string
  updated_at: string
  days: Record<string, DayEntry>
}

interface BenchmarkData {
  audit_count: number
  avg_failures_per_page: number
  components: Array<{ label: string; failures: number; share: number }>
}

function readLedger(): Ledger | null {
  try {
    return JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8'))
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

function sumBot(days: DayEntry[], names: readonly string[]): number {
  return days.reduce(
    (acc, d) => acc + names.reduce((a, n) => a + (d.bot_summary[n] ?? 0), 0),
    0,
  )
}

function distinctAiSystems(days: DayEntry[]): string[] {
  const seen = new Set<string>()
  for (const d of days) {
    for (const name of AI_BOTS) if ((d.bot_summary[name] ?? 0) > 0) seen.add(name)
  }
  return [...seen]
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mb-3">{children}</p>
  )
}

function Stat({
  value,
  label,
  window,
}: {
  value: string
  label: string
  window: string
}) {
  return (
    <div className="border border-border bg-bg-panel p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-fg-muted">{window}</p>
      <p className="mt-2 text-4xl font-extrabold tabular-nums text-fg">{value}</p>
      <p className="mt-1 text-sm text-fg-muted">{label}</p>
    </div>
  )
}

export default async function ObservatoryPage() {
  const ledger = readLedger()
  const benchmarks = await getBenchmarks()

  const dayKeys = ledger ? Object.keys(ledger.days).sort() : []
  const days = dayKeys.map((k) => ledger!.days[k])
  const windowLabel =
    dayKeys.length === 0
      ? 'no data yet'
      : dayKeys.length === 1
        ? `measured ${dayKeys[0]}`
        : `${dayKeys[0]} to ${dayKeys[dayKeys.length - 1]} (${dayKeys.length} days)`

  const aiReads = days.length ? sumBot(days, AI_BOTS) : null
  const searchReads = days.length ? sumBot(days, SEARCH_BOTS) : null
  const aiSystems = days.length ? distinctAiSystems(days) : []

  // Per-bot totals across the window, AI bots only, descending.
  const perBot = AI_BOTS.map((name) => ({
    name,
    reads: days.reduce((a, d) => a + (d.bot_summary[name] ?? 0), 0),
  }))
    .filter((b) => b.reads > 0)
    .sort((a, b) => b.reads - a.reads)
  const maxReads = perBot.length ? perBot[0].reads : 0

  const topConditions = benchmarks?.components?.slice(0, 5) ?? []

  return (
    <main className="min-h-screen bg-bg">
      <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
        <Label>Nebula Components · Observatory</Label>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-fg mb-4">
          Who reads Nebula audit data
        </h1>
        <p className="max-w-[65ch] text-fg-muted leading-relaxed mb-4">
          AI assistants and search crawlers retrieve Nebula&apos;s published audit dataset,
          diagnostic specification, and teardown evidence. This page publishes what our server logs
          actually record: request counts by classified user agent. Measured, not modeled.
        </p>
        <p className="font-mono text-xs text-fg-muted mb-12">
          Source: server access logs, classified by user agent · Updated daily
          {ledger ? ` · Data fresh as of ${ledger.updated_at.slice(0, 16).replace('T', ' ')} UTC` : ''}
        </p>

        {/* Headline stats */}
        <section className="mb-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat
            value={aiReads === null ? 'n/a' : aiReads.toLocaleString()}
            label="Page reads by AI assistants"
            window={windowLabel}
          />
          <Stat
            value={aiSystems.length ? String(aiSystems.length) : 'n/a'}
            label="Distinct AI systems observed"
            window={windowLabel}
          />
          <Stat
            value={benchmarks ? benchmarks.audit_count.toLocaleString() : 'n/a'}
            label="Completed landing page audits"
            window="all time"
          />
        </section>

        {/* AI systems table */}
        <section className="mb-14">
          <Label>AI systems reading Nebula</Label>
          {perBot.length === 0 ? (
            <p className="text-sm text-fg-muted">
              No AI crawler requests recorded in the current window yet.
            </p>
          ) : (
            <div className="border border-border">
              {perBot.map((b) => (
                <div
                  key={b.name}
                  className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0"
                >
                  <span className="w-36 shrink-0 font-mono text-sm text-fg">{b.name}</span>
                  <div className="h-2 flex-1 bg-surface-muted">
                    <div
                      className="h-2 bg-accent"
                      style={{ width: `${Math.max(4, Math.round((b.reads / maxReads) * 100))}%` }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right font-mono text-sm tabular-nums text-fg-muted">
                    {b.reads.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-fg-muted">
            Search engine crawlers (Googlebot, Bingbot, YandexBot) recorded{' '}
            {searchReads === null ? 'n/a' : searchReads.toLocaleString()} reads in the same window.
            SEO tools and unclassified agents are excluded from the AI count.
          </p>
        </section>

        {/* Dataset conditions */}
        <section className="mb-14">
          <Label>What the audit dataset shows</Label>
          {benchmarks && topConditions.length > 0 ? (
            <>
              <p className="mb-4 max-w-[65ch] text-fg-muted leading-relaxed">
                Across {benchmarks.audit_count.toLocaleString()} completed audits, pages average{' '}
                {benchmarks.avg_failures_per_page} failed conditions. The most frequently failed
                conditions:
              </p>
              <div className="border border-border">
                {topConditions.map((c) => (
                  <div
                    key={c.label}
                    className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0"
                  >
                    <span className="w-44 shrink-0 text-sm text-fg">{c.label}</span>
                    <div className="h-2 flex-1 bg-surface-muted">
                      <div
                        className="h-2 bg-accent"
                        style={{ width: `${Math.max(4, Math.round(c.share * 100))}%` }}
                      />
                    </div>
                    <span className="w-16 shrink-0 text-right font-mono text-sm tabular-nums text-fg-muted">
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
        <section className="mb-14">
          <Label>How these numbers are counted</Label>
          <ul className="list-disc list-inside space-y-2 text-sm text-fg-muted leading-relaxed">
            <li>
              AI reads count page requests from user agents classified as AI assistants or their
              crawlers: PerplexityBot, OpenAI, GPTBot, ClaudeBot, Applebot. Requests for static
              assets are excluded.
            </li>
            <li>
              Search reads count Googlebot, Bingbot, and YandexBot separately. SEO tools (Ahrefs,
              Semrush), monitoring agents, and unclassified traffic are excluded from both counts.
            </li>
            <li>
              The measurement window starts 2026-09-01 and accumulates daily. We publish the exact
              window rather than implying a longer history.
            </li>
            <li>
              Audit dataset figures come from completed audits only. Counts are facts about the
              dataset; they are not conversion claims.
            </li>
          </ul>
        </section>

        {/* CTA */}
        <section className="border-t border-border pt-10">
          <p className="mb-6 max-w-[65ch] text-fg-muted leading-relaxed">
            Every audit in this dataset runs against the published diagnostic specification. Run one
            against your landing page.
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
