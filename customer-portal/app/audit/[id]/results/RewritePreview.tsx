'use client'

import { useEffect, useState } from 'react'
import posthog from '@/app/lib/posthog-browser'

interface Rewrite {
  original_text: string
  rewritten_text: string
}

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'shown'; rewrite: Rewrite }
  | { status: 'paywalled' }
  | { status: 'error'; message: string }

function storageKey(auditId: string) {
  return `nebula-rewrites-${auditId}`
}

function readStore(auditId: string): Record<string, Rewrite> {
  try {
    const raw = window.localStorage.getItem(storageKey(auditId))
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

function writeStore(auditId: string, store: Record<string, Rewrite>) {
  try {
    window.localStorage.setItem(storageKey(auditId), JSON.stringify(store))
  } catch {
    // storage full / unavailable - non-fatal, rewrite still displays
  }
}

/**
 * RewritePreview - "Preview AI rewrite" per finding card.
 *
 * FREE TEASER: the first rewrite revealed for an audit (tracked in
 * localStorage under nebula-rewrites-{auditId}) is shown in full. Every
 * subsequent click renders a blur-overlay card linking to the $97 checkout.
 * The backend returns any finding's rewrite for an authorized caller; the
 * paywall is a client-side conversion surface, not a security boundary.
 */
export default function RewritePreview({
  auditId,
  findingKey,
  findingCount,
}: {
  auditId: string
  findingKey: string
  findingCount: number
}) {
  const [state, setState] = useState<State>({ status: 'idle' })
  const [copied, setCopied] = useState(false)

  // Restore previously revealed rewrite for this finding on mount.
  useEffect(() => {
    const store = readStore(auditId)
    if (store[findingKey]) {
      setState({ status: 'shown', rewrite: store[findingKey] })
    }
  }, [auditId, findingKey])

  const checkoutUrl = `/checkout?audit_id=${encodeURIComponent(auditId)}`

  const handleClick = async () => {
    if (state.status === 'loading') return
    posthog.capture('rewrite_preview_clicked', { audit_id: auditId, finding_key: findingKey })

    const store = readStore(auditId)
    const cached = store[findingKey]
    if (cached) {
      setState({ status: 'shown', rewrite: cached })
      return
    }

    // Free teaser: only the FIRST revealed rewrite per audit is free.
    if (Object.keys(store).length > 0) {
      setState({ status: 'paywalled' })
      posthog.capture('rewrite_preview_paywalled', { audit_id: auditId, finding_key: findingKey })
      return
    }

    setState({ status: 'loading' })
    try {
      const res = await fetch('/api/audit/rewrites/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audit_id: auditId, finding_key: findingKey }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(
          typeof data.error === 'string' ? data.error.slice(0, 200) : 'Rewrite unavailable',
        )
      }
      const rewrite: Rewrite = {
        original_text: data.original_text ?? '',
        rewritten_text: data.rewritten_text ?? '',
      }
      store[findingKey] = rewrite
      writeStore(auditId, store)
      setState({ status: 'shown', rewrite })
      posthog.capture('rewrite_preview_generated', { audit_id: auditId, finding_key: findingKey })
    } catch (err) {
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong',
      })
    }
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
      posthog.capture('rewrite_copied', { audit_id: auditId, finding_key: findingKey })
    } catch {
      // clipboard unavailable - silent fail
    }
  }

  // Paywall teaser - blurred stand-in behind the implementation kit link.
  if (state.status === 'paywalled') {
    return (
      <div className="relative mt-4 overflow-hidden rounded-lg border border-border bg-bg/50 p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.1em] text-fg-muted">
          AI Rewrite Preview
        </p>
        <p
          className="select-none break-words text-base leading-7 text-fg-muted blur-sm pointer-events-none"
          aria-hidden="true"
        >
          A sharper, outcome-focused rewrite of this element - specific to your page,
          your offer, and the evidence above.
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <a
            href={checkoutUrl}
            onClick={() =>
              posthog.capture('rewrite_paywall_checkout_clicked', {
                audit_id: auditId,
                finding_key: findingKey,
              })
            }
            className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-bg shadow-sm transition-colors hover:bg-accent-light"
          >
            Unlock all {findingCount} rewrites with the One-Leak Repair Sprint →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4">
      {state.status !== 'shown' && (
        <button
          onClick={handleClick}
          disabled={state.status === 'loading'}
          className="inline-flex items-center gap-2 rounded-lg border border-accent px-4 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
        >
          {state.status === 'loading' ? (
            <>
              <span className="animate-spin">⋯</span> Writing…
            </>
          ) : (
            <>✦ Preview AI rewrite</>
          )}
        </button>
      )}

      {state.status === 'error' && (
        <p className="mt-2 text-xs text-danger" role="alert">
          {state.message}
        </p>
      )}

      {state.status === 'shown' && (
        <div className="mt-2 space-y-2">
          {state.rewrite.original_text && (
            <div className="rounded-lg border border-border bg-bg/50 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.1em] text-fg-muted">
                Original
              </p>
              <p className="text-sm leading-6 text-fg-muted line-through decoration-fg-muted/50">
                {state.rewrite.original_text}
              </p>
            </div>
          )}
          <div className="rounded-lg border border-border border-l-2 border-l-accent bg-accent/5 p-3">
            <div className="mb-1 flex items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-accent">
                AI Rewrite
              </p>
              <button
                onClick={() => handleCopy(state.rewrite.rewritten_text)}
                className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs font-semibold text-fg-muted transition-colors hover:border-accent hover:text-accent"
              >
                {copied ? <><span>✓</span> Copied</> : <><span>⎘</span> Copy</>}
              </button>
            </div>
            <p className="text-base leading-7 text-fg">{state.rewrite.rewritten_text}</p>
          </div>
        </div>
      )}
    </div>
  )
}
