'use client'

import { useState } from 'react'
import {
  SUBSCRIPTION_PLANS,
  PAID_PLAN_KEYS,
  type BillingInterval,
  type PlanKey,
} from '@/app/lib/subscription-plans'

function PlanCard({
  planKey,
  interval,
  onSubscribe,
  busy,
}: {
  planKey: PlanKey
  interval: BillingInterval
  onSubscribe: (plan: PlanKey) => void
  busy: PlanKey | null
}) {
  const plan = SUBSCRIPTION_PLANS[planKey]
  const price = interval === 'annual' ? plan.annualUsd : plan.monthlyUsd
  const suffix = interval === 'annual' ? '/yr' : '/mo'
  const isFree = planKey === 'free'

  return (
    <div
      className={`flex flex-col rounded-2xl border p-6 ${
        plan.highlighted
          ? 'border-accent bg-accent/5'
          : 'border-border bg-bg-muted/10'
      }`}
    >
      {plan.highlighted && (
        <span className="mb-2 inline-flex w-fit rounded-full bg-accent/20 px-3 py-0.5 text-xs font-semibold text-accent">
          Most popular
        </span>
      )}
      <h3 className="text-xl font-semibold text-fg">{plan.name}</h3>
      <p className="mt-1 text-sm italic text-fg-muted">{plan.tagline}</p>
      <p className="mt-3 text-3xl font-bold text-fg">
        {isFree ? 'Free' : `$${price}`}
        {!isFree && <span className="text-base font-normal text-fg-muted">{suffix}</span>}
      </p>
      {!isFree && interval === 'annual' && plan.monthlyUsd != null && plan.annualUsd != null && (
        <p className="mt-1 text-xs text-fg-muted">
          ${Math.round(plan.annualUsd / 12)}/mo effective — 2 months free
        </p>
      )}
      <ul className="mt-5 flex-1 space-y-2 text-sm text-fg-muted">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-fg-muted" />
            {f}
          </li>
        ))}
      </ul>
      {isFree ? (
        <a
          href="/audit"
          className="mt-6 inline-flex justify-center rounded-xl border border-border px-5 py-3 font-semibold text-fg transition-colors hover:border-accent"
        >
          Run free audit
        </a>
      ) : (
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => onSubscribe(planKey)}
          className={`mt-6 inline-flex justify-center rounded-xl px-5 py-3 font-semibold transition-colors disabled:opacity-60 ${
            plan.highlighted
              ? 'bg-accent text-bg hover:bg-accent-light'
              : 'border border-border text-fg hover:border-accent'
          }`}
        >
          {busy === planKey ? 'Redirecting…' : `Start ${plan.name}`}
        </button>
      )}
    </div>
  )
}

export default function MembershipGrid() {
  const [interval, setInterval] = useState<BillingInterval>('monthly')
  const [busy, setBusy] = useState<PlanKey | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function subscribe(plan: PlanKey) {
    setBusy(plan)
    setError(null)
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, interval }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Could not start checkout')
      }
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout')
      setBusy(null)
    }
  }

  return (
    <section aria-labelledby="membership-plans" className="mt-4">
      <div className="mb-8 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setInterval('monthly')}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            interval === 'monthly' ? 'bg-accent text-bg' : 'border border-border text-fg-muted'
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setInterval('annual')}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            interval === 'annual' ? 'bg-accent text-bg' : 'border border-border text-fg-muted'
          }`}
        >
          Annual <span className="ml-1 text-xs opacity-80">save 17%</span>
        </button>
      </div>

      {error && (
        <p role="alert" className="mb-6 text-center text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <PlanCard planKey="free" interval={interval} onSubscribe={subscribe} busy={busy} />
        {PAID_PLAN_KEYS.map((key) => (
          <PlanCard key={key} planKey={key} interval={interval} onSubscribe={subscribe} busy={busy} />
        ))}
      </div>
    </section>
  )
}
