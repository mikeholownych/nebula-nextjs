'use client'

import { useState, useCallback, useRef } from 'react'

// ─── Copy Panel ──────────────────────────────────────────────────────────────

export function CopyPanel({ value, label, filename }: { value: string; label: string; filename?: string }) {
  const [copied, setCopied] = useState(false)
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    if (timeout.current) clearTimeout(timeout.current)
    timeout.current = setTimeout(() => setCopied(false), 1800)
  }, [value])

  return (
    <div className="bg-bg-surface border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <span className="font-mono text-[10px] uppercase tracking-widest text-fg-muted/60">{filename || label}</span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 font-mono text-xs text-accent hover:text-accent-light transition-colors px-2 py-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          aria-label={`Copy ${label}`}
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <p className="font-mono text-xs text-fg-muted leading-relaxed p-5 whitespace-pre-wrap">{value}</p>
    </div>
  )
}

// ─── Press Release Tabs ──────────────────────────────────────────────────────

type TabId = 'releases' | 'coverage' | 'angles'

export function PressReleaseTabs({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<TabId>('releases')

  const tabs: { id: TabId; label: string }[] = [
    { id: 'releases', label: 'Press Releases' },
    { id: 'coverage', label: 'Story Angles' },
    { id: 'angles', label: 'Research Data' },
  ]

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="Press content">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className={`min-h-[44px] px-4 py-2 text-xs font-mono uppercase tracking-wide rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
              active === tab.id
                ? 'bg-accent/10 text-accent border border-accent/30'
                : 'text-fg-muted hover:text-fg border border-transparent hover:border-border'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" aria-label={tabs.find(t => t.id === active)?.label}>
        {active === 'releases' && <PressReleasesList />}
        {active === 'coverage' && <StoryAngles />}
        {active === 'angles' && <>{children}</>}
      </div>
    </div>
  )
}

function PressReleasesList() {
  const releases = [
    {
      date: '2026-08-06',
      headline: 'Nebula Components launches diagnostic brand kit',
      summary: 'New visual identity system positions the platform as precision instrumentation for conversion diagnostics.',
      type: 'product' as const,
    },
    {
      date: '2026-07-29',
      headline: 'Public teardown: Basecamp landing page scores 5.4/10',
      summary: 'First public teardown reveals 5 structural conversion leaks on basecamp.com. Full evidence published.',
      type: 'research' as const,
      link: '/teardowns/basecamp',
    },
    {
      date: '2026-07-25',
      headline: '86-page audit study: zero pages score an A',
      summary: 'Cross-industry analysis of landing pages running paid traffic finds universal above-fold content failures and a 62.7 average score.',
      type: 'research' as const,
    },
    {
      date: '2026-06-15',
      headline: 'Nebula Components launches free 9-signal landing page audit',
      summary: 'AI-powered audit checks message match, trust signals, mobile CTA, load speed, and 5 additional conversion signals in under 90 seconds.',
      type: 'product' as const,
      link: '/audit',
    },
  ]

  return (
    <div className="space-y-3">
      {releases.map((r) => (
        <div key={r.date + r.headline} className="bg-bg-surface border border-border rounded-xl p-5 group hover:border-accent/20 transition-colors">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-fg-muted tabular-nums">{r.date}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider ${
                  r.type === 'research' ? 'bg-accent/10 text-accent' : 'bg-border text-fg-muted'
                }`}>{r.type}</span>
              </div>
              <p className="text-sm font-medium text-fg">{r.headline}</p>
              <p className="text-xs text-fg-muted leading-relaxed">{r.summary}</p>
            </div>
            {r.link && (
              <a
                href={r.link}
                className="shrink-0 font-mono text-[10px] text-accent border border-accent/30 rounded px-2.5 py-1.5 hover:bg-accent/5 transition-colors"
              >
                View →
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function StoryAngles() {
  const angles = [
    {
      number: '1',
      headline: 'We audited 86 landing pages. Not one scored an A.',
      body: 'Across 86 automated audits of pages running paid traffic, the average score is 62.7/100 — Grade C. Zero pages earned an A. The two most common failures: above-fold content (100% of pages) and ad signal continuity (99%).',
    },
    {
      number: '2',
      headline: 'The default diagnostic for landing pages measures the wrong thing.',
      body: "Load speed — the primary output of PageSpeed Insights — was a problem on just 29% of audited pages. The two failures present on virtually every page are invisible to speed tools. Founders are optimizing for the least common failure.",
    },
    {
      number: '3',
      headline: 'The CRO agency model sells retainers before diagnosis.',
      body: 'Nebula argues the industry model is structurally broken — retainer before diagnosis, A/B tests on pages without enough traffic for significance, 90-day timelines for problems fixable in a week. The audit takes 90 seconds and costs nothing.',
    },
  ]

  return (
    <div className="space-y-3">
      {angles.map((a) => (
        <div key={a.number} className="bg-bg-surface border border-border rounded-xl p-5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-accent mb-2">Angle {a.number}</p>
          <p className="text-sm font-medium text-fg mb-2">{a.headline}</p>
          <p className="text-xs text-fg-muted leading-relaxed">{a.body}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Scan Line (reused pattern from brand kit) ───────────────────────────────

export function ScanLine() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden motion-safe:block hidden" aria-hidden="true">
      <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent animate-scan" />
      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
