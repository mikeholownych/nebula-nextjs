'use client'

import { useEffect, useRef, useState } from 'react'

interface SelfScanSignal {
  key: string
  label: string
  score: number
  pass: boolean
}

interface SelfScanSnapshot {
  url: string
  overall: number
  grade: string
  signals: SelfScanSignal[]
  scanned_at: string
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const hours = Math.max(0, Math.round((Date.now() - then) / 3_600_000))
  if (hours < 1) return 'just now'
  if (hours === 1) return '1h ago'
  if (hours < 48) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

/**
 * Runs the real audit engine against nebulacomponents.com's own page on a
 * schedule (scripts/self_scan.py) and replays the last snapshot here as a
 * calibration-style reveal — proof by demonstration before any sales copy.
 * Not a live per-visitor scan: the JSON is static and cached, so this can't
 * ironically hurt the page's own load-speed signal. Triggers when the
 * component enters the viewport, not on raw page load.
 */
export default function SelfScan() {
  const [snapshot, setSnapshot] = useState<SelfScanSnapshot | null>(null)
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    let cancelled = false
    fetch('/self_scan.json', { cache: 'default' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SelfScanSnapshot | null) => {
        if (!cancelled && data && Array.isArray(data.signals)) setSnapshot(data)
      })
      .catch(() => {
        // No snapshot yet, or fetch failed — render nothing rather than fake data.
      })
    return () => {
      cancelled = true
    }
  }, [visible])

  return (
    <div ref={ref} className="mx-auto mt-10 max-w-lg text-left min-h-[220px]" aria-live="polite">
      {snapshot && (
        <div className="finding-reveal rounded-xl border border-border bg-bg-muted/40 p-5 font-mono text-sm">
          <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-wider text-fg-muted">
            <span>Self-scan — nebulacomponents.com</span>
            <span>{timeAgo(snapshot.scanned_at)}</span>
          </div>
          <ul className="space-y-1.5">
            {snapshot.signals
              .filter((signal) => signal.key !== 'above_fold' && signal.key !== 'ad_signals')
              .map((signal, i) => (
              <li
                key={signal.key}
                className="finding-reveal flex items-center justify-between"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <span className="flex items-center gap-2 text-fg-muted">
                  {!signal.pass && (
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-signal-fail"
                      aria-hidden="true"
                    />
                  )}
                  {signal.label}
                </span>
                <span className={signal.pass ? 'text-accent' : 'text-signal-fail'}>
                  {signal.score.toFixed(0)}/10
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-fg-muted">
            Verified checks shown above. Source-only checks are omitted until rendered verification
            is available.
          </p>
        </div>
      )}
    </div>
  )
}
