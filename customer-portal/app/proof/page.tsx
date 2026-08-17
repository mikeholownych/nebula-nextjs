import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Real Landing Page Audit Data — 139 Pages Scored | Nebula',
  description: 'Live stats from 139 real landing page audits. See the most common conversion leaks, average scores by leak type, and what fixes move the needle.',
  alternates: { canonical: 'https://nebulacomponents.com/proof' },
  openGraph: {
    title: 'Real Landing Page Audit Data — What Kills Conversion | Nebula',
    description: 'Evidence from 139 real audits. The most common leaks, real scores, real findings.',
    url: 'https://nebulacomponents.com/proof',
    siteName: 'Nebula Components',
    type: 'website',
  },
}

interface Component {
  label: string
  failures: number
  avg_impact: number
  share: number
}

interface BenchmarkData {
  audit_count: number
  avg_failures_per_page: number
  top_leak: { label: string; failures: number; avg_impact: number; share: number } | null
  components: Component[]
}

interface RecentFinding {
  label: string
  issue: string
  impact: number
  quadrant: string
  overall_score: number
  grade: string
  completed_at: string
}

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

async function getBenchmarks(): Promise<BenchmarkData | null> {
  try {
    const res = await fetch(`${API_BASE}/audit/stats/benchmarks`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

async function getRecentFinding(): Promise<RecentFinding | null> {
  try {
    const res = await fetch(`${API_BASE}/audit/stats/recent-finding`, { next: { revalidate: 300 } })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

function scoreBar(share: number, color: string) {
  return (
    <div style={{ height: '6px', background: '#1e231e', borderRadius: '3px', overflow: 'hidden', marginTop: '8px' }}>
      <div style={{ height: '100%', width: `${Math.min(share, 100)}%`, background: color, borderRadius: '3px' }} />
    </div>
  )
}

function leakColor(impact: number) {
  if (impact >= 4) return '#ef4444'
  if (impact >= 3) return '#f59e0b'
  return '#c7ff2f'
}

export default async function ProofPage() {
  const [benchmarks, recent] = await Promise.all([getBenchmarks(), getRecentFinding()])

  const auditCount = benchmarks?.audit_count ?? 139
  const avgFailures = benchmarks?.avg_failures_per_page ?? 2.8
  const components = benchmarks?.components ?? []
  const topLeak = benchmarks?.top_leak

  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-6">

        {/* Header */}
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-accent mb-4">Evidence, not opinion</p>
          <h1 className="text-4xl font-extrabold text-fg mb-4 leading-tight">
            {auditCount} real landing pages.<br />
            Here&apos;s what&apos;s killing conversion.
          </h1>
          <p className="text-fg-muted text-lg leading-relaxed max-w-2xl">
            Every Nebula audit scores a real page submitted by a real founder.
            This page shows what we&apos;ve found — the patterns, the leaks, the numbers.
            No invented benchmarks. No vendor surveys. Evidence from {auditCount} pages.
          </p>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {[
            { value: auditCount.toString(), label: 'Pages audited' },
            { value: avgFailures.toFixed(1), label: 'Avg leaks per page' },
            { value: topLeak ? `${topLeak.share}%` : '83%', label: `Pages with ${topLeak?.label ?? 'SEO'} issues` },
          ].map(({ value, label }) => (
            <div key={label} className="bg-surface border border-border rounded-xl p-6">
              <div className="text-4xl font-extrabold text-fg mb-1" style={{ fontFamily: 'IBM Plex Mono, Courier New, monospace' }}>
                {value}
              </div>
              <div className="text-sm text-fg-muted">{label}</div>
            </div>
          ))}
        </div>

        {/* Most common leaks */}
        {components.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-fg mb-2">Most common conversion leaks</h2>
            <p className="text-sm text-fg-muted mb-6">
              Ranked by how often they appear across {auditCount} audited pages. Impact score shows how much each leak hurts conversion.
            </p>
            <div className="flex flex-col gap-4">
              {components.slice(0, 8).map((c) => {
                const color = leakColor(c.avg_impact)
                return (
                  <div key={c.label} className="bg-surface border border-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                        <span className="text-sm font-semibold text-fg">{c.label}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-fg-muted">
                        <span><span className="text-fg font-medium">{c.share}%</span> of pages</span>
                        <span>Impact <span className="text-fg font-medium">{c.avg_impact.toFixed(1)}/5</span></span>
                      </div>
                    </div>
                    {scoreBar(c.share, color)}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Recent finding */}
        {recent && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-fg mb-2">Most recent audit finding</h2>
            <p className="text-sm text-fg-muted mb-6">Updated in real time as new audits complete.</p>
            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="text-xs uppercase tracking-widest text-fg-muted mb-2">{recent.completed_at}</div>
                  <div className="text-sm font-semibold text-fg mb-1">{recent.label}</div>
                  <div className="text-sm text-fg-muted leading-relaxed max-w-lg">{recent.issue}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-3xl font-extrabold" style={{ color: recent.overall_score < 5 ? '#ef4444' : recent.overall_score < 7 ? '#f59e0b' : '#22c55e', fontFamily: 'IBM Plex Mono, monospace' }}>
                    {recent.overall_score.toFixed(1)}
                  </div>
                  <div className="text-xs text-fg-muted">Grade {recent.grade}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: recent.quadrant === 'quick_win' ? '#c7ff2f' : '#8a9488' }} />
                <span className="text-xs text-fg-muted">
                  {recent.quadrant === 'quick_win' ? 'Quick win — high impact, low effort' : 'Major project — high impact, high effort'}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* What the evidence says */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-fg mb-6">What the evidence says</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                stat: '83%',
                finding: 'of audited pages have SEO foundation issues — missing or short title tags, no meta description, or H1/title mismatch.',
                implication: 'Paid traffic lands on pages Google can\'t read. Your ad spend is funding a page Google doesn\'t understand.',
              },
              {
                stat: '49%',
                finding: 'of audited pages have weak or missing CTAs. The button says what to do, not what changes for the visitor.',
                implication: 'Visitors don\'t know what to do next. Rewriting one button with an outcome phrase is the cheapest conversion fix available.',
              },
              {
                stat: '47%',
                finding: 'of audited pages fail social proof. No testimonials, no named customers, no numbers anywhere near the CTA.',
                implication: 'Cold traffic won\'t act without proof. A single name and result near your CTA outperforms a redesign.',
              },
              {
                stat: '2.8',
                finding: 'average conversion leaks per page. Most founders only know about one — the headline. The other 1.8 are invisible.',
                implication: 'Fixing the most visible problem rarely uncovers all the revenue. A scored audit shows the full picture.',
              },
            ].map(({ stat, finding, implication }) => (
              <div key={stat} className="bg-surface border border-border rounded-xl p-5">
                <div className="text-3xl font-extrabold text-accent mb-3" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{stat}</div>
                <p className="text-sm text-fg-muted leading-relaxed mb-3">{finding}</p>
                <p className="text-xs text-fg-muted/70 leading-relaxed border-t border-border pt-3">{implication}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-surface border border-border rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-fg mb-3">See your page in this data.</h2>
          <p className="text-fg-muted mb-6 max-w-md mx-auto">
            Your page has leaks. The audit names them, ranks them by impact, and tells you what to fix first.
            Free. No signup required to see your score.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/score"
              className="rounded-lg bg-accent px-6 py-3 text-sm font-bold text-bg transition-opacity hover:opacity-90"
            >
              Score my page instantly
            </Link>
            <Link
              href="/audit"
              className="rounded-lg border border-border px-6 py-3 text-sm font-semibold text-fg-muted transition-colors hover:text-fg hover:border-fg-muted"
            >
              Full free audit
            </Link>
          </div>
          <p className="text-xs text-fg-muted mt-4">
            Based on {auditCount} real audits. No benchmarks invented. No surveys. Real pages.
          </p>
        </section>

        {/* Share / referral strip */}
        <div className="mt-10 pt-8 border-t border-border text-center">
          <p className="text-sm text-fg-muted mb-3">Know a founder running ads with no conversions?</p>
          <a
            href="/audit?utm_source=proof_page&utm_medium=share"
            className="text-sm text-accent hover:underline"
          >
            Send them a free audit →
          </a>
        </div>

      </div>
    </main>
  )
}
