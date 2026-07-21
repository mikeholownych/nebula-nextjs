'use client'

import { useState } from 'react'
import Link from 'next/link'

const LINK_CLASSES =
  'text-sm text-fg-muted hover:text-fg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded'

export default function SiteNav() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-bg/80 backdrop-blur-xl border-b border-border">
      {/*
        `static` + `flex-row` + `bg-transparent` + `p-0` explicitly pin the
        properties that globals.css's legacy unscoped `nav { ... }` /
        `@media (max-width: 480px) nav { position: absolute; flex-direction:
        column; ... }` rules set — that CSS targets older static-markup pages'
        own `<header>`/`<nav>` and has no toggle, so left unpinned it turns
        this nav into an always-on absolutely-positioned dropdown that
        overlaps page content. Class selectors beat the legacy type-selector
        rules regardless of source order, so this is a permanent fix, not a
        specificity race.
      */}
      <nav
        aria-label="Primary"
        className="static max-w-7xl mx-auto flex flex-row items-center justify-between bg-transparent p-0"
      >
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          aria-label="Nebula Components home"
        >
          <svg width="22" height="22" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="9"  y="9"  width="3" height="30" fill="#F5F5F5"/>
            <polygon points="12,9 15,9 36,39 33,39" fill="#F5F5F5"/>
            <rect x="36" y="9"  width="3" height="30" fill="#F5F5F5"/>
            <rect x="34" y="6" width="7" height="2.5" fill="#10B981"/>
          </svg>
          <span className="text-sm font-medium text-fg tracking-tight">
            Nebula <span className="font-light text-fg-muted">Components</span>
          </span>
        </Link>

        <div className="hidden sm:flex items-center gap-6">
          <Link href="/pricing" className={LINK_CLASSES}>
            Pricing
          </Link>
          <Link href="/case-studies" className={LINK_CLASSES}>
            Case Studies
          </Link>
          <Link href="/learning-centre" className={LINK_CLASSES}>
            Learning
          </Link>
          <Link
            href="/audit"
            className="px-4 py-2 bg-accent text-bg text-sm font-medium rounded-lg hover:bg-accent-light transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Free Audit
          </Link>
        </div>

        <button
          type="button"
          className="sm:hidden flex items-center justify-center rounded-lg p-2 text-fg hover:bg-border/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-panel"
          onClick={() => setMobileOpen((open) => !open)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {mobileOpen ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </nav>

      {mobileOpen && (
        <div
          id="mobile-nav-panel"
          className="sm:hidden absolute top-full left-0 right-0 flex flex-col gap-1 border-t border-border bg-bg px-6 py-4"
        >
          <Link href="/pricing" className={`${LINK_CLASSES} py-3`} onClick={() => setMobileOpen(false)}>
            Pricing
          </Link>
          <Link href="/case-studies" className={`${LINK_CLASSES} py-3`} onClick={() => setMobileOpen(false)}>
            Case Studies
          </Link>
          <Link href="/learning-centre" className={`${LINK_CLASSES} py-3`} onClick={() => setMobileOpen(false)}>
            Learning
          </Link>
          <Link
            href="/audit"
            className="mt-2 px-4 py-2 text-center bg-accent text-bg text-sm font-medium rounded-lg hover:bg-accent-light transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            onClick={() => setMobileOpen(false)}
          >
            Free Audit
          </Link>
        </div>
      )}
    </header>
  )
}
