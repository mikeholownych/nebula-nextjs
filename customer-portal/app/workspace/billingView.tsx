'use client'

import { useCallback, useEffect, useState } from 'react'

export interface BillingPurchase {
  stripeSessionId: string
  offerKey: string | null
  name: string
  amountCents: number | null
  currency: string
  paymentStatus: string | null
  fulfillment: { label: string; tone: 'green' | 'amber' | 'gray' | 'red' }
  createdAt: string
}

export interface BillingSummary {
  email: string
  plan: 'fix-pack' | 'free'
  hasFixPack: boolean
  totalSpentCents: number
  purchaseCount: number
  purchases: BillingPurchase[]
  billingPortalUrl: string | null
  usage: { model: string; note: string }
}

const TONE_CLASSES: Record<BillingPurchase['fulfillment']['tone'], string> = {
  green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  red: 'bg-red-500/10 text-red-400 border-red-500/30',
  gray: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
}

const fmtUsd = (cents: number | null): string => {
  if (cents == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

export default function BillingView({ email }: { email: string }) {
  const [summary, setSummary] = useState<BillingSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/billing/summary?email=${encodeURIComponent(email)}`)
      if (!res.ok) throw new Error('Failed to load billing info')
      setSummary(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [email])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return <div className="py-12 text-center text-gray-400">Loading billing…</div>
  }

  if (error || !summary) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-400 mb-4">{error ?? 'No billing data'}</p>
        <button
          onClick={load}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black"
        >
          Retry
        </button>
      </div>
    )
  }

  const isOwner = summary.plan === 'fix-pack'

  return (
    <div className="space-y-6">
      {/* Plan */}
      <section className="rounded-2xl border border-gray-800 bg-[#0a0a0a] p-6">
        <h2 className="text-lg font-semibold mb-1">Plan</h2>
        <p className="text-sm text-gray-400 mb-4">
          What you own and what comes with it — no hidden recurring charges.
        </p>
        <div
          className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5 ${
            isOwner
              ? 'border-emerald-500/40 bg-emerald-500/5'
              : 'border-gray-800 bg-[#0d0d0d]'
          }`}
        >
          <div>
            <p className="text-xl font-bold">
              {isOwner ? 'One-Leak Repair Sprint' : 'Free'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {isOwner
                ? 'Targeted AI prompts for one failing conversion signal, delivered instantly. Includes a 30-day re-audit.'
                : 'Free landing page audit — 60-second diagnosis across conversion, technical, and discoverability signals.'}
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              isOwner
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                : 'border-gray-700 bg-gray-500/10 text-gray-300'
            }`}
          >
            {isOwner ? 'OWNED' : 'NO PURCHASES YET'}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-800 bg-[#0d0d0d] p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Audits</p>
            <p className="text-lg font-semibold mt-1">Unlimited in MVP</p>
            <p className="text-xs text-gray-500 mt-1">Every run saved to this workspace.</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-[#0d0d0d] p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Total paid</p>
            <p className="text-lg font-semibold mt-1">{fmtUsd(summary.totalSpentCents)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {summary.purchaseCount} {summary.purchaseCount === 1 ? 'purchase' : 'purchases'}
            </p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-[#0d0d0d] p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Billing</p>
            <p className="text-lg font-semibold mt-1">One-time</p>
            <p className="text-xs text-gray-500 mt-1">No subscription, no auto-renewal.</p>
          </div>
        </div>
      </section>

      {/* Purchase history */}
      <section className="rounded-2xl border border-gray-800 bg-[#0a0a0a] p-6">
        <h2 className="text-lg font-semibold mb-1">Purchase history</h2>
        <p className="text-sm text-gray-400 mb-4">
          Confirmed payments recorded from Stripe.
        </p>
        {summary.purchases.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-800 p-8 text-center">
            <p className="text-gray-300 font-medium">No purchases yet</p>
            <p className="text-sm text-gray-500 mt-1">
              When you buy the One-Leak Repair Sprint, the receipt and fulfillment status
              appear here automatically.
            </p>
            <a
              href="/pricing"
              className="mt-4 inline-block rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400"
            >
              See pricing
            </a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-800">
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">Item</th>
                  <th className="pb-2 pr-4 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {summary.purchases.map((p) => (
                  <tr key={p.stripeSessionId} className="border-b border-gray-800/60">
                    <td className="py-3 pr-4 text-gray-400">{fmtDate(p.createdAt)}</td>
                    <td className="py-3 pr-4 font-medium">{p.name}</td>
                    <td className="py-3 pr-4 text-gray-300">
                      {fmtUsd(p.amountCents)}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[p.fulfillment.tone]}`}
                      >
                        {p.fulfillment.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 text-xs text-gray-500">
          {summary.billingPortalUrl ? (
            <a
              href={summary.billingPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline"
            >
              Open Stripe customer portal → invoices, receipts, payment methods
            </a>
          ) : (
            <>
              Receipts are emailed by Stripe for every payment. Need a copy or have a billing
              question?{' '}
              <a href="mailto:hello@nebulacomponents.shop" className="text-emerald-400 hover:underline">
                hello@nebulacomponents.shop
              </a>
            </>
          )}
        </div>
      </section>

      {/* Upgrade paths */}
      <section className="rounded-2xl border border-gray-800 bg-[#0a0a0a] p-6">
        <h2 className="text-lg font-semibold mb-1">Go further</h2>
        <p className="text-sm text-gray-400 mb-4">
          Higher-touch offers for when you want Nebula more involved.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-800 bg-[#0d0d0d] p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">Agency Partner</p>
            <p className="text-2xl font-bold mt-1">$497</p>
            <p className="text-sm text-gray-400 mt-2">
              Run audits for client sites with partner-level access and white-labeling.
            </p>
            <a
              href="https://buy.stripe.com/aFa8wPc2o7YM9613Ro43S0d"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-white/10"
            >
              Buy now
            </a>
          </div>
          <div className="rounded-xl border border-gray-800 bg-[#0d0d0d] p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">Retainer</p>
            <p className="text-2xl font-bold mt-1">$1,497</p>
            <p className="text-sm text-gray-400 mt-2">
              Nebula implements the fixes for you — ongoing conversion work, month to month.
            </p>
            <a
              href="https://buy.stripe.com/00w5kD1nK0wkaa573A43S0c"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-white/10"
            >
              Buy now
            </a>
          </div>
          <div className="rounded-xl border border-gray-800 bg-[#0d0d0d] p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">Monitoring</p>
            <p className="text-2xl font-bold mt-1">Soon</p>
            <p className="text-sm text-gray-400 mt-2">
              Scheduled re-audits and alerts when a signal regresses. Not available yet.
            </p>
            <span className="mt-4 inline-block rounded-lg border border-gray-800 px-4 py-2 text-sm font-semibold text-gray-500">
              Coming soon
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
