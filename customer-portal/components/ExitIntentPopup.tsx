'use client'

/**
 * ExitIntentPopup
 *
 * Fires when the cursor leaves the viewport toward the browser chrome
 * (clientY < 20px on mouseleave). On touch devices falls back to a
 * 40-second inactivity timer.
 *
 * Rules:
 *  - Activates 5 s after mount (ignore quick bounces)
 *  - Suppressed for 7 days after dismiss or successful capture
 *  - Only renders on home (/) and /audit
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'

const SUPPRESS_KEY = 'nebula-exit-suppressed'
const SUPPRESS_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const ACTIVATE_DELAY_MS = 5_000
const MOBILE_DELAY_MS = 40_000
const ELIGIBLE_PATHS = new Set(['/', '/audit'])

function isSuppressed(): boolean {
  try {
    const raw = localStorage.getItem(SUPPRESS_KEY)
    if (!raw) return false
    const { until } = JSON.parse(raw) as { until: number }
    return Date.now() < until
  } catch {
    return false
  }
}

function suppress() {
  try {
    localStorage.setItem(SUPPRESS_KEY, JSON.stringify({ until: Date.now() + SUPPRESS_TTL_MS }))
  } catch {}
}

export default function ExitIntentPopup() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const active = useRef(false)   // listener armed?
  const fired = useRef(false)    // only show once per session

  const eligible = ELIGIBLE_PATHS.has(pathname)

  const show = useCallback(() => {
    if (fired.current) return
    if (isSuppressed()) return
    fired.current = true
    setOpen(true)
  }, [])

  const dismiss = useCallback(() => {
    suppress()
    setOpen(false)
  }, [])

  // Arm listeners after activation delay
  useEffect(() => {
    if (!eligible) return

    const armTimer = setTimeout(() => {
      active.current = true

      // Desktop: cursor exits toward browser chrome
      const onMouseLeave = (e: MouseEvent) => {
        if (!active.current) return
        if (e.clientY < 20) show()
      }
      document.addEventListener('mouseleave', onMouseLeave)

      // Mobile fallback: inactivity
      const mobileTimer = setTimeout(show, MOBILE_DELAY_MS)

      return () => {
        document.removeEventListener('mouseleave', onMouseLeave)
        clearTimeout(mobileTimer)
      }
    }, ACTIVATE_DELAY_MS)

    return () => clearTimeout(armTimer)
  }, [eligible, show])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, dismiss])

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/exit-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), page: pathname }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Something went wrong')
      }
      setStatus('success')
      suppress()
      setTimeout(() => setOpen(false), 2200)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  if (!open) return null

  return (
    /* Backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-popup-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(5,5,5,0.88)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss() }}
    >
      {/* Card */}
      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-bg-panel shadow-2xl"
        style={{ boxShadow: '0 0 0 1px rgba(0,194,160,0.12), 0 24px 64px rgba(0,0,0,0.7)' }}
      >
        {/* Dismiss */}
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-white/5 hover:text-fg"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="p-8">
          {status === 'success' ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="#00c2a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-fg">On its way.</h2>
              <p className="text-sm text-fg-muted">
                Check your inbox — the checklist is headed to <span className="text-fg">{email}</span>.
              </p>
            </div>
          ) : (
            /* ── Capture state ── */
            <>
              {/* Icon badge */}
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="#00c2a0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 12h6M9 16h4" stroke="#00c2a0" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                  Free checklist
                </span>
              </div>

              <h2 id="exit-popup-title" className="mb-2 text-2xl font-extrabold leading-tight text-fg">
                Before you go — grab the checklist.
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-fg-muted">
                The <strong className="text-fg">Top 5 Landing Page Mistakes</strong> founders make when
                running paid ads — with the exact fix for each. One page, no fluff.
              </p>

              {/* Social proof micro-line */}
              <p className="mb-4 text-xs text-fg-dim">
                Takes 4 minutes to read.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'loading'}
                  aria-label="Email address"
                  className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm text-fg placeholder-fg-dim outline-none transition focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60"
                />
                {errorMsg && (
                  <p className="text-xs text-danger">{errorMsg}</p>
                )}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-bg transition-all hover:bg-accent-light active:scale-[0.98] disabled:opacity-60"
                >
                  {status === 'loading' ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Sending…
                    </>
                  ) : (
                    'Send me the checklist →'
                  )}
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-fg-dim">
                No spam. Unsubscribe any time.{' '}
                <button
                  onClick={dismiss}
                  className="underline underline-offset-2 hover:text-fg-muted"
                >
                  No thanks
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
