'use client'

import { motion } from 'framer-motion'

/**
 * AuditCardArtifact — Composed audit card for hero/results/teardown pages.
 * NOT a screenshot. Designed artifact with:
 * - Score badge (large mono number + grade)
 * - Top leak callout (accent border-left)
 * - Signal pills (Pass/Fail visible)
 * - Warm-tinted shadow
 */

interface AuditCardArtifactProps {
  score?: number
  grade?: string
  topLeak?: string
  signals?: { key: string; label: string; pass: boolean }[]
  url?: string
  compact?: boolean
}

const DEFAULT_SIGNALS = [
  { key: 'headline', label: 'Headline', pass: true },
  { key: 'cta', label: 'CTA clarity', pass: false },
  { key: 'social_proof', label: 'Social proof', pass: false },
  { key: 'mobile', label: 'Mobile viewport', pass: true },
  { key: 'seo', label: 'SEO foundations', pass: true },
  { key: 'ai', label: 'AI readiness', pass: false },
]

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-[#22c55e] text-white',
  B: 'bg-accent-dim text-accent',
  C: 'bg-[#F59E0B]/20 text-[#F59E0B]',
  D: 'bg-red-500/20 text-red-400',
  F: 'bg-red-600/20 text-red-400',
}

export default function AuditCardArtifact({
  score = 67,
  grade = 'C+',
  topLeak = 'Headline doesn\'t name the buyer outcome',
  signals = DEFAULT_SIGNALS,
  url = 'yourpage.com',
  compact = false,
}: AuditCardArtifactProps) {
  const passCount = signals.filter(s => s.pass).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`
        relative overflow-hidden rounded-2xl border border-border
        bg-bg-surface shadow-[0_4px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.03)]
        ${compact ? 'p-4' : 'p-6'}
      `}
    >
      {/* Warm-tinted inner glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/[0.03] via-transparent to-transparent"
      />

      {/* Top: URL bar */}
      <div className="mb-4 flex items-center gap-2 rounded-lg bg-bg/50 px-3 py-2 text-xs text-fg-muted">
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500/60" />
          <span className="h-2 w-2 rounded-full bg-yellow-500/60" />
          <span className="h-2 w-2 rounded-full bg-green-500/60" />
        </div>
        <span className="ml-2 flex-1 truncate font-mono text-[10px]">{url}</span>
      </div>

      {/* Score + Grade */}
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center">
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            className={`font-mono text-5xl font-bold tracking-tight ${
              score >= 80 ? 'text-[#22c55e]' : score >= 60 ? 'text-accent' : 'text-[#F59E0B]'
            }`}
          >
            {score}
          </motion.span>
          <span className="mt-1 text-xs text-fg-muted">/ 100</span>
        </div>

        <div className="flex-1">
          {/* Grade badge */}
          <div
            className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${GRADE_COLORS[grade[0]] || 'bg-accent-dim text-accent'}`}
          >
            {grade}
          </div>

          {/* Top leak callout */}
          <div className="mt-3 flex items-start gap-2 rounded-lg border-l-2 border-[#EF4444] bg-red-500/5 px-3 py-2">
            <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-fg">{topLeak}</p>
              <p className="mt-0.5 text-xs text-fg-muted">Top conversion leak</p>
            </div>
          </div>
        </div>
      </div>

      {/* Signal pills */}
      <div className="mt-4 flex flex-wrap gap-2">
        {signals.slice(0, 6).map((signal, i) => (
          <motion.div
            key={signal.key}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.05, duration: 0.3 }}
            className={`
              inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium
              ${signal.pass
                ? 'bg-[#22c55e]/10 text-[#22c55e]'
                : 'bg-[#EF4444]/10 text-red-400'}
            `}
          >
            {signal.pass ? (
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
            {signal.label}
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-xs text-fg-muted">
        <span>{passCount} of {signals.length} passing</span>
        <span className="font-mono">~2 min audit</span>
      </div>
    </motion.div>
  )
}
