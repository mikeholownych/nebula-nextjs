'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

/**
 * SiteNav - Global primary navigation.
 *
 * Layer 1: 5 items max. Orient visitors, expose major destinations.
 * No SEO link dumps. No mega-menus for their own sake.
 *
 * Desktop: horizontal bar, "Learn" has a compact dropdown (not a mega-menu)
 * Mobile: slide-in drawer with hierarchical disclosure
 */

const NAV_ITEMS = [
  { label: 'Teardowns', href: '/teardowns' },
  {
    label: 'Learn',
    href: '/learning-centre',
    children: [
      { label: 'All guides', href: '/learning-centre', desc: 'Browse 40+ conversion guides' },
      { label: 'Why pages don\'t convert', href: '/why-is-my-landing-page-not-converting', desc: 'The core diagnostic framework' },
      { label: 'Ads getting clicks, no sales', href: '/ads-getting-clicks-but-no-sales', desc: 'Paid traffic diagnosis' },
      { label: 'Landing page mistakes', href: '/landing-page-mistakes', desc: 'Common failure patterns' },
      { label: 'Public teardowns', href: '/teardowns', desc: 'Real sites, real audits' },
    ],
  },
  { label: 'Pricing', href: '/pricing' },
]

export default function SiteNav() {
  const pathname = usePathname()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)
  const navRef = useRef<HTMLElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close on route change
  useEffect(() => {
    setMobileOpen(false)
    setOpenDropdown(null)
  }, [pathname])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpenDropdown(null)
        setMobileOpen(false)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <nav
      ref={navRef}
      className="sticky top-0 z-50 border-b border-border/40 bg-bg/90 backdrop-blur-md"
      aria-label="Primary navigation"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 h-14">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-fg hover:text-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          aria-label="Nebula Components - home"
        >
          <span className="font-mono text-accent text-base">⬡</span>
          <span>Nebula</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <div key={item.label} className="relative">
              {item.children ? (
                <>
                  <button
                    onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                    aria-expanded={openDropdown === item.label}
                    aria-haspopup="true"
                    className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      isActive(item.href)
                        ? 'text-fg font-medium'
                        : 'text-fg-muted hover:text-fg'
                    }`}
                  >
                    {item.label}
                    <svg
                      className={`h-3 w-3 transition-transform ${openDropdown === item.label ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {openDropdown === item.label && (
                    <div
                      role="menu"
                      className="absolute left-0 top-full mt-1.5 w-72 rounded-xl border border-border/60 bg-bg-muted shadow-lg shadow-black/40 py-1.5"
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          role="menuitem"
                          className="flex flex-col px-4 py-2.5 hover:bg-white/5 transition-colors focus:outline-none focus-visible:bg-white/5"
                        >
                          <span className="text-sm font-medium text-fg">{child.label}</span>
                          <span className="text-xs text-fg-dim mt-0.5">{child.desc}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    isActive(item.href)
                      ? 'text-fg font-medium'
                      : 'text-fg-muted hover:text-fg'
                  }`}
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/workspace"
            className="text-sm text-fg-muted hover:text-fg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            Workspace
          </Link>
          <Link
            href="/audit"
            className="rounded bg-accent px-4 py-1.5 text-sm font-semibold text-bg hover:opacity-85 hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Free Audit
          </Link>
        </div>

        {/* Mobile: CTA + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/audit"
            className="rounded bg-accent px-3.5 py-1.5 text-sm font-semibold text-bg hover:opacity-85 hover:bg-accent transition-colors"
          >
            Free Audit
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="rounded-lg p-1.5 text-fg-muted hover:text-fg hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer - hierarchical, not a link dump */}
      {mobileOpen && (
        <div
          className="md:hidden border-t border-border/40 bg-bg"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <div className="px-6 py-4 space-y-1">
            {NAV_ITEMS.map((item) => (
              <div key={item.label}>
                {item.children ? (
                  <>
                    <button
                      onClick={() => setMobileExpanded(mobileExpanded === item.label ? null : item.label)}
                      aria-expanded={mobileExpanded === item.label}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-fg-muted hover:text-fg hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <span>{item.label}</span>
                      <svg
                        className={`h-4 w-4 transition-transform ${mobileExpanded === item.label ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {mobileExpanded === item.label && (
                      <div className="ml-3 mt-1 space-y-0.5 border-l border-border/40 pl-3">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="flex flex-col rounded-lg px-3 py-2 hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          >
                            <span className="text-sm text-fg">{child.label}</span>
                            <span className="text-xs text-fg-dim">{child.desc}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={`block rounded-lg px-3 py-2.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      isActive(item.href) ? 'text-fg font-medium' : 'text-fg-muted hover:text-fg hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
            <div className="pt-2 border-t border-border/40">
              <Link
                href="/workspace"
                className="block rounded-lg px-3 py-2.5 text-sm text-fg-muted hover:text-fg hover:bg-white/5 transition-colors"
              >
                Workspace
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
