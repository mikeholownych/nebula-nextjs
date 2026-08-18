'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * MobileStickyAuditCTA
 *
 * A sticky bottom bar that appears on mobile after the hero section
 * exits the viewport. Gives mobile visitors a persistent conversion
 * path without cluttering the desktop experience.
 *
 * Behaviour:
 * - Hidden until hero sentinel scrolls out of view (IntersectionObserver)
 * - Mobile-only (md:hidden, never shown on desktop)
 * - Dismissable (dismissed state stored in sessionStorage so it resets
 *   on a new session but doesn't reappear on the same visit after dismiss)
 * - Respects prefers-reduced-motion on entrance animation
 */
export default function MobileStickyAuditCTA() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Restore dismiss state for this session
    if (sessionStorage.getItem('sticky-cta-dismissed') === '1') {
      setDismissed(true)
      return
    }

    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show when the sentinel (bottom of hero) is no longer visible
        setVisible(!entry.isIntersecting)
      },
      { threshold: 0, rootMargin: '0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('sticky-cta-dismissed', '1')
  }

  return (
    <>
      {/* Sentinel, placed at the bottom of the hero section by the parent.
          We render it here so the component is self-contained; the parent
          just needs to include <MobileStickyAuditCTA /> once. */}
      <div ref={sentinelRef} id="sticky-cta-sentinel" aria-hidden="true" />

      {/* Sticky bar, mobile only */}
      {visible && !dismissed && (
        <div
          role="complementary"
          aria-label="Run free audit"
          className={[
            'fixed bottom-0 left-0 right-0 z-40 md:hidden',
            'border-t border-border bg-bg/95 backdrop-blur-xl',
            'px-4 pb-[env(safe-area-inset-bottom,0px)]',
            'motion-safe:animate-slide-up',
          ].join(' ')}
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)', paddingTop: '12px' }}
        >
          <div className="flex items-center gap-3">
            <a
              href="/audit?utm_source=mobile-sticky&utm_medium=internal"
              className="flex-1 rounded-xl bg-accent py-3 text-center text-sm font-semibold text-bg transition-colors hover:opacity-85 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Find My Conversion Leak, Free
            </a>
            <button
              onClick={handleDismiss}
              aria-label="Dismiss"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-fg-muted transition-colors hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
