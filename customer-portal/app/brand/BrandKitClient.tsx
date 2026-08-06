'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

// ─── Copy Button ─────────────────────────────────────────────────────────────

export function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    if (timeout.current) clearTimeout(timeout.current)
    timeout.current = setTimeout(() => setCopied(false), 1800)
  }, [value])

  return (
    <button
      onClick={handleCopy}
      className="group inline-flex items-center gap-1.5 font-mono text-xs text-fg-muted hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded px-1 -mx-1"
      aria-label={`Copy ${label || value}`}
      title={copied ? 'Copied' : `Copy ${label || value}`}
    >
      <span>{value}</span>
      <svg
        width="12"
        height="12"
        viewBox="0 0 16 16"
        fill="none"
        className={`shrink-0 transition-transform ${copied ? 'scale-110' : 'scale-100 opacity-0 group-hover:opacity-60'}`}
        aria-hidden="true"
      >
        {copied ? (
          <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <>
            <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" stroke="currentColor" strokeWidth="1.2" />
          </>
        )}
      </svg>
    </button>
  )
}

// ─── Mark Variant Tabs ───────────────────────────────────────────────────────

export type MarkVariantTab = {
  id: string
  label: string
}

export function MarkVariantTabs({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: MarkVariantTab[]
  activeTab: string
  onTabChange: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Mark variants">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`min-h-[44px] px-3 py-2 text-xs font-mono uppercase tracking-wide rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
            activeTab === tab.id
              ? 'bg-accent/10 text-accent border border-accent/30'
              : 'text-fg-muted hover:text-fg border border-transparent hover:border-border'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ─── Interactive Mark Gallery ────────────────────────────────────────────────

interface MarkVariantData {
  id: string
  label: string
  description: string
  bg: string
  markColors: { pass: string; neutral: string }
}

const MARK_VARIANTS: MarkVariantData[] = [
  { id: 'dark', label: 'Dark', description: 'Primary — dark background', bg: 'bg-bg-surface', markColors: { pass: '#00c2a0', neutral: '#9e9e9e' } },
  { id: 'light', label: 'Light', description: 'Inverted — light background', bg: 'bg-white', markColors: { pass: '#009980', neutral: '#666666' } },
  { id: 'mono', label: 'Mono', description: 'Single-tone — grayscale contexts', bg: 'bg-bg-surface', markColors: { pass: '#ffffff', neutral: '#666666' } },
  { id: 'teal', label: 'Signal Teal', description: 'Full accent — brand-forward', bg: 'bg-bg-surface', markColors: { pass: '#00c2a0', neutral: '#00c2a0' } },
  { id: 'small', label: 'Small-size', description: 'Optimized for 16px and below', bg: 'bg-bg-surface', markColors: { pass: '#00c2a0', neutral: '#4a4a4a' } },
  { id: 'contrast', label: 'High Contrast', description: 'WCAG AAA — maximum legibility', bg: 'bg-[#000000]', markColors: { pass: '#ffffff', neutral: '#ffffff' } },
  { id: 'outline', label: 'Technical', description: 'Construction / wireframe', bg: 'bg-bg-surface', markColors: { pass: '#00c2a0', neutral: '#333333' } },
  { id: 'active', label: 'Diagnostic', description: 'Active scanning state', bg: 'bg-bg-surface', markColors: { pass: '#00c2a0', neutral: '#f59e0b' } },
]

export function MarkGallery() {
  const [active, setActive] = useState('dark')
  const variant = MARK_VARIANTS.find((v) => v.id === active) ?? MARK_VARIANTS[0]

  return (
    <div className="space-y-4">
      <MarkVariantTabs
        tabs={MARK_VARIANTS.map((v) => ({ id: v.id, label: v.label }))}
        activeTab={active}
        onTabChange={setActive}
      />
      <div
        className={`relative rounded-xl border border-border overflow-hidden ${variant.bg} flex items-center justify-center h-64 transition-colors duration-300`}
        role="tabpanel"
        aria-label={`${variant.label} variant preview`}
      >
        <MarkSVG
          size={96}
          passColor={variant.markColors.pass}
          neutralColor={variant.markColors.neutral}
          isOutline={variant.id === 'outline'}
          isActive={variant.id === 'active'}
        />
        <div className="absolute bottom-4 left-4">
          <p className="text-xs font-mono text-fg-muted">{variant.description}</p>
        </div>
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-fg-muted/60">
            {variant.id}
          </span>
        </div>
      </div>
    </div>
  )
}

function MarkSVG({
  size,
  passColor,
  neutralColor,
  isOutline,
  isActive,
}: {
  size: number
  passColor: string
  neutralColor: string
  isOutline?: boolean
  isActive?: boolean
}) {
  const cellSize = 6
  const gap = 2
  const r = 2.2

  const states = ['pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'neutral', 'neutral', 'neutral']

  const nodes = Array.from({ length: 9 }, (_, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const cx = 1 + col * (cellSize + gap) + cellSize / 2
    const cy = 1 + row * (cellSize + gap) + cellSize / 2
    return { cx, cy, state: states[i] }
  })

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={isActive ? 'animate-pulse-soft' : ''}
    >
      {nodes.map(({ cx, cy, state }, i) => {
        const color = state === 'pass' ? passColor : neutralColor
        if (isOutline) {
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r - 0.3}
              stroke={color}
              strokeWidth="0.8"
              fill="none"
            />
          )
        }
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill={color}
            opacity={state === 'neutral' ? 0.4 : 1}
          />
        )
      })}
    </svg>
  )
}

// ─── Telemetry Counter ───────────────────────────────────────────────────────

export function TelemetryCounter({ value, label, suffix }: { value: number; label: string; suffix?: string }) {
  const [displayed, setDisplayed] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (hasAnimated.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const duration = 1200
          const start = performance.now()
          const animate = (now: number) => {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplayed(Math.round(eased * value))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value])

  return (
    <div className="flex flex-col items-center gap-1">
      <span ref={ref} className="text-2xl font-mono font-bold text-accent tabular-nums">
        {displayed}{suffix}
      </span>
      <span className="text-[10px] font-mono uppercase tracking-widest text-fg-muted">{label}</span>
    </div>
  )
}

// ─── Animated Scan Line ──────────────────────────────────────────────────────

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
