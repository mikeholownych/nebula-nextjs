'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

// Industry baseline conversion rate for landing pages with paid traffic
const BASELINE_CR = 0.02  // 2% - conservative, well-documented average

// ── types ────────────────────────────────────────────────────────────────────

interface CalcState {
  adSpend: string
  cpc: string
  currentCR: string
}

// ── component ────────────────────────────────────────────────────────────────

export default function ROICalculator() {
  const [state, setState] = useState<CalcState>({
    adSpend: '',
    cpc: '',
    currentCR: '',
  })
  const [touched, setTouched] = useState(false)

  const update = useCallback((field: keyof CalcState, value: string) => {
    setState(prev => ({ ...prev, [field]: value }))
    setTouched(true)
  }, [])

  // Parse inputs
  const monthlySpend = parseFloat(state.adSpend.replace(/[^0-9.]/g, '')) || 0
  const avgCPC = parseFloat(state.cpc.replace(/[^0-9.]/g, '')) || 0
  const crInput = parseFloat(state.currentCR.replace(/[^0-9.]/g, '')) || 0
  const currentCR = crInput / 100  // convert % to decimal

  // Derived
  const hasEnoughData = monthlySpend > 0 && avgCPC > 0 && crInput > 0
  const monthlyClicks = avgCPC > 0 ? Math.round(monthlySpend / avgCPC) : 0
  const currentConversions = Math.round(monthlyClicks * currentCR)
  const baselineConversions = Math.round(monthlyClicks * BASELINE_CR)
  const missedConversions = Math.max(0, baselineConversions - currentConversions)
  // What those missed conversions cost in ad spend to generate (approximate)
  const wastedMonthly = currentCR < BASELINE_CR
    ? Math.round(monthlySpend * (1 - currentCR / BASELINE_CR))
    : 0
  const wastedAnnual = wastedMonthly * 12
  const isBelow = currentCR > 0 && currentCR < BASELINE_CR

  return (
    <section className="border-b border-border bg-bg-muted/20 px-6 py-14">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
<div className="mb-8 text-center">
           <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
             Before you run your audit
           </p>
           <h2 className="text-2xl font-bold tracking-tight text-fg md:text-3xl">
             Estimated opportunity cost based on industry baseline
           </h2>
           <p className="mt-2 text-sm text-fg-muted">
             Enter your numbers. See the estimated gap between your current performance and a conservative industry baseline.
           </p>
         </div>

        {/* Inputs */}
        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-fg-muted uppercase tracking-wider">
              Monthly ad spend
            </span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted text-sm">$</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="1200"
                value={state.adSpend}
                onChange={e => update('adSpend', e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-surface pl-7 pr-3 py-3 text-sm text-fg placeholder:text-fg-muted/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-fg-muted uppercase tracking-wider">
              Avg cost per click
            </span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted text-sm">$</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step={0.01}
                placeholder="2.50"
                value={state.cpc}
                onChange={e => update('cpc', e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-surface pl-7 pr-3 py-3 text-sm text-fg placeholder:text-fg-muted/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-fg-muted uppercase tracking-wider">
              Current conversion rate
            </span>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step={0.1}
                placeholder="0.4"
                value={state.currentCR}
                onChange={e => update('currentCR', e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-surface pl-3 pr-7 py-3 text-sm text-fg placeholder:text-fg-muted/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted text-sm">%</span>
            </div>
          </label>
        </div>

        {/* Results */}
        {hasEnoughData && (
          <div className="mt-8 rounded-lg border border-border bg-bg-surface overflow-hidden">
{isBelow ? (
               <>
                 {/* Main number - the gut punch */}
                 <div className="bg-signal-fail/8 border-b border-signal-fail/20 p-6 text-center">
                   <p className="text-xs font-semibold uppercase tracking-wider text-signal-fail mb-1">
                     Estimated monthly ad spend gap vs. 2% baseline
                   </p>
                   <p className="text-5xl font-extrabold text-fg tracking-tight">
                     {fmt(wastedMonthly)}
                   </p>
                   <p className="mt-1 text-sm text-fg-muted">
                     That&apos;s {fmt(wastedAnnual)} this year if performance remains unchanged.
                   </p>
                 </div>

{/* Supporting math */}
                 <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
                   <div className="p-5 text-center">
                     <p className="text-2xl font-bold text-fg">{monthlyClicks.toLocaleString()}</p>
                     <p className="mt-0.5 text-xs text-fg-muted">clicks bought this month</p>
                   </div>
                   <div className="p-5 text-center">
                     <p className="text-2xl font-bold text-fg">{missedConversions}</p>
                     <p className="mt-0.5 text-xs text-fg-muted">conversions missed vs. 2% baseline</p>
                   </div>
                   <div className="p-5 text-center">
                     <p className="text-2xl font-bold text-fg">{(currentCR * 100).toFixed(1)}% → 2%</p>
                     <p className="mt-0.5 text-xs text-fg-muted">the gap the page would need to close to reach baseline</p>
                   </div>
                 </div>
                 {/* Disclaimer */}
                 <div className="p-4 text-center text-sm text-fg-muted">
                   <p>Note: This calculation assumes a 2% baseline conversion rate for landing pages with paid traffic - a conservative industry benchmark. It estimates the potential opportunity cost if your page performed at this baseline, not actual revenue lost. Many factors affect conversion rate including audience quality, offer strength, and competition. The audit identifies specific, fixable page conditions that may contribute to performance gaps.</p>
                 </div>

                {/* CTA */}
                <div className="border-t border-border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-sm text-fg-muted">
                    Find exactly what&apos;s causing this - free, no signup, under 2 minutes.
                  </p>
                  <Link
                    href="/audit?utm_source=calculator&utm_medium=homepage"
                    className="shrink-0 rounded-lg bg-accent px-6 py-3 font-semibold text-bg hover:opacity-85 hover:bg-accent transition-colors text-sm whitespace-nowrap"
                  >
                    Show Me the Leak &rarr;
                  </Link>
                </div>
              </>
            ) : (
/* Already at or above baseline */
             <div className="p-6 text-center">
               <p className="text-lg font-semibold text-fg">
                 Your conversion rate is at or above the 2% baseline.
               </p>
               <p className="mt-1 text-sm text-fg-muted">
                 Still worth auditing - most pages above 2% have at least one fixable signal holding them back from higher performance.
               </p>
               <Link
                 href="/audit?utm_source=calculator&utm_medium=homepage"
                 className="mt-4 inline-block rounded-lg bg-accent px-6 py-3 font-semibold text-bg hover:opacity-85 hover:bg-accent transition-colors text-sm"
               >
                 Find What&apos;s Still Leaking &rarr;
               </Link>
             </div>
            )}
          </div>
        )}

        {/* Empty state prompt */}
        {!hasEnoughData && touched && (
          <p className="mt-4 text-center text-xs text-fg-muted">
            Fill in all three fields to see your numbers.
          </p>
        )}

        {!touched && (
          <p className="mt-6 text-center text-xs text-fg-muted">
            Don&apos;t know your conversion rate? Run the free audit - it&apos;s in the results.
          </p>
        )}

      </div>
    </section>
  )
}
