'use client'

import { useState, useMemo } from 'react'

// ── Constants ──────────────────────────────────────────────────────────────
const AVG_CPC: Record<string, number> = {
  saas: 8,
  ecommerce: 1.5,
  coaching: 6,
  agency: 12,
  b2b: 10,
  fintech: 9,
  other: 4,
}

const BENCHMARK_CVR: Record<string, number> = {
  saas: 3.5,
  ecommerce: 2.5,
  coaching: 4.0,
  agency: 4.5,
  b2b: 2.0,
  fintech: 3.0,
  other: 2.5,
}

const VERTICAL_LABELS: Record<string, string> = {
  saas: 'SaaS',
  ecommerce: 'eCommerce',
  coaching: 'Coaching / Consulting',
  agency: 'Agency',
  b2b: 'B2B Software',
  fintech: 'Fintech',
  other: 'Other',
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${Math.round(n).toLocaleString()}`
}

function leakColor(leak: number) {
  if (leak <= 0) return '#22c55e'
  if (leak < 5000) return '#f59e0b'
  return '#ef4444'
}

// ── Component ──────────────────────────────────────────────────────────────
export default function ROICalculatorClient() {
  const [adSpend, setAdSpend] = useState(2000)
  const [cvr, setCvr] = useState(1.0)
  const [vertical, setVertical] = useState('saas')
  const [aov, setAov] = useState(500)
  const [domain, setDomain] = useState('')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  // ── Calculations ──────────────────────────────────────────────────────────
  const calc = useMemo(() => {
    const cpc = AVG_CPC[vertical] ?? 4
    const benchmarkCvr = BENCHMARK_CVR[vertical] ?? 2.5

    const monthlyVisitors = adSpend / cpc
    const currentConversions = monthlyVisitors * (cvr / 100)
    const benchmarkConversions = monthlyVisitors * (benchmarkCvr / 100)

    const currentRevenue = currentConversions * aov
    const benchmarkRevenue = benchmarkConversions * aov
    const leakMonthly = Math.max(0, benchmarkRevenue - currentRevenue)
    const leakAnnual = leakMonthly * 12

    return {
      monthlyVisitors: Math.round(monthlyVisitors),
      currentConversions: Math.round(currentConversions),
      benchmarkConversions: Math.round(benchmarkConversions),
      currentRevenue,
      benchmarkRevenue,
      leakMonthly,
      leakAnnual,
      benchmarkCvr,
      isBelowBenchmark: cvr < benchmarkCvr,
    }
  }, [adSpend, cvr, vertical, aov])

  async function handleAudit() {
    if (!email || !email.includes('@')) return
    setSending(true)
    const url = domain.trim()
      ? (domain.startsWith('http') ? domain.trim() : `https://${domain.trim()}`)
      : null
    if (url) {
      await fetch('/api/audit/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, email, source: 'roi_calculator' }),
      }).catch(() => {})
    }
    setSent(true)
    setSending(false)
  }

  const lc = leakColor(calc.leakMonthly)

  return (
    <div style={{ minHeight: '100vh', background: '#0a0c0a', color: '#e4e8e0', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 20px 80px' }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
            <rect width="64" height="64" rx="14" fill="#121512"/>
            <rect x="5" y="5" width="54" height="54" rx="11" fill="none" stroke="#c7ff2f" strokeWidth="3"/>
            <circle cx="32" cy="32" r="17.5" fill="#c7ff2f"/>
            <path d="M22 34 L29 41.5 L45 24" fill="none" stroke="#0a0c09" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily: '"IBM Plex Mono","Courier New",monospace', fontSize: 14, fontWeight: 700 }}>Nebula / Ad Spend ROI Calculator</span>
        </div>

        {/* Hero */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 'clamp(24px,5vw,34px)', fontWeight: 700, lineHeight: 1.2, marginBottom: 12, color: '#f0f4ec' }}>
            How much is your landing page costing you every month?
          </h1>
          <p style={{ color: '#8a9488', fontSize: 16, lineHeight: 1.6 }}>
            Enter your numbers. The result updates instantly. No signup to see what you're losing.
          </p>
        </div>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>

          {/* Vertical */}
          <div>
            <label style={{ fontSize: 13, color: '#8a9488', display: 'block', marginBottom: 8 }}>
              Your vertical
              <span style={{ marginLeft: 8, fontSize: 11, color: '#5a6458' }}>
                (sets industry benchmark CVR: {BENCHMARK_CVR[vertical]}%)
              </span>
            </label>
            <select
              id="roi-vertical"
              name="vertical"
              value={vertical}
              onChange={e => setVertical(e.target.value)}
              style={{
                width: '100%', background: '#111411', border: '1.5px solid #2a322a',
                borderRadius: 10, color: '#e4e8e0', fontSize: 14, padding: '12px 16px', outline: 'none',
                boxSizing: 'border-box',
              }}
            >
              {Object.entries(VERTICAL_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* Ad Spend */}
          <div>
            <label style={{ fontSize: 13, color: '#8a9488', display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Monthly ad spend</span>
              <span style={{ color: '#e4e8e0', fontFamily: '"IBM Plex Mono",monospace', fontWeight: 700 }}>
                ${adSpend.toLocaleString()}
              </span>
            </label>
            <input
              id="roi-ad-spend"
              name="ad_spend"
              type="range"
              min={100}
              max={50000}
              step={100}
              value={adSpend}
              onChange={e => setAdSpend(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#c7ff2f' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#3a4238', marginTop: 4 }}>
              <span>$100</span><span>$50,000</span>
            </div>
          </div>

          {/* CVR */}
          <div>
            <label style={{ fontSize: 13, color: '#8a9488', display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Current conversion rate</span>
              <span style={{ color: '#e4e8e0', fontFamily: '"IBM Plex Mono",monospace', fontWeight: 700 }}>
                {cvr.toFixed(1)}%
              </span>
            </label>
            <input
              id="roi-cvr"
              name="cvr"
              type="range"
              min={0.1}
              max={20}
              step={0.1}
              value={cvr}
              onChange={e => setCvr(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#c7ff2f' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#3a4238', marginTop: 4 }}>
              <span>0.1%</span><span>20%</span>
            </div>
          </div>

          {/* AOV */}
          <div>
            <label style={{ fontSize: 13, color: '#8a9488', display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Average order / lead value</span>
              <span style={{ color: '#e4e8e0', fontFamily: '"IBM Plex Mono",monospace', fontWeight: 700 }}>
                ${aov.toLocaleString()}
              </span>
            </label>
            <input
              id="roi-aov"
              name="aov"
              type="range"
              min={10}
              max={10000}
              step={10}
              value={aov}
              onChange={e => setAov(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#c7ff2f' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#3a4238', marginTop: 4 }}>
              <span>$10</span><span>$10,000</span>
            </div>
          </div>
        </div>

        {/* Result */}
        <div style={{ background: '#111411', border: `1.5px solid ${calc.leakMonthly > 0 ? '#3a1414' : '#1e3a1e'}`, borderRadius: 12, padding: 32, marginBottom: 24 }}>

          {/* Monthly leak, the hero number */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.8px', color: '#5a6458', marginBottom: 8 }}>
              Monthly revenue leak
            </div>
            <div style={{
              fontSize: 'clamp(48px,10vw,80px)',
              fontWeight: 900,
              fontFamily: '"IBM Plex Mono","Courier New",monospace',
              color: lc,
              lineHeight: 1,
              marginBottom: 8,
            }}>
              {fmt(calc.leakMonthly)}
            </div>
            <div style={{ fontSize: 13, color: '#5a6458' }}>
              {fmt(calc.leakAnnual)} per year at this rate
            </div>
          </div>

          {/* Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Monthly visitors', value: calc.monthlyVisitors.toLocaleString(), sub: `at ~$${AVG_CPC[vertical]} avg CPC` },
              { label: 'Current conversions', value: calc.currentConversions.toLocaleString(), sub: `at ${cvr.toFixed(1)}% CVR` },
              { label: 'At benchmark CVR', value: calc.benchmarkConversions.toLocaleString(), sub: `${VERTICAL_LABELS[vertical]} avg: ${calc.benchmarkCvr}%` },
              { label: 'Revenue at benchmark', value: fmt(calc.benchmarkRevenue), sub: 'what you could be making' },
            ].map(({ label, value, sub }) => (
              <div key={label} style={{ background: '#0e0f0e', borderRadius: 8, padding: '14px 16px' }}>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: '"IBM Plex Mono",monospace', color: '#e4e8e0', marginBottom: 2 }}>{value}</div>
                <div style={{ fontSize: 12, color: '#5a6458' }}>{label}</div>
                <div style={{ fontSize: 11, color: '#3a4238', marginTop: 2 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Interpretation */}
          {calc.isBelowBenchmark ? (
            <div style={{ background: '#1a0a0a', border: '1px solid #3a1414', borderRadius: 8, padding: 16 }}>
              <p style={{ fontSize: 14, color: '#f87171', lineHeight: 1.6, margin: 0 }}>
                Your {VERTICAL_LABELS[vertical].toLowerCase()} page converts at {cvr.toFixed(1)}%, below the {calc.benchmarkCvr}% industry benchmark.
                That gap is {fmt(calc.leakMonthly)} leaving your funnel every month.
                The fix is rarely the ads. It&apos;s the page.
              </p>
            </div>
          ) : (
            <div style={{ background: '#0a1a0a', border: '1px solid #1e3a1e', borderRadius: 8, padding: 16 }}>
              <p style={{ fontSize: 14, color: '#22c55e', lineHeight: 1.6, margin: 0 }}>
                Your conversion rate is above the {VERTICAL_LABELS[vertical].toLowerCase()} benchmark of {calc.benchmarkCvr}%.
                An audit can show whether there are still structural leaks that limit further growth.
              </p>
            </div>
          )}
        </div>

        {/* CTA */}
        {!sent ? (
          <div style={{ background: '#0e1a0e', border: '1.5px solid #1e3a1e', borderRadius: 12, padding: 28, marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#f0f4ec' }}>
              See what&apos;s killing your conversion.
            </h2>
            <p style={{ fontSize: 14, color: '#8a9488', lineHeight: 1.6, marginBottom: 20 }}>
              Enter your landing page URL and email. Nebula audits your page, names the exact leak, and sends the full findings. The top fix is $97, done in 48 hours.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                id="roi-domain"
                name="domain"
                type="text"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                placeholder="yourdomain.com"
                autoComplete="off"
                spellCheck={false}
                style={{
                  background: '#0a0c0a', border: '1.5px solid #2a322a', borderRadius: 10,
                  color: '#e4e8e0', fontSize: 14, padding: '12px 14px', outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  id="roi-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAudit()}
                  placeholder="your@email.com"
                  style={{
                    flex: 1, background: '#0a0c0a', border: '1.5px solid #2a322a', borderRadius: 10,
                    color: '#e4e8e0', fontSize: 14, padding: '12px 14px', outline: 'none',
                  }}
                />
                <button
                  onClick={handleAudit}
                  disabled={sending || !email}
                  style={{
                    background: '#c7ff2f', color: '#0a0c0a', border: 'none', borderRadius: 10,
                    fontSize: 14, fontWeight: 700, padding: '12px 20px',
                    cursor: sending || !email ? 'not-allowed' : 'pointer',
                    opacity: sending || !email ? .5 : 1, whiteSpace: 'nowrap',
                  }}
                >
                  {sending ? 'Sending...' : 'Audit my page'}
                </button>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#5a6458', marginTop: 8 }}>
              No spam. Your full audit arrives in one email.
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', background: '#0e1a0e', border: '1.5px solid #1e3a1e', borderRadius: 12, marginBottom: 24 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: '#f0f4ec' }}>Audit request received.</h3>
            <p style={{ fontSize: 14, color: '#8a9488' }}>
              Your full findings arrive by email. The top leak is named specifically, with a ranked fix list.
            </p>
          </div>
        )}

        {/* Related tools */}
        <div style={{ paddingTop: 24, borderTop: '1px solid #1e231e', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <a href="/score" style={{ fontSize: 13, color: '#5a6458' }}>Score your page instantly →</a>
          <a href="/funnel-audit" style={{ fontSize: 13, color: '#5a6458' }}>Funnel friction miner →</a>
          <a href="/proof" style={{ fontSize: 13, color: '#5a6458' }}>Real audit data →</a>
        </div>

        {/* Methodology */}
        <div style={{ marginTop: 32, padding: 16, background: '#0e0f0e', borderRadius: 8 }}>
          <p style={{ fontSize: 11, color: '#3a4238', lineHeight: 1.6, margin: 0 }}>
            Methodology: monthly visitors = ad spend / avg CPC by vertical.
            Revenue leak = (benchmark CVR - your CVR) / 100 x monthly visitors x AOV.
            Industry benchmark CVRs and avg CPC estimates based on published paid-search data.
            Results are directional, not guaranteed.
          </p>
        </div>

      </div>
    </div>
  )
}
