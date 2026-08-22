'use client'

import { useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────
interface StepResult {
  url: string
  label: string
  score: number | null
  grade: string | null
  topIssue: string | null
  loading: boolean
  error: string | null
}

interface Finding {
  issue?: string
  finding?: string
  impact?: number
  label?: string
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

function frictionLabel(score: number) {
  if (score < 4) return { text: 'Critical friction', color: '#ef4444' }
  if (score < 6) return { text: 'High friction', color: '#f59e0b' }
  if (score < 7.5) return { text: 'Moderate friction', color: '#eab308' }
  return { text: 'Low friction', color: '#22c55e' }
}

const STEP_LABELS = ['Landing Page', 'Signup / Checkout', 'Confirmation / Thank You']
const STEP_DESCRIPTIONS = [
  'Where paid traffic lands. This is usually where most of the leak happens.',
  'The step where visitors decide to act. Friction here blocks conversions.',
  'The confirmation page. Friction here blocks referrals and repeat purchases.',
]

// ── Component ──────────────────────────────────────────────────────────────
export default function FunnelAuditClient() {
  const [urls, setUrls] = useState(['', '', ''])
  const [steps, setSteps] = useState<StepResult[]>([])
  const [running, setRunning] = useState(false)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  function updateUrl(i: number, val: string) {
    setUrls(prev => { const n = [...prev]; n[i] = val; return n })
  }

  const filledUrls = urls.filter(u => u.trim())

  async function runFunnelAudit() {
    const targets = urls.map((u, i) => ({ raw: u.trim(), label: STEP_LABELS[i] })).filter(t => t.raw)
    if (targets.length === 0) return

    setRunning(true)
    const initial: StepResult[] = targets.map(t => ({
      url: normalizeUrl(t.raw) || t.raw,
      label: t.label,
      score: null,
      grade: null,
      topIssue: null,
      loading: true,
      error: null,
    }))
    setSteps(initial)

    // Run sequentially so state updates are visible per step
    const results = [...initial]
    for (let i = 0; i < targets.length; i++) {
      const url = normalizeUrl(targets[i].raw)
      if (!url) {
        results[i] = { ...results[i], loading: false, error: 'Invalid URL' }
        setSteps([...results])
        continue
      }
      try {
        const resp = await fetch('/api/audit/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, source: 'funnel_audit' }),
        })
        const data = await resp.json()
        if (!resp.ok || data.score == null) {
          results[i] = { ...results[i], loading: false, error: data.message || 'Could not score this page' }
        } else {
          const findings: Finding[] = data.findings || []
          const top = findings[0]
          results[i] = {
            ...results[i],
            score: data.score,
            grade: data.grade,
            topIssue: top?.issue || top?.finding || null,
            loading: false,
            error: null,
          }
        }
      } catch {
        results[i] = { ...results[i], loading: false, error: 'Network error' }
      }
      setSteps([...results])
    }
    setRunning(false)
  }

  async function sendReport() {
    if (!email || !email.includes('@')) return
    setSending(true)
    const firstUrl = steps.find(s => s.score != null)?.url
    if (firstUrl) {
      await fetch('/api/audit/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: firstUrl, email, source: 'funnel_audit_report' }),
      }).catch(() => {})
    }
    setSent(true)
    setSending(false)
  }

  const scored = steps.filter(s => s.score != null)
  const worstStep = scored.length > 0
    ? scored.reduce((a, b) => (a.score! < b.score! ? a : b))
    : null

  return (
    <div style={{ minHeight: '100vh', background: '#0a0c0a', color: '#e4e8e0', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 20px 80px' }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
            <rect width="64" height="64" rx="14" fill="#121512"/>
            <rect x="5" y="5" width="54" height="54" rx="11" fill="none" stroke="#c7ff2f" strokeWidth="3"/>
            <circle cx="32" cy="32" r="17.5" fill="#c7ff2f"/>
            <path d="M22 34 L29 41.5 L45 24" fill="none" stroke="#0a0c09" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily: '"IBM Plex Mono","Courier New",monospace', fontSize: 14, fontWeight: 700 }}>Nebula / Funnel Friction Miner</span>
        </div>

        {/* Hero */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 'clamp(24px,5vw,34px)', fontWeight: 700, lineHeight: 1.2, marginBottom: 12, color: '#f0f4ec' }}>
            Discover Where Your Funnel Breaks to Save Wasted Ad Spend
          </h1>
          <p style={{ color: '#8a9488', fontSize: 16, lineHeight: 1.6 }}>
            Enter up to 3 URLs. Nebula scores each step and shows exactly where conversion drops, so you fix the right leak first, not the last one.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <a
              href="/audit"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: '#c7ff2f', color: '#0a0c0a', fontWeight: 700, fontSize: 14,
                padding: '10px 18px', borderRadius: 8, textDecoration: 'none'
              }}
            >
              Get free landing page audit →
            </a>
          </div>
        </div>

        {/* URL Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {STEP_LABELS.map((label, i) => (
            <div key={i}>
              <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.8px', color: '#5a6458', marginBottom: 6 }}>
                Step {i + 1}, {label} {i > 0 && <span style={{ color: '#2a322a' }}>(optional)</span>}
              </div>
              <input
                id={"funnel-url-" + i}
                name={"funnel_url_" + i}
                value={urls[i]}
                onChange={e => updateUrl(i, e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !running && runFunnelAudit()}
                placeholder={`https://your${i === 0 ? 'domain' : i === 1 ? 'domain/signup' : 'domain/thank-you'}.com`}
                autoComplete="off"
                spellCheck={false}
                style={{
                  width: '100%', background: '#111411', border: '1.5px solid #2a322a',
                  borderRadius: 10, color: '#e4e8e0', fontSize: 14, padding: '12px 16px', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ fontSize: 12, color: '#3a4238', marginTop: 4 }}>{STEP_DESCRIPTIONS[i]}</div>
            </div>
          ))}
        </div>

        <button
          onClick={runFunnelAudit}
          disabled={running || filledUrls.length === 0}
          style={{
            background: '#c7ff2f', color: '#0a0c0a', border: 'none', borderRadius: 10,
            fontSize: 15, fontWeight: 700, padding: '13px 28px', cursor: running || filledUrls.length === 0 ? 'not-allowed' : 'pointer',
            opacity: running || filledUrls.length === 0 ? .5 : 1, marginBottom: 40,
          }}
        >
          {running ? 'Scanning funnel...' : 'Scan my funnel'}
        </button>

        {/* Results */}
        {steps.length > 0 && (
          <div style={{ marginTop: 8 }}>

            {/* Step cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {steps.map((step, i) => (
                <div key={i} style={{
                  background: '#111411', border: `1.5px solid ${step.score != null && step.score < 5 ? '#3a1414' : '#2a322a'}`,
                  borderRadius: 10, padding: '20px 24px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.8px', color: '#5a6458', marginBottom: 4 }}>
                        Step {i + 1}, {step.label}
                      </div>
                      <div style={{ fontSize: 13, color: '#5a6458', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 360 }}>
                        {step.url}
                      </div>
                    </div>
                    {step.loading && (
                      <div style={{ fontSize: 13, color: '#8a9488', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 16, height: 16, border: '2px solid #1e231e', borderTopColor: '#c7ff2f', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                        Scanning...
                      </div>
                    )}
                    {!step.loading && step.score != null && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 36, fontWeight: 800, fontFamily: '"IBM Plex Mono","Courier New",monospace', color: scoreColor(step.score), lineHeight: 1 }}>
                          {step.score.toFixed(1)}
                        </div>
                        <div style={{ fontSize: 11, color: '#5a6458' }}>/ 10 · Grade {step.grade}</div>
                      </div>
                    )}
                    {!step.loading && step.error && (
                      <div style={{ fontSize: 13, color: '#f87171' }}>{step.error}</div>
                    )}
                  </div>

                  {step.score != null && (
                    <>
                      {/* Friction bar */}
                      <div style={{ height: 5, background: '#1e231e', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
                        <div style={{ height: '100%', width: '100%', transform: `scaleX(${Math.max(0, Math.min(1, (step.score || 0) / 10))})`, transformOrigin: 'left', background: scoreColor(step.score), borderRadius: 3, transition: 'transform .5s ease' }} />
                      </div>
                      {/* Friction label */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: step.topIssue ? 10 : 0 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: frictionLabel(step.score).color, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: frictionLabel(step.score).color, fontWeight: 600 }}>{frictionLabel(step.score).text}</span>
                        {worstStep?.url === step.url && steps.length > 1 && (
                          <span style={{ fontSize: 11, background: '#1a0a0a', color: '#f87171', border: '1px solid #3a1414', borderRadius: 20, padding: '2px 8px' }}>
                            Biggest leak
                          </span>
                        )}
                      </div>
                      {step.topIssue && (
                        <div style={{ fontSize: 13, color: '#8a9488', lineHeight: 1.5, marginTop: 8 }}>
                          {step.topIssue}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Friction map, only when 2+ steps scored */}
            {scored.length >= 2 && (
              <div style={{ background: '#0e1a0e', border: '1.5px solid #1e3a1e', borderRadius: 10, padding: 24, marginBottom: 24 }}>
                <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.8px', color: '#5a6458', marginBottom: 16 }}>Funnel friction map</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
                  {scored.map((step, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ textAlign: 'center', minWidth: 80 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%', border: `2px solid ${scoreColor(step.score!)}`,
                          background: '#111411', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          margin: '0 auto 4px', fontSize: 13, fontWeight: 700, color: scoreColor(step.score!),
                          fontFamily: '"IBM Plex Mono",monospace',
                        }}>
                          {step.score!.toFixed(1)}
                        </div>
                        <div style={{ fontSize: 11, color: '#5a6458', whiteSpace: 'nowrap' }}>{step.label}</div>
                      </div>
                      {i < scored.length - 1 && (
                        <div style={{ flex: 1, height: 2, background: '#1e231e', minWidth: 24, margin: '0 8px', marginBottom: 16 }} />
                      )}
                    </div>
                  ))}
                </div>
                {worstStep && (
                  <div style={{ marginTop: 16, fontSize: 14, color: '#e4e8e0', lineHeight: 1.6 }}>
                    <strong style={{ color: '#f87171' }}>Biggest leak:</strong> {worstStep.label} scored {worstStep.score!.toFixed(1)}/10.
                    {scored.length > 1 && worstStep.topIssue && ` ${worstStep.topIssue}`}
                  </div>
                )}
              </div>
            )}

            {/* CTA */}
            {!sent && scored.length > 0 && worstStep && (
              <div style={{ background: '#0e1a0e', border: '1.5px solid #1e3a1e', borderRadius: 10, padding: 28 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#f0f4ec' }}>
                  Fix the biggest leak first.
                </h2>
                <p style={{ fontSize: 14, color: '#8a9488', lineHeight: 1.6, marginBottom: 20 }}>
                  Your {worstStep.label.toLowerCase()} is the highest-friction step. Enter your email and we send the full audit with ranked fixes. We fix the top issue in 48 hours for $97.
                </p>
                <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  <input
                    id="funnel-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendReport()}
                    placeholder="your@email.com"
                    style={{
                      flex: 1, background: '#0a0c0a', border: '1.5px solid #2a322a',
                      borderRadius: 10, color: '#e4e8e0', fontSize: 14, padding: '12px 14px', outline: 'none',
                    }}
                  />
                  <button
                    onClick={sendReport}
                    disabled={sending}
                    style={{
                      background: '#c7ff2f', color: '#0a0c0a', border: 'none', borderRadius: 10,
                      fontSize: 14, fontWeight: 700, padding: '12px 20px',
                      cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? .5 : 1, whiteSpace: 'nowrap',
                    }}
                  >
                    {sending ? 'Sending...' : 'Get full report'}
                  </button>
                </div>
                <div style={{ fontSize: 12, color: '#5a6458' }}>No spam. Your full funnel analysis in one email.</div>
              </div>
            )}

            {sent && (
              <div style={{ textAlign: 'center', padding: '24px', background: '#0e1a0e', border: '1.5px solid #1e3a1e', borderRadius: 10 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: '#f0f4ec' }}>Full report on the way.</h3>
                <p style={{ fontSize: 14, color: '#8a9488' }}>Check your inbox. It includes all friction points, ranked by priority.</p>
              </div>
            )}

          </div>
        )}

        {/* Related */}
        <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid #1e231e', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <a href="/score" style={{ fontSize: 13, color: '#5a6458' }}>Score a single page →</a>
          <a href="/audit" style={{ fontSize: 13, color: '#5a6458' }}>Full page audit →</a>
          <a href="/roi-calculator" style={{ fontSize: 13, color: '#5a6458' }}>Calculate your recovered-revenue opportunity →</a>
        </div>

      </div>
    </div>
  )
}
