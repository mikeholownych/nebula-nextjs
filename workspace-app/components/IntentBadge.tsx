'use client'

/**
 * IntentBadge — inline page-intent display + override control for audit rows.
 *
 * Shows the detected intent as a subtle pill. When clicked, opens a small
 * inline picker so the user can correct a misclassification. On save, calls
 * PATCH /api/audit/:id/page-intent and updates optimistically.
 */

import { useState } from 'react'

const INTENT_LABELS: Record<string, string> = {
  paid_landing:       'Paid Landing',
  seo_content:        'SEO Content',
  faq_support:        'FAQ / Support',
  product_explainer:  'Product Explainer',
  comparison:         'Comparison',
  category:           'Category',
  about_trust:        'About / Trust',
  checkout:           'Checkout',
  unknown:            'Unknown',
}

const INTENT_COLORS: Record<string, string> = {
  paid_landing:       'bg-accent/15 text-accent border-accent/30',
  seo_content:        'bg-blue-500/10 text-blue-400 border-blue-500/25',
  faq_support:        'bg-purple-500/10 text-purple-400 border-purple-500/25',
  product_explainer:  'bg-cyan-500/10 text-cyan-400 border-cyan-500/25',
  comparison:         'bg-orange-500/10 text-orange-400 border-orange-500/25',
  category:           'bg-pink-500/10 text-pink-400 border-pink-500/25',
  about_trust:        'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  checkout:           'bg-yellow-500/10 text-yellow-500 border-yellow-500/25',
  unknown:            'bg-fg-muted/10 text-fg-dim border-fg-muted/20',
}

const ALL_INTENTS = Object.keys(INTENT_LABELS).filter(k => k !== 'unknown')

interface IntentBadgeProps {
  auditId: string
  intent: string | null | undefined
  confidence?: number | null
  onUpdated?: (newIntent: string) => void
}

export default function IntentBadge({ auditId, intent, confidence, onUpdated }: IntentBadgeProps) {
  const current = intent || 'unknown'
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(current)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localIntent, setLocalIntent] = useState(current)

  const isManual = confidence === 1.0 && localIntent !== 'unknown'
  const label = INTENT_LABELS[localIntent] ?? localIntent
  const colors = INTENT_COLORS[localIntent] ?? INTENT_COLORS.unknown

  async function save() {
    if (selected === localIntent) { setOpen(false); return }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/audit/${auditId}/page-intent`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_intent: selected }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || `HTTP ${res.status}`)
      }
      setLocalIntent(selected)
      setOpen(false)
      onUpdated?.(selected)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => { setOpen(v => !v); setSelected(localIntent) }}
        title={`Page intent: ${label}${isManual ? ' (manual)' : confidence != null ? ` (${Math.round((confidence ?? 0) * 100)}% confidence)` : ''}. Click to override.`}
        className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide transition-colors hover:opacity-80 ${colors}`}
      >
        {label}
        {isManual && <span className="opacity-60">✓</span>}
        <span className="opacity-50 text-[9px]">▾</span>
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1.5 w-52 rounded-xl border border-border bg-bg-surface p-2 shadow-xl">
            <p className="px-2 pb-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-fg-muted/60">
              Override page intent
            </p>
            <div className="space-y-0.5 max-h-64 overflow-y-auto">
              {ALL_INTENTS.map(k => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSelected(k)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                    selected === k
                      ? 'bg-accent/15 text-accent font-semibold'
                      : 'text-fg hover:bg-bg-panel'
                  }`}
                >
                  <span className={`inline-flex items-center rounded border px-1 py-0.5 font-mono text-[9px] uppercase ${INTENT_COLORS[k]}`}>
                    {INTENT_LABELS[k]}
                  </span>
                </button>
              ))}
            </div>
            {error && (
              <p className="mt-1.5 px-2 text-[10px] text-[#b33d38]">{error}</p>
            )}
            <div className="mt-2 flex gap-1.5 px-1">
              <button
                onClick={save}
                disabled={saving || selected === localIntent}
                className="flex-1 rounded-lg bg-accent px-3 py-1.5 font-mono text-xs font-bold text-bg disabled:opacity-40"
              >
                {saving ? 'Saving…' : 'Apply'}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-border px-3 py-1.5 font-mono text-xs text-fg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
