'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { signalLabel } from '@/app/workspace/signalLabels'

interface PersonalPosition {
  overall_percentile?: number | null
  computed_at?: string | null
  signals?: Record<string, { you_pass: boolean; corpus_ok_rate: number | null }>
  depth?: string
}

/**
 * Signed-in personal positioning against the public benchmark corpus.
 * Depth-aware: paid plans (analytics_depth percentile+) get percentile
 * bars; everyone else sees an honest upsell instead of fake numbers.
 */
export default function PersonalPositioning() {
  const [domain, setDomain] = useState('')
  const [data, setData] = useState<PersonalPosition | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'locked' | 'error' | 'ready'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault()
    const d = domain.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')
    if (!d || d.length < 4) {
      setState('error')
      setMessage('Enter a valid domain like example.com')
      return
    }
    setState('loading')
    setMessage(null)
    try {
      const res = await fetch(`/api/analytics/benchmarks/me?domain=${encodeURIComponent(d)}`, { cache: 'no-store' })
      if (res.status === 403) {
        setState('locked')
        setData(null)
        return
      }
      if (res.status === 404) {
        setState('error')
        setMessage(`No completed audit found for ${d}. Run an audit first, then check back.`)
        return
      }
      if (!res.ok) {
        setState('error')
        setMessage('Positioning is not available right now.')
        return
      }
      const body = await res.json()
      setData(body)
      setState(body?.overall_percentile == null ? 'error' : 'ready')
      if (body?.overall_percentile == null) setMessage('No composite percentile available yet.')
    } catch {
      setState('error')
      setMessage('Network error checking your position.')
    }
  }

  const percentile = data?.overall_percentile != null ? Math.round(data.overall_percentile) : null

  return (
    <section className="border-t border-border px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-xl border border-border bg-[#0d1110] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Your position</p>
          <h2 className="mt-1 text-lg font-semibold text-fg">Where your pages sit against the corpus</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-fg-muted">
            Audited a page with us? Enter its domain to interpolate your latest score into the live distribution.
          </p>

          <form onSubmit={lookup} className="mt-5 flex flex-wrap gap-3">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="yourdomain.com"
              aria-label="Domain to position against the corpus"
              className="min-w-[220px] flex-1 rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-fg placeholder:text-fg-dim focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={state === 'loading'}
              className="rounded-lg bg-accent px-5 py-2.5 text-xs font-bold text-bg hover:opacity-85 disabled:opacity-50"
            >
              {state === 'loading' ? 'Checking…' : 'Show my position'}
            </button>
          </form>

          {state === 'error' && message && (
            <p className="mt-4 rounded-lg border border-danger/40 bg-danger-dim p-3 text-xs text-danger">{message}</p>
          )}

          {state === 'locked' && (
            <div className="mt-5 rounded-lg border border-border bg-bg-elevated p-4">
              <p className="text-sm font-semibold text-fg">Personal positioning is a Pro feature</p>
              <p className="mt-1 text-xs leading-5 text-fg-muted">
                Pro plans and above see their percentile rank against every completed audit in the corpus, per signal.
              </p>
              <Link href="/pricing" className="mt-3 inline-block rounded-lg bg-accent px-4 py-2 text-xs font-bold text-bg hover:opacity-85">
                See plans →
              </Link>
            </div>
          )}

          {state === 'ready' && data && (
            <div className="mt-6 grid gap-8 lg:grid-cols-2">
              {/* Composite percentile */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-fg-dim">Composite percentile</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-mono text-5xl font-black text-accent">{percentile}</span>
                  <span className="text-sm text-fg-muted">out of 100</span>
                </div>
                <div className="mt-4 h-20 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[{ name: 'you', value: percentile }]}
                      layout="vertical"
                      margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                    >
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis type="category" dataKey="name" hide />
                      <ReferenceLine x={50} stroke="#888881" strokeDasharray="3 3" />
                      <Bar dataKey="value" fill="#c7ff2f" background={{ fill: '#161b17' }} radius={[4, 4, 4, 4]} barSize={22} />
                      <Tooltip
                        cursor={false}
                        contentStyle={{ background: '#10140f', border: '1px solid #242a26', borderRadius: 8, fontSize: 12 }}
                        formatter={(v) => [`${v as number}th percentile`, 'Your score beats']}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs leading-5 text-fg-muted">
                  Your latest completed audit for {domain.trim()} scores above {percentile}% of audited landing pages in the corpus.
                  {data.signals && Object.keys(data.signals).length > 0 && (
                    <> Signal level: {Object.entries(data.signals).filter(([, s]) => s.you_pass).length} of {Object.keys(data.signals).length} measured signals pass on your page.</>
                  )}
                </p>
              </div>

              {/* Per-signal markers vs corpus */}
              {data.signals && Object.keys(data.signals).length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-fg-dim">Signal pass vs corpus rate</p>
                  <ul className="mt-3 space-y-2.5">
                    {Object.entries(data.signals).map(([key, s]) => {
                      const rate = s.corpus_ok_rate != null ? Math.round(s.corpus_ok_rate * 100) : null
                      return (
                        <li key={key}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="font-medium text-fg">{signalLabel(key)}</span>
                            <span className={`font-mono font-bold ${s.you_pass ? 'text-accent' : 'text-signal-fail'}`}>
                              {s.you_pass ? 'pass' : 'fail'}
                              {rate != null && <span className="ml-2 font-normal text-fg-muted">corpus {rate}%</span>}
                            </span>
                          </div>
                          <div className="relative h-1.5 overflow-hidden rounded-full bg-bg-elevated">
                            {rate != null && (
                              <div className={`h-full rounded-full ${s.you_pass ? 'bg-accent' : 'bg-signal-fail'}`} style={{ width: `${Math.max(2, rate)}%` }} />
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                  {data.computed_at && (
                    <p className="mt-3 font-mono text-[10px] text-fg-dim">corpus rollup computed {new Date(data.computed_at).toISOString().slice(0, 10)}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
