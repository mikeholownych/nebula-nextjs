'use client'

import { useState, useRef, useEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────
interface Finding {
  key?: string
  label?: string
  issue?: string
  finding?: string
  description?: string
  impact?: number
  effort?: number
}

interface DimensionScore {
  score: number
  issue?: string
  fix?: string
}

interface AuditResult {
  audit_id?: string
  score: number
  grade: string
  findings: Finding[]
  dimensions?: Record<string, DimensionScore>
}

// ── Helpers ────────────────────────────────────────────────────────────────
function normalizeUrl(raw: string): string | null {
  raw = raw.trim().replace(/\/+$/, '')
  if (!raw) return null
  if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw
  try { new URL(raw); return raw } catch { return null }
}

function scoreColor(s: number) {
  if (s < 5) return '#ef4444'
  if (s < 7) return '#f59e0b'
  return '#22c55e'
}

function dimLabel(key: string) {
  const map: Record<string, string> = {
    headline: 'Headline clarity',
    cta: 'Call to action',
    social_proof: 'Social proof',
    mobile: 'Mobile readiness',
    load_speed: 'Load speed',
    above_fold: 'Above fold',
    ad_signals: 'Analytics / tracking',
    seo_foundations: 'SEO foundations',
    ai_readiness: 'AI readiness',
    ai_crawler_access: 'AI crawler access',
  }
  return map[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const LOADING_PHRASES = [
  'Scanning page structure…',
  'Checking above-fold signals…',
  'Measuring CTA clarity…',
  'Running 9 conversion checks…',
  'Scoring your page…',
]

// ── Component ──────────────────────────────────────────────────────────────
export default function ScoreClient() {
  const [domain, setDomain] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState(LOADING_PHRASES[0])
  const [result, setResult] = useState<AuditResult | null>(null)
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const phraseTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // Pre-fill from query param
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const u = p.get('url') || p.get('domain')
    if (u) {
      const clean = u.replace(/^https?:\/\//i, '').replace(/\/.*/, '')
      setDomain(clean)
      setTimeout(() => runAudit(clean), 300)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function startPhrases() {
    let idx = 0
    setLoadingMsg(LOADING_PHRASES[0])
    phraseTimer.current = setInterval(() => {
      idx = (idx + 1) % LOADING_PHRASES.length
      setLoadingMsg(LOADING_PHRASES[idx])
    }, 1800)
  }

  function stopPhrases() {
    if (phraseTimer.current) { clearInterval(phraseTimer.current); phraseTimer.current = null }
  }

  async function runAudit(domainOverride?: string) {
    const raw = (domainOverride ?? domain).trim()
    const url = normalizeUrl(raw)
    setError('')
    setResult(null)
    setSent(false)

    if (!url) { setError('Enter a valid domain, e.g. yoursite.com'); return }

    setLoading(true)
    setCurrentUrl(url)
    startPhrases()

    try {
      const resp = await fetch('/api/audit/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, source: 'score_page' }),
      })
      const data = await resp.json()
      if (!resp.ok || data.score == null) {
        setError(data.message || 'Could not score that page. Try a different URL.')
        return
      }
      setResult(data as AuditResult)
    } catch {
      setError('Network error, check your connection and try again.')
    } finally {
      stopPhrases()
      setLoading(false)
    }
  }

  async function sendAudit() {
    if (!email || !email.includes('@')) return
    setSending(true)
    try {
      await fetch('/api/audit/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: currentUrl,
          email,
          source: 'score_page_cta',
          ...(result?.audit_id ? { audit_id: result.audit_id } : {}),
        }),
      })
    } finally {
      setSent(true)
      setSending(false)
    }
  }

  const score = result?.score ?? 0
  const dimEntries = result?.dimensions
    ? Object.entries(result.dimensions).sort((a, b) => (a[1].score ?? 0) - (b[1].score ?? 0))
    : []
  const topFinding = result?.findings?.[0]
  const findingText = topFinding?.issue ?? topFinding?.finding ?? topFinding?.description ?? ''

  return (
    <div style={{ minHeight: '100vh', background: '#0a0c0a', color: '#e4e8e0', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 20px 80px' }}>

        {/* Nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
            <rect width="64" height="64" rx="14" fill="#121512"/>
            <rect x="5" y="5" width="54" height="54" rx="11" fill="none" stroke="#c7ff2f" strokeWidth="3"/>
            <circle cx="32" cy="32" r="17.5" fill="#c7ff2f"/>
            <path d="M22 34 L29 41.5 L45 24" fill="none" stroke="#0a0c09" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily: '"IBM Plex Mono","Courier New",monospace', fontSize: 15, fontWeight: 700, letterSpacing: '.5px' }}>Nebula</span>
          </div>
          <a
            href="/audit"
            style={{ fontSize: 13, color: '#8a9488', textDecoration: 'none', borderBottom: '1px solid #2a322a', paddingBottom: 1 }}
          >
            Full audit →
          </a>
        </div>

        {/* Hero */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 'clamp(26px,5vw,36px)', fontWeight: 700, lineHeight: 1.2, marginBottom: 12, color: '#f0f4ec' }}>
            See your landing page conversion score <span style={{ color: '#c7ff2f' }}>now.</span>
          </h1>
          <p style={{ color: '#8a9488', fontSize: 16, lineHeight: 1.6 }}>
            Enter your domain. Your score and top conversion leak appear instantly, no signup, no call, no agency pitch.
          </p>
        </div>

        {/* Input */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
          <input
            id="score-domain"
            name="domain"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runAudit()}
            placeholder="yourdomain.com"
            autoComplete="off"
            spellCheck={false}
            style={{
              flex: 1, background: '#111411', border: '1.5px solid #2a322a',
              borderRadius: 10, color: '#e4e8e0', fontSize: 15, padding: '13px 16px', outline: 'none',
            }}
          />
          <button
            onClick={() => runAudit()}
            disabled={loading}
            style={{
              background: '#c7ff2f', color: '#0a0c0a', border: 'none', borderRadius: 10,
              fontSize: 15, fontWeight: 700, padding: '13px 22px', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? .5 : 1, whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            Score it
          </button>
        </div>
        <div style={{ fontSize: 13, color: '#5a6458' }}>Works on any public landing page or homepage.</div>

        {/* Error */}
        {error && (
          <div style={{ marginTop: 12, background: '#1a0a0a', border: '1px solid #3a1414', borderRadius: 10, padding: '14px 16px', color: '#f87171', fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '24px 0', color: '#8a9488', fontSize: 14 }}>
            <div style={{
              width: 20, height: 20, border: '2px solid #1e231e', borderTopColor: '#c7ff2f',
              borderRadius: '50%', animation: 'spin .7s linear infinite', flexShrink: 0,
            }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            {loadingMsg}
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div style={{ marginTop: 32 }}>

            {/* Score card */}
            <div style={{ background: '#111411', border: '1.5px solid #2a322a', borderRadius: 10, padding: 28, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1, fontFamily: '"IBM Plex Mono","Courier New",monospace', color: scoreColor(score) }}>
                  {score.toFixed(1)}
                </div>
                <div style={{ paddingBottom: 6 }}>
                  <div style={{ fontSize: 13, color: '#5a6458', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 4 }}>Conversion score</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#e4e8e0' }}>Grade {result.grade}</div>
                </div>
              </div>

              {/* Bar */}
              <div style={{ height: 6, background: '#1e231e', borderRadius: 3, marginBottom: 20, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${score * 10}%`, background: scoreColor(score), borderRadius: 3, transition: 'width .6s ease' }} />
              </div>

              {/* Top finding */}
              {findingText && (
                <>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.8px', color: '#5a6458', marginBottom: 8 }}>Top conversion leak</div>
                  <div style={{ fontSize: 15, lineHeight: 1.55, color: '#e4e8e0' }}>{findingText}</div>
                </>
              )}
            </div>

            {/* Dimensions */}
            {dimEntries.length > 0 && (
              <div style={{ background: '#111411', border: '1.5px solid #1e231e', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e231e', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.8px', color: '#5a6458' }}>
                  9-signal breakdown
                </div>
                {dimEntries.map(([key, val]) => {
                  const s = val.score ?? 0
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: '1px solid #1e231e' }}>
                      <span style={{ fontSize: 13, color: '#8a9488', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {dimLabel(key)}
                      </span>
                      <div style={{ flex: 2, height: 4, background: '#1e231e', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${s * 10}%`, background: scoreColor(s), borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 12, fontFamily: '"IBM Plex Mono","Courier New",monospace', color: '#5a6458', width: 32, textAlign: 'right', flexShrink: 0 }}>
                        {s}/10
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* CTA */}
            {!sent ? (
              <div style={{ background: '#0e1a0e', border: '1.5px solid #1e3a1e', borderRadius: 10, padding: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#f0f4ec' }}>Get the full audit + fix list</h2>
                <p style={{ fontSize: 14, color: '#8a9488', lineHeight: 1.6, marginBottom: 20 }}>
                  The score above shows your top leak. The full report maps all 9 signals, ranks them by impact, and sends a prioritized fix list.
                  We fix the highest-impact issue in 48 hours for $97.
                </p>
                <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  <input
                    id="score-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendAudit()}
                    placeholder="your@email.com"
                    autoComplete="email"
                    style={{
                      flex: 1, background: '#0a0c0a', border: '1.5px solid #2a322a',
                      borderRadius: 10, color: '#e4e8e0', fontSize: 14, padding: '12px 14px', outline: 'none',
                    }}
                  />
                  <button
                    onClick={sendAudit}
                    disabled={sending}
                    style={{
                      background: '#c7ff2f', color: '#0a0c0a', border: 'none', borderRadius: 10,
                      fontSize: 14, fontWeight: 700, padding: '12px 20px', cursor: sending ? 'not-allowed' : 'pointer',
                      opacity: sending ? .5 : 1, whiteSpace: 'nowrap', flexShrink: 0,
                    }}
                  >
                    {sending ? 'Sending…' : 'Send my report'}
                  </button>
                </div>
                <div style={{ fontSize: 12, color: '#5a6458' }}>No spam. One email with your full audit. Unsubscribe anytime.</div>

                {/* Direct purchase path for decisive D/F buyers */}
                {score < 6 && (
                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #1e2a1e' }}>
                    <p style={{ fontSize: 12, color: '#5a6458', marginBottom: 10 }}>Already know you want the fix?</p>
                    <a
                      href="https://buy.stripe.com/5kQbJ1eawdj6eql1Jg43S0h"
                      style={{
                        display: 'block', textAlign: 'center', background: 'transparent',
                        border: '1.5px solid #c7ff2f', borderRadius: 10, color: '#c7ff2f',
                        fontSize: 14, fontWeight: 700, padding: '11px 20px', textDecoration: 'none',
                      }}
                    >
                      Fix my top leak now, $97 →
                    </a>
                    <div style={{ fontSize: 11, color: '#3a4438', textAlign: 'center', marginTop: 6 }}>
                      One finding. 48h delivery. No call, no retainer.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '28px', background: '#0e1a0e', border: '1.5px solid #1e3a1e', borderRadius: 10 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: '#f0f4ec' }}>Full audit on the way.</h3>
                <p style={{ fontSize: 14, color: '#8a9488', lineHeight: 1.6, marginBottom: 20 }}>
                  Check your inbox, it includes all 9 signals, ranked by impact, with specific fixes.
                </p>
                <a
                  href="https://buy.stripe.com/5kQbJ1eawdj6eql1Jg43S0h"
                  style={{
                    display: 'inline-block', background: '#c7ff2f', color: '#0a0c0a',
                    borderRadius: 10, fontSize: 14, fontWeight: 700, padding: '12px 24px', textDecoration: 'none',
                  }}
                >
                  Fix the top leak now, $97 →
                </a>
                <div style={{ fontSize: 11, color: '#5a6458', marginTop: 8 }}>No call, no retainer. 48h delivery.</div>
              </div>
            )}

            {/* Proof strip */}
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 32, paddingTop: 24, borderTop: '1px solid #1e231e' }}>
              {[
                ['Free.', 'No signup to see your score.'],
                ['48h', 'fix turnaround on the $97 kit.'],
                ['No calls.', 'No retainer. One problem, one fix.'],
              ].map(([bold, rest]) => (
                <div key={bold} style={{ fontSize: 13, color: '#5a6458' }}>
                  <strong style={{ color: '#8a9488' }}>{bold}</strong> {rest}
                </div>
              ))}
              <div style={{ width: '100%', fontSize: 12, color: '#3a4438', paddingTop: 4 }}>
                Want the full 9-signal breakdown with evidence?{' '}
                <a href="/audit" style={{ color: '#8a9488', textDecoration: 'none', borderBottom: '1px solid #2a322a' }}>Run the full audit →</a>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
