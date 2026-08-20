'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui'
import AskAiCitability from '@/app/components/AskAiCitability'
import JsonLdGeneratorModal from '@/app/components/JsonLdGeneratorModal'
import posthog from '@/app/lib/posthog-browser'

interface ComparisonRow {
  id: string
  label: string
  description: string
  scoreA: number
  passA: boolean
  findingA: string
  scoreB: number
  passB: boolean
  findingB: string
  winner: 'A' | 'B' | 'tie'
  delta: number
}

interface ComparisonResult {
  urlA: string
  urlB: string
  query: string | null
  scoreA: number
  scoreB: number
  scoreDiff: number
  overallWinner: 'A' | 'B' | 'tie'
  comparisons: ComparisonRow[]
  advantagesA: string[]
  advantagesB: string[]
  scannedAt: string
}

export default function CompareAuditClient() {
  const [urlA, setUrlA] = useState('')
  const [urlB, setUrlB] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlA.trim() || !urlB.trim()) {
      setError('Please enter both URLs to run the comparison.')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/audit/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urlA: urlA.trim(),
          urlB: urlB.trim(),
          query: query.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Scan failed' }))
        throw new Error(errData.error || 'Failed to compare URLs')
      }

      const data = (await res.json()) as ComparisonResult
      setResult(data)
      posthog.capture('competitor_comparison_run', {
        urlA: data.urlA,
        urlB: data.urlB,
        scoreDiff: data.scoreDiff,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during comparison.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyReport = async () => {
    if (!result) return
    const text = `# Head-to-Head Landing Page Teardown
Your Page (${result.urlA}): ${result.scoreA}/100
Competitor (${result.urlB}): ${result.scoreB}/100
Score Delta: ${result.scoreDiff > 0 ? `+${result.scoreDiff} (You lead)` : `${result.scoreDiff} (Competitor leads)`}

### Signal Comparison:
${result.comparisons.map((c) => `- ${c.label}: Your Page ${c.passA ? 'PASS' : 'FAIL'} (${c.scoreA}/10) vs Competitor ${c.passB ? 'PASS' : 'FAIL'} (${c.scoreB}/10)`).join('\n')}

### Advantages:
- Where You Lead: ${result.advantagesA.join(', ') || 'None'}
- Where Competitor Leads: ${result.advantagesB.join(', ') || 'None'}
`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
      posthog.capture('competitor_comparison_report_copied')
    } catch {
      // fallback
    }
  }

  return (
    <div className="space-y-12">
      {/* Input Form */}
      <Card variant="bordered" className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="urlA" className="block text-sm font-semibold text-fg mb-2">
                Your Landing Page URL <span className="text-accent">*</span>
              </label>
              <input
                id="urlA"
                type="url"
                required
                placeholder="https://yourbrand.com/landing"
                value={urlA}
                onChange={(e) => setUrlA(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm text-fg placeholder:text-fg-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div>
              <label htmlFor="urlB" className="block text-sm font-semibold text-fg mb-2">
                Competitor Landing Page URL <span className="text-accent">*</span>
              </label>
              <input
                id="urlB"
                type="url"
                required
                placeholder="https://competitor.com/lander"
                value={urlB}
                onChange={(e) => setUrlB(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm text-fg placeholder:text-fg-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="query" className="block text-sm font-medium text-fg-muted mb-2">
              Target Search Keyword or Ad Headline (Optional)
            </label>
            <input
              id="query"
              type="text"
              placeholder="e.g. Best landing page audit tool for B2B SaaS"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm text-fg placeholder:text-fg-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs font-semibold text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-8 py-3.5 text-sm font-bold text-bg hover:opacity-85 disabled:opacity-50 transition-opacity"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Auditing both pages side-by-side...</span>
              </>
            ) : (
              <span>Run Head-to-Head Comparison →</span>
            )}
          </button>
        </form>
      </Card>

      {/* Results View */}
      {result && (
        <section aria-labelledby="results-heading" className="space-y-8 animate-fadeIn">
          {/* Header Score Card */}
          <div className="grid gap-6 sm:grid-cols-3">
            <Card variant="bordered" className="p-6 text-center border-accent/40 bg-accent/5">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">Your Page</p>
              <div className="text-4xl font-extrabold text-fg">{result.scoreA}</div>
              <p className="mt-1 text-xs text-fg-muted truncate">{result.urlA}</p>
            </Card>

            <Card variant="bordered" className="p-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted mb-2">Competitor</p>
              <div className="text-4xl font-extrabold text-fg">{result.scoreB}</div>
              <p className="mt-1 text-xs text-fg-muted truncate">{result.urlB}</p>
            </Card>

            <Card variant="bordered" className="p-6 text-center flex flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted mb-2">Score Delta</p>
              <div className={`text-3xl font-extrabold ${result.scoreDiff >= 0 ? 'text-accent' : 'text-red-400'}`}>
                {result.scoreDiff > 0 ? `+${result.scoreDiff}` : result.scoreDiff}
              </div>
              <p className="mt-1 text-xs text-fg-muted">
                {result.scoreDiff > 0 ? 'You hold the advantage' : result.scoreDiff < 0 ? 'Competitor leads' : 'Even match'}
              </p>
            </Card>
          </div>

          {/* Advantages Callouts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card variant="bordered" className="p-6">
              <h3 className="text-sm font-bold text-fg flex items-center gap-2 mb-3">
                <span className="text-accent">✓</span> Where Your Page Leads
              </h3>
              {result.advantagesA.length > 0 ? (
                <ul className="space-y-2 text-xs text-fg-muted">
                  {result.advantagesA.map((adv) => (
                    <li key={adv} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      <span className="font-semibold text-fg">{adv}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-fg-muted">Competitor matches or exceeds all tested signals.</p>
              )}
            </Card>

            <Card variant="bordered" className="p-6">
              <h3 className="text-sm font-bold text-fg flex items-center gap-2 mb-3">
                <span className="text-red-400">⚠</span> Where Competitor Has the Edge
              </h3>
              {result.advantagesB.length > 0 ? (
                <ul className="space-y-2 text-xs text-fg-muted">
                  {result.advantagesB.map((adv) => (
                    <li key={adv} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                      <span className="font-semibold text-fg">{adv}</span> (Fix this leak first)
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-fg-muted">Your page leads or ties on all conversion signals.</p>
              )}
            </Card>
          </div>

          {/* Detailed 9-Signal Comparison Table */}
          <Card variant="bordered" className="overflow-hidden">
            <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-fg">9-Signal Conversion &amp; AEO Breakdown</h3>
                <p className="text-xs text-fg-muted">Side-by-side inspection of public HTML and conversion mechanics</p>
              </div>
              <button
                onClick={handleCopyReport}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3.5 py-1.5 text-xs font-semibold text-fg hover:border-accent hover:text-accent transition-colors"
              >
                {copied ? '✓ Report Copied' : '⎘ Copy Comparison Report'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-bg-panel/50 text-fg-muted">
                    <th className="p-4 font-semibold">Signal</th>
                    <th className="p-4 font-semibold">Your Page</th>
                    <th className="p-4 font-semibold">Competitor</th>
                    <th className="p-4 font-semibold">Advantage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.comparisons.map((row) => (
                    <tr key={row.id} className="hover:bg-bg-panel/30 transition-colors">
                      <td className="p-4 align-top">
                        <div className="font-bold text-fg">{row.label}</div>
                        <div className="text-2xs text-fg-muted max-w-xs">{row.description}</div>
                      </td>
                      <td className="p-4 align-top">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex rounded px-1.5 py-0.5 text-2xs font-extrabold ${row.passA ? 'bg-accent/20 text-accent' : 'bg-red-500/20 text-red-400'}`}>
                            {row.passA ? 'PASS' : 'FAIL'}
                          </span>
                          <span className="font-mono text-xs">{row.scoreA}/10</span>
                        </div>
                        <p className="text-2xs text-fg-muted">{row.findingA}</p>
                      </td>
                      <td className="p-4 align-top">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex rounded px-1.5 py-0.5 text-2xs font-extrabold ${row.passB ? 'bg-accent/20 text-accent' : 'bg-red-500/20 text-red-400'}`}>
                            {row.passB ? 'PASS' : 'FAIL'}
                          </span>
                          <span className="font-mono text-xs">{row.scoreB}/10</span>
                        </div>
                        <p className="text-2xs text-fg-muted">{row.findingB}</p>
                      </td>
                      <td className="p-4 align-top font-semibold">
                        {row.winner === 'A' ? (
                          <span className="text-accent">Your Advantage (+{row.delta})</span>
                        ) : row.winner === 'B' ? (
                          <span className="text-red-400">Competitor Leads (+{row.delta})</span>
                        ) : (
                          <span className="text-fg-muted">Tied</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Action CTA */}
          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-8 text-center">
            <h3 className="text-xl font-bold text-fg mb-2">
              Fix Your Conversion Leaks Before Your Competitor Catches Up
            </h3>
            <p className="max-w-2xl mx-auto text-sm text-fg-muted mb-6">
              Get the $97 One-Leak Repair Sprint: a guaranteed copy and code replacement package for your highest-priority failed signal with a 30-day verified re-audit.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/audit"
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-xs font-bold text-bg hover:opacity-85 transition-opacity"
              >
                <span>Run Full Single-Page Audit →</span>
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg px-6 py-3 text-xs font-bold text-fg hover:border-accent hover:text-accent transition-colors"
              >
                <span>View $97 Repair Sprint Details</span>
              </Link>
            </div>
          </div>

          {/* Additional Tools */}
          <div className="space-y-6">
            <JsonLdGeneratorModal pageUrl={result.urlA} />
            <AskAiCitability pageUrl={result.urlA} />
          </div>
        </section>
      )}
    </div>
  )
}
