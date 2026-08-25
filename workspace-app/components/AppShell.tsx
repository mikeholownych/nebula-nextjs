'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * Workspace chrome: visual parity with the legacy /workspace shell
 * (customer-portal WorkspaceClient) minus the ?tab= query params.
 * Each section is a real route.
 */

const NAV_GROUPS: { label: string; items: { href: string; label: string; icon: string }[] }[] = [
  {
    label: 'Analytics',
    items: [
      { href: '/', label: 'Site Health', icon: 'grid' },
      { href: '/findings', label: 'Findings', icon: 'scan' },
    ],
  },
]

type Me = { email?: string }

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [email, setEmail] = useState<string>('')

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Me | null) => setEmail(d?.email ?? ''))
      .catch(() => undefined)
  }, [])

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined)
    window.location.href = '/login'
  }

  return (
    <main className="min-h-screen bg-bg text-fg pt-24" id="main-content">
      <div className="mx-auto flex max-w-[1440px] gap-0 px-4 py-5 sm:px-6 lg:px-8">
        <aside className="hidden w-60 shrink-0 border-r border-border pr-5 lg:block" aria-label="Workspace navigation">
          <div className="sticky top-28">
            {/* Top Pill: Project Selector */}
            <div className="relative mb-4">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl border border-border bg-bg-surface px-3 py-2 text-left transition-all hover:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent"
                aria-label="Active project"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent/20 border border-accent/40 font-mono text-xs font-bold text-accent">
                    ⬡
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-fg">All Projects</p>
                  </div>
                </div>
                <span className="font-mono text-[11px] text-fg-muted">⌄</span>
              </button>
            </div>

            {/* Categorized Navigation */}
            <div className="space-y-5">
              {NAV_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="mb-1.5 px-3 font-mono text-[10px] font-bold uppercase tracking-wider text-fg-muted/60">{group.label}</p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const active =
                        item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={active ? 'page' : undefined}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-[13px] font-medium transition-colors ${
                            active
                              ? 'bg-bg-panel text-fg border border-border/50'
                              : 'text-fg-muted hover:bg-bg-elevated hover:text-fg border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? 'bg-accent' : 'bg-fg-muted/40'}`}
                              aria-hidden="true"
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Account / Plan Status Card */}
            <div className="mt-5 rounded-xl border border-border bg-bg-surface p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-fg-muted">Tier</span>
                <span className="rounded bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-accent capitalize">
                  free
                </span>
              </div>
            </div>

            <div className="mt-3 border-t border-border px-3 pt-3 flex items-center justify-between">
              <p className="truncate font-mono text-[11px] text-fg-muted/60" title={email}>{email}</p>
              <button onClick={signOut} className="font-mono text-[11px] text-fg-muted hover:text-fg">Sign out</button>
            </div>
          </div>
        </aside>

        {/* Mobile nav (below lg): horizontal scrollable tab row, matches legacy */}
        <div className="min-w-0 flex-1 lg:pl-8">
          <nav className="mb-6 lg:hidden" aria-label="Workspace sections">
            <div className="hidden sm:flex gap-1 overflow-x-auto border-b border-border pb-px">
              {NAV_GROUPS.flatMap((group) => group.items).map((item) => {
                const active =
                  item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-1 whitespace-nowrap px-3 py-2 text-xs font-semibold ${
                      active ? 'border-b-2 border-fg text-fg' : 'text-fg-dim'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </nav>
          {children}
        </div>
      </div>
    </main>
  )
}
