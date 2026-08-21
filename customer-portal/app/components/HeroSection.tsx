'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  Globe,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { SignalHorizon } from './SignalHorizon'
import VisibilityBeacon from '@/components/VisibilityBeacon'
import { trackClientFunnelEvent } from '@/app/lib/client-funnel'

const ScaledDashboard = dynamic(() => import('./ScaledDashboard'), { ssr: false })

export const HeroSection: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAuditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget
    const input = form.elements.namedItem('url')
    if (input instanceof HTMLInputElement) {
      const trimmed = input.value.trim()
      if (trimmed && !/^https?:\/\//i.test(trimmed)) {
        input.value = `https://${trimmed}`
      }
    }

    setIsSubmitting(true)

    trackClientFunnelEvent('audit_cta_clicked', {
      cta_id: 'hero_run_free_audit',
      cta_location: 'homepage_hero',
      target_url: '/audit',
      has_url: true,
    })
  }

  return (
    <section
      className="relative overflow-hidden bg-bg text-fg flex flex-col justify-between pt-8 sm:pt-12 pb-0 selection:bg-accent selection:text-bg"
      aria-label="Nebula Conversion Diagnostics Hero"
    >
      {/* 1. Atmospheric Ambient Background Lighting & Calibration Grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden [contain:paint_layout]"
      >
        {/* Heavy blurs stay off mobile */}
        <div className="absolute top-24 left-1/2 hidden h-[450px] w-[900px] -translate-x-1/2 rounded-full bg-accent/[0.06] blur-[120px] md:block" />
        <div className="absolute top-16 right-[20%] hidden h-[300px] w-[400px] rounded-full bg-[#3b82f6]/[0.03] blur-[100px] md:block" />

        {/* Diagnostic Hairline Calibration Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #e8ebe7 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Viewport Boundary Calibration Corners */}
        <div className="absolute top-4 left-4 w-3 h-3 border-t border-l border-fg-muted/40" />
        <div className="absolute top-4 right-4 w-3 h-3 border-t border-r border-fg-muted/40" />
      </div>

      {/* 2. Center Hero Content Block */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bg-panel border border-border text-xs text-fg-muted mb-4 sm:mb-6 shadow-inner">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="font-mono text-fg">9 Conversion Signals</span>
          <span className="text-fg-muted/60">|</span>
          <span>Evidence-Backed Diagnosis</span>
        </div>

        {/* 2-Line Headline */}
        <h1 className="font-sans font-normal leading-[1.04] tracking-tight text-[38px] min-[400px]:text-[44px] sm:text-6xl lg:text-7xl xl:text-[76px] text-fg">
          <span className="block">Find page-side leaks.</span>
          <span className="block text-fg-muted mt-1 sm:mt-2">
            Before blaming the traffic.
          </span>
        </h1>

        {/* Unified Pill Search / Primary CTA Bar */}
        <div className="mt-6 sm:mt-8 max-w-xl mx-auto">
          <VisibilityBeacon
            beaconId="homepage_hero_audit_cta"
            eventName="audit_cta_exposed"
            properties={{
              cta_id: 'hero_run_free_audit',
              cta_location: 'homepage_hero',
            }}
          >
          <form
            action="/audit"
            method="get"
            onSubmit={handleAuditSubmit}
            className="relative overflow-hidden flex items-center rounded-full bg-bg-panel/90 backdrop-blur-xl border border-border p-1.5 pl-4 sm:pl-5 shadow-[0_12px_40px_rgba(0,0,0,0.7),0_0_30px_rgba(199,255,47,0.08)] focus-within:border-accent/60 focus-within:shadow-[0_0_35px_rgba(199,255,47,0.18)] transition-all"
          >
            <Globe className="h-4 w-4 shrink-0 mr-2.5 text-fg-muted transition-colors" />
            <label htmlFor="hero-landing-url" className="sr-only">
              Landing Page URL
            </label>
            <input
              id="hero-landing-url"
              name="url"
              type="text"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              placeholder="https://yourlandingpage.com/pricing"
              className="w-full bg-transparent text-sm sm:text-base text-fg placeholder:text-fg-muted/70 focus:outline-none"
            />
            <input type="hidden" name="utm_source" value="hero-search" />

            {/* Unified Submit CTA Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              aria-label="Run Free Audit"
              className="group relative flex h-10 sm:h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-accent px-4 sm:px-5 font-semibold text-xs sm:text-sm text-bg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-75 shadow-sm"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 rounded-full border-2 border-bg border-t-transparent animate-spin" />
              ) : (
                <>
                  <span>Run Free Audit</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
          </VisibilityBeacon>

          {/* Secondary Discovery Link */}
          <div className="mt-3.5 flex items-center justify-center gap-1.5 text-xs sm:text-sm text-fg-muted">
            <span>or</span>
            <Link
              href="/teardowns"
              className="inline-flex items-center gap-1 font-medium text-fg hover:text-accent transition-colors"
            >
              <span>explore verified public teardowns</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Plain Audience Language Subhead (D1.6, D2.1, D1.1) */}
        <p className="mt-6 text-sm sm:text-base text-fg-muted max-w-xl mx-auto leading-relaxed">
          Check your landing page against 9 conversion signals before spending more on ads. See what&apos;s wrong. Ranked by priority. No signup.
        </p>

        {/* Quantity Proof & Recent Audits Texture (D3.1) */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="flex items-center -space-x-2 overflow-hidden py-1">
            {[
              { initial: 'LC', bg: 'bg-emerald-800 text-emerald-200' },
              { initial: 'NS', bg: 'bg-blue-800 text-blue-200' },
              { initial: 'FR', bg: 'bg-purple-800 text-purple-200' },
              { initial: 'ZP', bg: 'bg-amber-800 text-amber-200' },
              { initial: 'BC', bg: 'bg-rose-800 text-rose-200' },
              { initial: 'NT', bg: 'bg-cyan-800 text-cyan-200' },
            ].map((av, idx) => (
              <div
                key={idx}
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full border border-border text-[9px] font-bold font-mono ${av.bg}`}
              >
                {av.initial}
              </div>
            ))}
          </div>
          <p className="text-xs text-fg-muted font-mono">
            <span className="font-semibold text-fg">147+ landing pages analyzed</span> · <span className="text-accent font-semibold">2.9 avg leaks</span> found
          </p>
        </div>

        {/* Diagnostic Trust Signals Strip */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono text-fg-muted">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
            <span>Inspectable findings</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            <span>Preserved DOM evidence</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>$97 One-Leak Sprint option</span>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-10 sm:h-14 lg:h-18" />

      {/* Instrument preview is desktop-only */}
      <div className="relative z-10 hidden w-full overflow-hidden md:-mb-20 md:block lg:-mb-32">
        <ScaledDashboard />
      </div>
      <SignalHorizon />
    </section>
  )
}

export default HeroSection
