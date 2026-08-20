'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

function fmtCurrency(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val)
}

function fmtNumber(val: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(val))
}

export default function RoiCalculatorView() {
  const [visitors, setVisitors] = useState(15000)
  const [conversionRate, setConversionRate] = useState(2.0)
  const [aov, setAov] = useState(120)
  const [expectedLift, setExpectedLift] = useState(35)

  const calc = useMemo(() => {
    const currentCrDecimal = conversionRate / 100
    const newCrDecimal = (conversionRate * (1 + expectedLift / 100)) / 100

    const currentMonthlyConversions = visitors * currentCrDecimal
    const newMonthlyConversions = visitors * newCrDecimal
    const additionalMonthlyConversions = newMonthlyConversions - currentMonthlyConversions

    const currentMonthlyRevenue = currentMonthlyConversions * aov
    const newMonthlyRevenue = newMonthlyConversions * aov
    const additionalMonthlyRevenue = newMonthlyRevenue - currentMonthlyRevenue
    const additionalAnnualRevenue = additionalMonthlyRevenue * 12

    const sprintCost = 97
    const annualRoi = Math.round(((additionalAnnualRevenue - sprintCost) / sprintCost) * 100)

    return {
      currentMonthlyConversions,
      newMonthlyConversions,
      additionalMonthlyConversions,
      currentMonthlyRevenue,
      newMonthlyRevenue,
      additionalMonthlyRevenue,
      additionalAnnualRevenue,
      newConversionRate: conversionRate * (1 + expectedLift / 100),
      annualRoi,
    }
  }, [visitors, conversionRate, aov, expectedLift])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-bg-panel p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Revenue Growth Modeling
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-fg mb-2">
              Conversion ROI &amp; Revenue Lift Calculator
            </h2>
            <p className="text-sm text-fg-muted leading-relaxed">
              Calculate exactly how much recoverable revenue you gain by eliminating conversion leaks, fixing above-the-fold CTA contrast, and improving mobile viewport load speeds.
            </p>
          </div>

          <div className="shrink-0">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-xs font-bold text-bg hover:opacity-85 transition-opacity"
            >
              <span>Fix Your Leak for $97 →</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Inputs + Output Display */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left column: Sliders (5 cols) */}
        <div className="space-y-6 rounded-xl border border-border bg-bg-panel p-6 lg:col-span-6">
          <h3 className="text-base font-bold text-fg">Your Website Metrics</h3>

          {/* Monthly Visitors */}
          <div>
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-semibold text-fg-dim uppercase tracking-wider">
                Monthly Unique Visitors
              </span>
              <span className="font-mono font-bold text-fg text-sm">
                {fmtNumber(visitors)}
              </span>
            </div>
            <input
              type="range"
              min={1000}
              max={250000}
              step={1000}
              value={visitors}
              onChange={(e) => setVisitors(Number(e.target.value))}
              className="w-full accent-accent cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-fg-dim mt-1">
              <span>1k</span>
              <span>100k</span>
              <span>250k+</span>
            </div>
          </div>

          {/* Current Conversion Rate */}
          <div>
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-semibold text-fg-dim uppercase tracking-wider">
                Current Conversion Rate
              </span>
              <span className="font-mono font-bold text-fg text-sm">
                {conversionRate.toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min={0.2}
              max={8.0}
              step={0.1}
              value={conversionRate}
              onChange={(e) => setConversionRate(Number(e.target.value))}
              className="w-full accent-accent cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-fg-dim mt-1">
              <span>0.2% (Low)</span>
              <span>2.0% (Average)</span>
              <span>8.0% (High)</span>
            </div>
          </div>

          {/* Average Order Value / LTV */}
          <div>
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-semibold text-fg-dim uppercase tracking-wider">
                Average Customer Value (AOV / LTV)
              </span>
              <span className="font-mono font-bold text-fg text-sm">
                ${aov}
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={1000}
              step={10}
              value={aov}
              onChange={(e) => setAov(Number(e.target.value))}
              className="w-full accent-accent cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-fg-dim mt-1">
              <span>$10</span>
              <span>$250</span>
              <span>$1,000+</span>
            </div>
          </div>

          {/* Expected Improvement */}
          <div>
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-semibold text-fg-dim uppercase tracking-wider">
                Expected Lift from Repair Sprint
              </span>
              <span className="font-mono font-bold text-accent text-sm">
                +{expectedLift}%
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={expectedLift}
              onChange={(e) => setExpectedLift(Number(e.target.value))}
              className="w-full accent-accent cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-fg-dim mt-1">
              <span>+10%</span>
              <span>+35% (Typical)</span>
              <span>+100% (2x)</span>
            </div>
          </div>
        </div>

        {/* Right column: ROI & Gains Card (7 cols) */}
        <div className="flex flex-col justify-between rounded-xl border border-accent/30 bg-bg-panel p-6 lg:col-span-6">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
              <h3 className="text-base font-bold text-fg">Your Revenue Potential</h3>
              <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-0.5 text-xs font-semibold text-accent">
                Projected Impact
              </span>
            </div>

            {/* Big ROI Hero */}
            <div className="rounded-xl border border-border bg-bg-elevated/70 p-5 text-center mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-fg-dim">
                Estimated Annual ROI (vs $97 Repair Sprint)
              </p>
              <p className="text-4xl sm:text-5xl font-black text-accent mt-2 tracking-tight">
                +{fmtNumber(calc.annualRoi)}%
              </p>
              <p className="text-xs text-fg-muted mt-2">
                Based on generating {fmtCurrency(calc.additionalAnnualRevenue)} in additional annual gross revenue
              </p>
            </div>

            {/* Metric Comparison Matrix */}
            <div className="grid gap-3 sm:grid-cols-2 mb-6">
              <div className="rounded-lg border border-border bg-bg p-3.5">
                <p className="text-[11px] text-fg-dim">Current Monthly Revenue</p>
                <p className="text-lg font-bold text-fg mt-0.5">
                  {fmtCurrency(calc.currentMonthlyRevenue)}
                </p>
                <p className="text-[10px] text-fg-muted mt-0.5">
                  {fmtNumber(calc.currentMonthlyConversions)} conversions / mo
                </p>
              </div>

              <div className="rounded-lg border border-accent/30 bg-accent/5 p-3.5">
                <p className="text-[11px] text-accent font-medium">After Optimization</p>
                <p className="text-lg font-bold text-accent mt-0.5">
                  {fmtCurrency(calc.newMonthlyRevenue)}
                </p>
                <p className="text-[10px] text-accent/80 mt-0.5">
                  {fmtNumber(calc.newMonthlyConversions)} conversions / mo ({calc.newConversionRate.toFixed(2)}% CR)
                </p>
              </div>
            </div>

            {/* Additional Gains Breakdown */}
            <div className="space-y-2 border-t border-border pt-4 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-fg-muted">Additional Monthly Revenue:</span>
                <span className="font-bold text-accent">+{fmtCurrency(calc.additionalMonthlyRevenue)} / mo</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-fg-muted">Additional Annual Revenue:</span>
                <span className="font-bold text-fg">+{fmtCurrency(calc.additionalAnnualRevenue)} / yr</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-fg-muted">Additional Annual Customers:</span>
                <span className="font-bold text-fg">+{fmtNumber(calc.additionalMonthlyConversions * 12)} buyers</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <Link
              href="/pricing"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 text-xs font-bold text-bg hover:opacity-85 transition-opacity"
            >
              <span>Unlock This Growth - Order $97 Sprint</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Conversion Leaks with Highest ROI */}
      <div className="rounded-xl border border-border bg-bg-panel p-6">
        <h4 className="text-sm font-bold text-fg mb-4">
          Where Most Recoverable Revenue is Lost
        </h4>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-bg-elevated p-4">
            <p className="text-xs font-bold text-fg">1. Above-the-Fold Contrast</p>
            <p className="text-xs text-fg-muted mt-1 leading-relaxed">
              When CTAs blend into background imagery, 20-30% of paid ad visitors bounce before taking any action.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-bg-elevated p-4">
            <p className="text-xs font-bold text-fg">2. Mobile Viewport Shift (CLS)</p>
            <p className="text-xs text-fg-muted mt-1 leading-relaxed">
              Layout shifts during mobile load cause mis-clicks and immediate back-button bounces on iOS and Android.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-bg-elevated p-4">
            <p className="text-xs font-bold text-fg">3. Ad Message Mismatch</p>
            <p className="text-xs text-fg-muted mt-1 leading-relaxed">
              If the headline doesn&rsquo;t echo the exact offer from the ad campaign, conversion rate drops by up to 50%.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
